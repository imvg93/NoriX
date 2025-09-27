import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import KYC from '../models/KYC';
import User from '../models/User';
import { KYCAudit } from '../models/KYCAudit';
import { authenticateToken, AuthRequest, requireEmployer } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, ValidationError } from '../middleware/errorHandler';
import { uploadImage, deleteImage } from '../config/cloudinary';
import { computeKycStatus, getKycStatusMessage } from '../utils/kycStatusHelper';
import EmployerKYC from '../models/EmployerKYC';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/kyc');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @route   GET /api/kyc/profile
// @desc    Get user's KYC profile
// @access  Private
router.get('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const kyc = await KYC.findOne({ userId: req.user!._id, isActive: true })
    .populate('userId', 'name email phone userType');
  
  if (!kyc) {
    return sendSuccessResponse(res, { kyc: null }, 'No KYC profile found');
  }

  sendSuccessResponse(res, { kyc }, 'KYC profile retrieved successfully');
}));

// Test route to debug
router.get('/employer/test', (req, res) => {
  res.json({ message: 'Employer KYC test route is working!' });
});

// ===== Employer KYC endpoints =====
// POST /api/kyc/employer → submit employer KYC to employer_kyc collection
router.post('/employer', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const employerId = req.user!._id;
  const { 
    companyName, 
    companyEmail, 
    companyPhone, 
    authorizedName, 
    designation, 
    address, 
    city, 
    latitude, 
    longitude, 
    GSTNumber, 
    PAN, 
    documents 
  } = req.body || {};

  // Validate required fields
  if (!companyName || !companyName.trim()) {
    throw new ValidationError('Company name is required');
  }

  // Check if KYC is already approved
  const existing = await EmployerKYC.findOne({ employerId });
  if (existing && existing.status === 'approved') {
    throw new ValidationError('KYC already approved. Cannot modify approved KYC.');
  }

  // Prepare KYC data
  const kycData: any = {
    employerId,
    companyName: companyName.trim(),
    companyEmail: companyEmail?.trim() || undefined,
    companyPhone: companyPhone?.trim() || undefined,
    authorizedName: authorizedName?.trim() || undefined,
    designation: designation?.trim() || undefined,
    address: address?.trim() || undefined,
    city: city?.trim() || undefined,
    latitude: latitude?.trim() || undefined,
    longitude: longitude?.trim() || undefined,
    GSTNumber: GSTNumber?.trim() || undefined,
    PAN: PAN?.trim() || undefined,
    documents: documents || {},
    status: 'pending',
    submittedAt: new Date()
  };

  // If resubmitting after rejection, clear rejection reason
  if (existing?.status === 'rejected') {
    delete kycData.rejectionReason;
  }

  // Save or update KYC record
  const record = await EmployerKYC.findOneAndUpdate(
    { employerId },
    { $set: kycData },
    { new: true, upsert: true }
  );

  // Update User model for compatibility with existing job posting logic
  const updatedUser = await User.findByIdAndUpdate(employerId, {
    kycStatus: 'pending',
    isVerified: false,
    kycPendingAt: new Date(),
    $unset: { kycVerifiedAt: 1, kycRejectedAt: 1 }
  }, { new: true });

  console.log('✅ Employer KYC submitted successfully:', {
    employerId,
    kycId: record._id,
    status: record.status,
    userKycStatus: updatedUser?.kycStatus,
    submittedAt: record.submittedAt
  });

  return sendSuccessResponse(res, { 
    kyc: record,
    user: {
      _id: updatedUser?._id,
      kycStatus: updatedUser?.kycStatus,
      isVerified: updatedUser?.isVerified
    },
    completionPercentage: (record as any).completionPercentage,
    fullAddress: (record as any).fullAddress
  }, 'Employer KYC submitted successfully');
}));

// GET /api/kyc/employer/:id/status → fetch employer KYC status
router.get('/employer/:id/status', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  
  console.log('🔍 Fetching KYC status for employer:', id);
  
  // Get user KYC status
  const user = await User.findById(id).select('kycStatus isVerified kycVerifiedAt kycRejectedAt kycPendingAt');
  
  // Get detailed KYC record
  const kycRecord = await EmployerKYC.findOne({ employerId: id });
  
  // Determine the most accurate status
  let status = 'not-submitted';
  if (kycRecord) {
    status = kycRecord.status;
  } else if (user?.kycStatus) {
    status = user.kycStatus;
  }
  
  console.log('📊 KYC Status Debug:', {
    employerId: id,
    userKycStatus: user?.kycStatus,
    kycRecordStatus: kycRecord?.status,
    finalStatus: status,
    hasKycRecord: !!kycRecord,
    userVerified: user?.isVerified
  });
  
  return sendSuccessResponse(res, { 
    status, 
    kyc: kycRecord,
    user: {
      kycStatus: user?.kycStatus,
      isVerified: user?.isVerified,
      kycVerifiedAt: user?.kycVerifiedAt,
      kycRejectedAt: user?.kycRejectedAt,
      kycPendingAt: user?.kycPendingAt
    },
    completionPercentage: (kycRecord as any)?.completionPercentage || 0,
    fullAddress: (kycRecord as any)?.fullAddress || null,
    submittedAt: kycRecord?.submittedAt || null,
    reviewedAt: kycRecord?.reviewedAt || null
  }, 'Employer KYC status retrieved');
}));

// ===== Admin KYC Management Endpoints =====
// GET /api/kyc/admin/pending → Get all pending employer KYC
router.get('/admin/pending', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // Check if user is admin
  if (req.user?.userType !== 'admin') {
    throw new ValidationError('Admin access required');
  }

  const pendingKYC = await EmployerKYC.find({ status: 'pending' })
    .populate('employerId', 'name email companyName phone')
    .sort({ submittedAt: -1 });

  return sendSuccessResponse(res, { 
    pendingKYC,
    count: pendingKYC.length 
  }, 'Pending KYC records retrieved');
}));

// PATCH /api/kyc/admin/:id/approve → Approve employer KYC
router.patch('/admin/:id/approve', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // Check if user is admin
  if (req.user?.userType !== 'admin') {
    throw new ValidationError('Admin access required');
  }

  const { id } = req.params;

  const kycRecord = await EmployerKYC.findById(id);
  if (!kycRecord) {
    throw new ValidationError('KYC record not found');
  }

  // Update KYC status to approved
  kycRecord.status = 'approved';
  kycRecord.reviewedBy = req.user._id;
  kycRecord.reviewedAt = new Date();
  kycRecord.rejectionReason = undefined;
  
  await kycRecord.save();

  // Update User model
  await User.findByIdAndUpdate(kycRecord.employerId, {
    kycStatus: 'approved',
    isVerified: true,
    kycVerifiedAt: new Date(),
    $unset: { kycPendingAt: 1, kycRejectedAt: 1 }
  });

  return sendSuccessResponse(res, { kyc: kycRecord }, 'KYC approved successfully');
}));

// PATCH /api/kyc/admin/:id/reject → Reject employer KYC
router.patch('/admin/:id/reject', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // Check if user is admin
  if (req.user?.userType !== 'admin') {
    throw new ValidationError('Admin access required');
  }

  const { id } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason || !rejectionReason.trim()) {
    throw new ValidationError('Rejection reason is required');
  }

  const kycRecord = await EmployerKYC.findById(id);
  if (!kycRecord) {
    throw new ValidationError('KYC record not found');
  }

  // Update KYC status to rejected
  kycRecord.status = 'rejected';
  kycRecord.reviewedBy = req.user._id;
  kycRecord.reviewedAt = new Date();
  kycRecord.rejectionReason = rejectionReason.trim();
  
  await kycRecord.save();

  // Update User model
  await User.findByIdAndUpdate(kycRecord.employerId, {
    kycStatus: 'rejected',
    isVerified: false,
    kycRejectedAt: new Date(),
    $unset: { kycPendingAt: 1, kycVerifiedAt: 1 }
  });

  return sendSuccessResponse(res, { kyc: kycRecord }, 'KYC rejected successfully');
}));

// GET /api/kyc/admin/all → Get all employer KYC records
router.get('/admin/all', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // Check if user is admin
  if (req.user?.userType !== 'admin') {
    throw new ValidationError('Admin access required');
  }

  const { status, page = 1, limit = 10 } = req.query;
  
  const filter: any = {};
  if (status && status !== 'all') {
    filter.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const kycRecords = await EmployerKYC.find(filter)
    .populate('employerId', 'name email companyName phone')
    .populate('reviewedBy', 'name email')
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await EmployerKYC.countDocuments(filter);

  return sendSuccessResponse(res, { 
    kycRecords,
    pagination: {
      current: Number(page),
      total: Math.ceil(total / Number(limit)),
      count: kycRecords.length,
      totalRecords: total
    }
  }, 'All KYC records retrieved');
}));

// @route   GET /api/student/profile
// @desc    Get student profile with KYC status
// @access  Private (Student only)
router.get('/student/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const userId = req.user!._id;
  
  console.log('🔍 Student Profile - Fetching profile for user:', userId);
  
  // Get user details
  const user = await User.findById(userId);
  if (!user) {
    throw new ValidationError('User not found');
  }
  
  if (user.userType !== 'student') {
    throw new ValidationError('Only students can access this endpoint');
  }
  
  // Get KYC details for this user
  const kyc = await KYC.findOne({ userId, isActive: true });
  
  // Determine KYC status
  let kycStatus = 'not-submitted';
  let kycMessage = 'Please complete your KYC details.';
  let canSubmitKYC = true;
  
  if (kyc) {
    kycStatus = kyc.verificationStatus;
    
    switch (kyc.verificationStatus) {
      case 'pending':
        kycMessage = '⏳ Your KYC is under verification. Please wait.';
        canSubmitKYC = false;
        break;
      case 'approved':
        kycMessage = '✅ Your profile is verified. You can now explore and apply for jobs.';
        canSubmitKYC = false;
        break;
      case 'rejected':
        kycMessage = '❌ Your KYC was rejected. Please re-submit with proper details.';
        canSubmitKYC = true;
        break;
      default:
        kycMessage = 'Please complete your KYC details.';
        canSubmitKYC = true;
    }
  }
  
  const profileData = {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      college: user.college,
      skills: user.skills,
      availability: user.availability,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      kycStatus: user.kycStatus || 'not-submitted',
      createdAt: user.createdAt
    },
    kyc: kyc ? {
      _id: kyc._id,
      fullName: kyc.fullName,
      dob: kyc.dob,
      gender: kyc.gender,
      address: kyc.address,
      college: kyc.college,
      courseYear: kyc.courseYear,
      stayType: kyc.stayType,
      hoursPerWeek: kyc.hoursPerWeek,
      availableDays: kyc.availableDays,
      emergencyContact: kyc.emergencyContact,
      preferredJobTypes: kyc.preferredJobTypes,
      experienceSkills: kyc.experienceSkills,
      verificationStatus: kyc.verificationStatus,
      submittedAt: kyc.submittedAt,
      approvedAt: kyc.approvedAt,
      rejectedAt: kyc.rejectedAt,
      rejectionReason: kyc.rejectionReason,
      aadharCard: kyc.aadharCard ? 'uploaded' : null,
      collegeIdCard: kyc.collegeIdCard ? 'uploaded' : null
    } : null,
    kycStatus,
    kycMessage,
    canSubmitKYC
  };
  
  console.log('📊 Student Profile - Response:', {
    userId,
    kycStatus,
    hasKYC: !!kyc,
    canSubmitKYC
  });
  
  sendSuccessResponse(res, profileData, 'Student profile retrieved successfully');
}));

// @route   GET /api/kyc/student/profile
// @desc    Get canonical student profile with KYC status (single source of truth)
// @access  Private (Student only)
router.get('/student/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const userId = req.user!._id;
  
  console.log('🔍 Student Profile - Getting canonical profile for user:', userId);
  
  // Get user details
  const user = await User.findById(userId);
  if (!user) {
    throw new ValidationError('User not found');
  }
  
  if (user.userType !== 'student') {
    throw new ValidationError('Only students can access this endpoint');
  }
  
  // Get KYC record
  const kyc = await KYC.findOne({ userId, isActive: true });
  
  // Compute canonical status
  const canonicalStatus = computeKycStatus(user, kyc);
  
  // Prepare response data
  const profileData = {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      college: user.college,
      skills: user.skills,
      availability: user.availability,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      kycStatus: user.kycStatus || 'not_submitted',
      createdAt: user.createdAt
    },
    kyc: kyc ? {
      _id: kyc._id,
      fullName: kyc.fullName,
      dob: kyc.dob,
      gender: kyc.gender,
      address: kyc.address,
      college: kyc.college,
      courseYear: kyc.courseYear,
      stayType: kyc.stayType,
      hoursPerWeek: kyc.hoursPerWeek,
      availableDays: kyc.availableDays,
      emergencyContact: kyc.emergencyContact,
      preferredJobTypes: kyc.preferredJobTypes,
      experienceSkills: kyc.experienceSkills,
      verificationStatus: kyc.verificationStatus,
      submittedAt: kyc.submittedAt,
      approvedAt: kyc.approvedAt,
      rejectedAt: kyc.rejectedAt,
      rejectionReason: kyc.rejectionReason,
      aadharCard: kyc.aadharCard ? 'uploaded' : null,
      collegeIdCard: kyc.collegeIdCard ? 'uploaded' : null
    } : null,
    status: canonicalStatus,
    message: getKycStatusMessage(canonicalStatus)
  };
  
  console.log('✅ Student Profile - Canonical profile retrieved:', {
    userId: user._id,
    email: user.email,
    kycStatus: canonicalStatus.status,
    isVerified: canonicalStatus.isVerified
  });
  
  sendSuccessResponse(res, profileData, 'Student profile retrieved successfully');
}));

// @route   POST /api/kyc/refresh-status
// @desc    Force refresh KYC status (for testing/debugging)
// @access  Private (Student only)
router.post('/refresh-status', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const userId = req.user!._id;
  
  console.log('🔄 Force Refresh KYC Status - User:', userId);
  
  // Get user details
  const user = await User.findById(userId);
  if (!user) {
    throw new ValidationError('User not found');
  }
  
  if (user.userType !== 'student') {
    throw new ValidationError('Only students can access this endpoint');
  }
  
  // Get KYC record
  const kyc = await KYC.findOne({ userId, isActive: true });
  
  // Compute canonical status
  const canonicalStatus = computeKycStatus(user, kyc);
  
  // Prepare response data
  const profileData = {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      isVerified: user.isVerified,
      kycStatus: user.kycStatus || 'not_submitted'
    },
    kyc: kyc ? {
      _id: kyc._id,
      verificationStatus: kyc.verificationStatus,
      submittedAt: kyc.submittedAt,
      approvedAt: kyc.approvedAt,
      rejectedAt: kyc.rejectedAt,
      rejectionReason: kyc.rejectionReason
    } : null,
    status: canonicalStatus,
    message: getKycStatusMessage(canonicalStatus),
    refreshed: true
  };
  
  console.log('✅ Force Refresh - Status refreshed:', {
    userId: user._id,
    email: user.email,
    kycStatus: canonicalStatus.status,
    isVerified: canonicalStatus.isVerified
  });
  
  sendSuccessResponse(res, profileData, 'KYC status refreshed successfully');
}));

// @route   POST /api/kyc
// @desc    Submit KYC for logged-in user (secure endpoint with atomic transactions)
// @access  Private (Student only)
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const userId = req.user!._id;
  
  console.log('🔒 SECURE KYC Submit - Starting atomic submission');
  console.log('  User ID:', userId);
  
  // Get authenticated user details
  const user = await User.findById(userId);
  if (!user) {
    throw new ValidationError('User not found');
  }
  
  if (user.userType !== 'student') {
    throw new ValidationError('Only students can submit KYC');
  }
  
  const kycData = req.body;
  
  // SECURITY: Always use authenticated user's email and phone - never trust form input
  kycData.userId = userId;
  kycData.email = user.email;
  kycData.phone = user.phone;
  
  console.log('🔒 SECURITY: Using authenticated user details:', {
    email: user.email,
    phone: user.phone,
    userId: user._id
  });
  
  // Validate required fields
  const requiredFields = [
    'fullName', 'dob', 'address',
    'college', 'courseYear',
    'stayType', 'hoursPerWeek', 'availableDays',
    'emergencyContact'
  ];
  
  const missingFields = [];
  for (const field of requiredFields) {
    if (!kycData[field]) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    throw new ValidationError(`${missingFields.join(', ')} is required`);
  }
  
  // Use MongoDB transaction for atomic updates
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Check if KYC already exists
      const existingKYC = await KYC.findOne({ userId, isActive: true }).session(session);
      
      if (existingKYC) {
        if (existingKYC.verificationStatus === 'approved') {
          throw new ValidationError('KYC already approved. Cannot resubmit unless rejected by admin.');
        }
        
        if (existingKYC.verificationStatus === 'pending') {
          throw new ValidationError('KYC already submitted and under review');
        }
        
        // If rejected, allow resubmission - update existing record
        Object.assign(existingKYC, kycData);
        existingKYC.verificationStatus = 'pending';
        existingKYC.submittedAt = new Date();
        existingKYC.lastUpdated = new Date();
        
        await existingKYC.save({ session });
        
        // Update user status
        await User.findByIdAndUpdate(userId, {
          kycStatus: 'pending',
          isVerified: false,
          kycPendingAt: new Date()
        }, { session });
        
        // Create audit entry
        const auditEntry = new KYCAudit({
          userId,
          adminId: userId, // User is submitting their own KYC
          action: 'resubmitted',
          reason: 'Resubmission after rejection',
          prevStatus: existingKYC.verificationStatus,
          newStatus: 'pending',
          timestamp: new Date(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        await auditEntry.save({ session });
        
        console.log('✅ SECURE KYC Submit - Updated existing KYC record');
        
      } else {
        // Create new KYC record
        kycData.verificationStatus = 'pending';
        kycData.submittedAt = new Date();
        kycData.lastUpdated = new Date();
        kycData.isActive = true;
        
        const newKYC = new KYC(kycData);
        await newKYC.save({ session });
        
        // Update user status
        await User.findByIdAndUpdate(userId, {
          kycStatus: 'pending',
          isVerified: false,
          kycPendingAt: new Date()
        }, { session });
        
        // Create audit entry
        const auditEntry = new KYCAudit({
          userId,
          adminId: userId, // User is submitting their own KYC
          action: 'submitted',
          reason: 'Initial KYC submission',
          prevStatus: 'not_submitted',
          newStatus: 'pending',
          timestamp: new Date(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        await auditEntry.save({ session });
        
        console.log('✅ SECURE KYC Submit - Created new KYC record');
      }
    });
    
    // Get updated KYC record
    const updatedKYC = await KYC.findOne({ userId, isActive: true });
    const updatedUser = await User.findById(userId);
    
    // Compute canonical status
    const canonicalStatus = computeKycStatus(updatedUser!, updatedKYC);
    
    sendSuccessResponse(res, {
      kyc: updatedKYC,
      status: canonicalStatus,
      message: getKycStatusMessage(canonicalStatus)
    }, 'KYC submitted successfully', 201);
    
  } catch (error) {
    console.error('❌ SECURE KYC Submit - Transaction failed:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}));

// @route   POST /api/kyc/profile
// @desc    Create or update KYC profile
// @access  Private
router.post('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const userId = req.user!._id;
  
  console.log('🔍 KYC Profile Save - Starting profile save');
  console.log('  User ID:', userId);
  console.log('  Request body keys:', Object.keys(req.body));
  console.log('  Request body:', JSON.stringify(req.body, null, 2));
  
  // Check if user exists and is a student
  const user = await User.findById(userId);
  if (!user) {
    console.log('❌ KYC Profile Save - User not found:', userId);
    throw new ValidationError('User not found');
  }
  
  if (user.userType !== 'student') {
    console.log('❌ KYC Profile Save - User is not a student:', user.userType);
    throw new ValidationError('Only students can submit KYC profiles');
  }

  const kycData = req.body;
  
  // SECURITY: Always use authenticated user's email and phone - never trust form input
  kycData.email = user.email;
  kycData.phone = user.phone;
  
  console.log('🔒 SECURITY: Using authenticated user details:', {
    email: user.email,
    phone: user.phone,
    userId: user._id
  });
  
  // For auto-save, only validate fields that are present
  const isAutoSave = !kycData.fullName || !kycData.dob;
  
  if (!isAutoSave) {
    console.log('📋 KYC Profile Save - Complete submission detected');
    // Validate required fields for complete submission (excluding email/phone as they're auto-set)
    const requiredFields = [
      'fullName', 'dob', 'address',
      'college', 'courseYear',
      'stayType', 'hoursPerWeek', 'availableDays',
      'emergencyContact'
    ];
    
    const missingFields = [];
    for (const field of requiredFields) {
      if (!kycData[field]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      console.log('❌ KYC Profile Save - Missing required fields:', missingFields);
      throw new ValidationError(`${missingFields.join(', ')} is required`);
    }
  } else {
    console.log('📋 KYC Profile Save - Auto-save detected');
  }

  // Check if KYC already exists
  let kyc = await KYC.findOne({ userId, isActive: true });
  
  if (kyc) {
    console.log('📋 KYC Profile Save - Updating existing KYC:', kyc._id);
    // Update existing KYC - only update fields that are provided
    const updateData: any = {};
    Object.keys(kycData).forEach(key => {
      if (kycData[key] !== undefined && kycData[key] !== null) {
        updateData[key] = kycData[key];
      }
    });
    updateData.lastUpdated = new Date();
    
    await KYC.findByIdAndUpdate(kyc._id, updateData, { new: true });
    kyc = await KYC.findById(kyc._id);
    console.log('✅ KYC Profile Save - Updated existing KYC successfully');
  } else {
    console.log('📋 KYC Profile Save - Creating new KYC profile');
    // Create new KYC
    kyc = new KYC({
      userId,
      ...kycData,
      verificationStatus: 'pending'
    });
    await kyc.save();
    console.log('✅ KYC Profile Save - Created new KYC successfully');
    console.log('  New KYC ID:', kyc._id);
  }

  console.log('📊 KYC Profile Save - Final KYC data:', {
    id: kyc!._id,
    userId: kyc!.userId,
    fullName: kyc!.fullName,
    email: kyc!.email,
    phone: kyc!.phone,
    verificationStatus: kyc!.verificationStatus,
    aadharCard: kyc!.aadharCard ? 'Present' : 'Missing',
    collegeIdCard: kyc!.collegeIdCard ? 'Present' : 'Missing',
    createdAt: (kyc as any).createdAt,
    lastUpdated: kyc!.lastUpdated
  });

  sendSuccessResponse(res, { kyc }, 'KYC profile saved successfully');
}));

// @route   GET /api/kyc/test
// @desc    Test KYC route
// @access  Private
router.get('/test', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  sendSuccessResponse(res, { 
    message: 'KYC routes are working',
    userId: req.user!._id,
    timestamp: new Date()
  }, 'KYC test successful');
}));

// @route   POST /api/kyc/upload-document
// @desc    Upload KYC documents to Cloudinary
// @access  Private
router.post('/upload-document', authenticateToken, upload.single('document'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const { documentType } = req.body;
    
    if (!documentType || !['aadhar', 'college-id'].includes(documentType)) {
      throw new ValidationError('Invalid document type. Must be "aadhar" or "college-id"');
    }

    // Validate file
    if (!req.file.mimetype.startsWith('image/')) {
      throw new ValidationError('Only image files are allowed');
    }
    if (req.file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new ValidationError('File is too large (max 5MB)');
    }

    console.log('🔍 KYC Upload - Starting upload:');
    console.log('  User ID:', req.user!._id);
    console.log('  Document Type:', documentType);
    console.log('  File Name:', req.file.originalname);
    console.log('  File Size:', req.file.size, 'bytes');
    console.log('  File Type:', req.file.mimetype);
    console.log('  File Path:', req.file.path);
    console.log('  File Buffer:', req.file.buffer ? 'Present' : 'Not present');
    console.log('  File Fieldname:', req.file.fieldname);
    console.log('  File Encoding:', req.file.encoding);

    // Upload to Cloudinary in private mode
    const result = await uploadImage(req.file, `studentjobs/kyc/${req.user!._id}/${documentType}`);
    
    // Verify upload success - CRITICAL VERIFICATION
    if (!result.secure_url) {
      console.error('❌ KYC Upload - No secure_url returned from Cloudinary');
      throw new ValidationError('Image not uploaded. Please try again.');
    }

    console.log('✅ KYC Upload - Cloudinary upload successful:', {
      secure_url: result.secure_url,
      public_id: result.public_id
    });
    
    // Update KYC record with the Cloudinary URL
    const kyc = await KYC.findOne({ userId: req.user!._id, isActive: true });
    if (!kyc) {
      throw new ValidationError('KYC profile not found. Please complete your profile first.');
    }

    // Update the appropriate field based on document type
    if (documentType === 'aadhar') {
      // Delete old Aadhaar card if exists
      if (kyc.aadharCard) {
        try {
          const oldPublicId = kyc.aadharCard.split('/').pop()?.split('.')[0];
          if (oldPublicId) {
            await deleteImage(`studentjobs/kyc/${req.user!._id}/aadhar/${oldPublicId}`);
          }
        } catch (deleteError) {
          console.warn('Failed to delete old Aadhaar card:', deleteError);
        }
      }
      kyc.aadharCard = result.secure_url;
    } else if (documentType === 'college-id') {
      // Delete old College ID if exists
      if (kyc.collegeIdCard) {
        try {
          const oldPublicId = kyc.collegeIdCard.split('/').pop()?.split('.')[0];
          if (oldPublicId) {
            await deleteImage(`studentjobs/kyc/${req.user!._id}/college-id/${oldPublicId}`);
          }
        } catch (deleteError) {
          console.warn('Failed to delete old College ID:', deleteError);
        }
      }
      kyc.collegeIdCard = result.secure_url;
    }

    await kyc.save();

    console.log('✅ KYC Upload - Document saved to MongoDB successfully');

    sendSuccessResponse(res, { 
      documentUrl: result.secure_url,
      publicId: result.public_id,
      documentType,
      message: 'Image uploaded successfully'
    }, 'Document uploaded successfully');
  } catch (error) {
    console.error('❌ KYC Upload Error:', error);
    // Return the specific error message for upload failures
    if (error instanceof ValidationError) {
      throw error;
    } else {
      throw new ValidationError('Image not uploaded. Please try again.');
    }
  }
}));

// @route   DELETE /api/kyc/document/:documentType
// @desc    Delete KYC document from Cloudinary
// @access  Private
router.delete('/document/:documentType', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { documentType } = req.params;
  
  if (!['aadhar', 'college-id'].includes(documentType)) {
    throw new ValidationError('Invalid document type');
  }

  const kyc = await KYC.findOne({ userId: req.user!._id, isActive: true });
  if (!kyc) {
    throw new ValidationError('KYC profile not found');
  }

  let documentUrl = '';
  if (documentType === 'aadhar') {
    documentUrl = kyc.aadharCard || '';
    kyc.aadharCard = '';
  } else if (documentType === 'college-id') {
    documentUrl = kyc.collegeIdCard || '';
    kyc.collegeIdCard = '';
  }

  if (!documentUrl) {
    throw new ValidationError('Document not found');
  }

  try {
    // Extract public ID from Cloudinary URL and delete
    const publicId = documentUrl.split('/').pop()?.split('.')[0];
    if (publicId) {
      await deleteImage(`studentjobs/kyc/${req.user!._id}/${documentType}/${publicId}`);
    }
  } catch (deleteError) {
    console.warn('Failed to delete document from Cloudinary:', deleteError);
  }

  await kyc.save();

  sendSuccessResponse(res, {}, 'Document deleted successfully');
}));

// @route   POST /api/kyc/submit
// @desc    Submit KYC for verification
// @access  Private
router.post('/submit', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const userId = req.user!._id;
  
  console.log('🔍 KYC Submit - Starting submission process');
  console.log('  User ID:', userId);
  console.log('  Request body:', JSON.stringify(req.body, null, 2));
  
  const kyc = await KYC.findOne({ userId, isActive: true });
  if (!kyc) {
    console.log('❌ KYC Submit - No KYC profile found for user:', userId);
    throw new ValidationError('KYC profile not found. Please complete your profile first.');
  }

  console.log('📋 KYC Submit - Found existing KYC profile:', {
    id: kyc._id,
    fullName: kyc.fullName,
    email: kyc.email,
    phone: kyc.phone,
    verificationStatus: kyc.verificationStatus,
    aadharCard: kyc.aadharCard ? 'Present' : 'Missing',
    collegeIdCard: kyc.collegeIdCard ? 'Present' : 'Missing'
  });

  // Validate all required fields are present
  const requiredFields = [
    'fullName', 'dob', 'phone', 'email', 'address',
    'college', 'courseYear',
    'stayType', 'hoursPerWeek', 'availableDays',
    'emergencyContact'
  ];
  
  const missingFields = [];
  for (const field of requiredFields) {
    if (!kyc[field as keyof typeof kyc]) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    console.log('❌ KYC Submit - Missing required fields:', missingFields);
    throw new ValidationError(`Please complete ${missingFields.join(', ')} before submitting`);
  }

  // Update verification status to 'pending' (not 'in-review')
  kyc.verificationStatus = 'pending';
  kyc.submittedAt = new Date();
  await kyc.save();

  console.log('✅ KYC Submit - Successfully submitted KYC for verification');
  console.log('  KYC ID:', kyc._id);
  console.log('  Status:', kyc.verificationStatus);
  console.log('  Submitted At:', kyc.submittedAt);

  sendSuccessResponse(res, { kyc }, 'KYC submitted for verification successfully');
}));

// @route   GET /api/kyc/status
// @desc    Get KYC verification status
// @access  Private
router.get('/status', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const kyc = await KYC.findOne({ userId: req.user!._id, isActive: true })
    .select('verificationStatus verificationNotes verifiedAt submittedAt');
  
  if (!kyc) {
    return sendSuccessResponse(res, { 
      status: 'not-submitted',
      message: 'No KYC profile found'
    }, 'KYC status retrieved');
  }

  sendSuccessResponse(res, { 
    status: kyc.verificationStatus,
    submittedAt: kyc.submittedAt,
    verifiedAt: kyc.verifiedAt,
    notes: kyc.verificationNotes
  }, 'KYC status retrieved successfully');
}));

// @route   GET /api/kyc/debug/:email
// @desc    Debug KYC status for specific user (Admin only)
// @access  Private (Admin)
router.get('/debug/:email', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { email } = req.params;
  
  // Check if current user is admin
  const currentUser = await User.findById(req.user!._id);
  if (!currentUser || currentUser.userType !== 'admin') {
    throw new ValidationError('Admin access required');
  }
  
  console.log('🔍 DEBUG KYC - Checking status for email:', email);
  
  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return sendSuccessResponse(res, { 
      error: 'User not found',
      email 
    }, 'User not found');
  }
  
  // Find KYC for this user
  const kyc = await KYC.findOne({ userId: user._id, isActive: true });
  
  const debugData = {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      kycStatus: user.kycStatus,
      isVerified: user.isVerified,
      kycVerifiedAt: user.kycVerifiedAt,
      kycRejectedAt: user.kycRejectedAt,
      kycPendingAt: user.kycPendingAt
    },
    kyc: kyc ? {
      _id: kyc._id,
      userId: kyc.userId,
      email: kyc.email,
      phone: kyc.phone,
      verificationStatus: kyc.verificationStatus,
      submittedAt: kyc.submittedAt,
      approvedAt: kyc.approvedAt,
      rejectedAt: kyc.rejectedAt,
      rejectionReason: kyc.rejectionReason,
      isActive: kyc.isActive
    } : null,
    analysis: {
      hasKYC: !!kyc,
      userKycStatus: user.kycStatus,
      kycVerificationStatus: kyc?.verificationStatus,
      isVerified: user.isVerified,
      statusMatch: user.kycStatus === kyc?.verificationStatus,
      shouldBeCompleted: kyc?.verificationStatus === 'approved'
    }
  };
  
  console.log('📊 DEBUG KYC - Analysis:', debugData.analysis);
  
  sendSuccessResponse(res, debugData, 'Debug data retrieved successfully');
}));

// @route   POST /api/kyc/sync-user/:email
// @desc    Sync user KYC status (Admin only)
// @access  Private (Admin)
router.post('/sync-user/:email', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { email } = req.params;
  
  // Check if current user is admin
  const currentUser = await User.findById(req.user!._id);
  if (!currentUser || currentUser.userType !== 'admin') {
    throw new ValidationError('Admin access required');
  }
  
  console.log('🔄 SYNC KYC - Syncing status for email:', email);
  
  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ValidationError('User not found');
  }
  
  // Find KYC for this user
  const kyc = await KYC.findOne({ userId: user._id, isActive: true });
  
  if (!kyc) {
    // No KYC found, update user status to not-submitted
    await User.findByIdAndUpdate(user._id, {
      kycStatus: 'not-submitted',
      isVerified: false,
      kycVerifiedAt: null,
      kycRejectedAt: null,
      kycPendingAt: null
    });
    
    console.log('✅ SYNC KYC - User updated to not-submitted (no KYC found)');
    
    return sendSuccessResponse(res, {
      message: 'User synced to not-submitted status',
      user: { email: user.email, kycStatus: 'not-submitted' }
    }, 'User synced successfully');
  }
  
  // Sync user status with KYC status
  const updateData: any = {
    kycStatus: kyc.verificationStatus,
    isVerified: kyc.verificationStatus === 'approved'
  };
  
  // Set appropriate timestamps
  if (kyc.verificationStatus === 'approved') {
    updateData.kycVerifiedAt = kyc.approvedAt || new Date();
    updateData.kycRejectedAt = null;
    updateData.kycPendingAt = null;
  } else if (kyc.verificationStatus === 'rejected') {
    updateData.kycRejectedAt = kyc.rejectedAt || new Date();
    updateData.kycVerifiedAt = null;
    updateData.kycPendingAt = null;
  } else if (kyc.verificationStatus === 'pending') {
    updateData.kycPendingAt = kyc.submittedAt || new Date();
    updateData.kycVerifiedAt = null;
    updateData.kycRejectedAt = null;
  }
  
  await User.findByIdAndUpdate(user._id, updateData);
  
  console.log('✅ SYNC KYC - User synced with KYC status:', {
    email: user.email,
    kycStatus: kyc.verificationStatus,
    isVerified: updateData.isVerified
  });
  
  sendSuccessResponse(res, {
    message: 'User synced successfully',
    user: { 
      email: user.email, 
      kycStatus: kyc.verificationStatus,
      isVerified: updateData.isVerified
    },
    kyc: {
      verificationStatus: kyc.verificationStatus,
      submittedAt: kyc.submittedAt
    }
  }, 'User synced successfully');
}));

// @route   GET /api/kyc/pending
// @desc    Get all pending KYC submissions (Admin only)
// @access  Private (Admin)
router.get('/pending', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // Check if user is admin
  const user = await User.findById(req.user!._id);
  if (!user || user.userType !== 'admin') {
    throw new ValidationError('Admin access required');
  }

  const { page = 1, limit = 10, status = 'pending' } = req.query;
  
  const query: any = { 
    isActive: true,
    verificationStatus: status
  };

  const kycs = await KYC.find(query)
    .populate('userId', 'name email phone')
    .select('fullName college verificationStatus submittedAt')
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit))
    .sort({ submittedAt: -1 });

  const total = await KYC.countDocuments(query);

  sendSuccessResponse(res, {
    kycs,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    }
  }, 'Pending KYC submissions retrieved successfully');
}));

// @route   PUT /api/kyc/verify/:id
// @desc    Verify KYC submission (Admin only)
// @access  Private (Admin)
router.put('/verify/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // Check if user is admin
  const user = await User.findById(req.user!._id);
  if (!user || user.userType !== 'admin') {
    throw new ValidationError('Admin access required');
  }

  const { status, notes } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    throw new ValidationError('Invalid verification status');
  }

  const kyc = await KYC.findById(req.params.id);
  if (!kyc) {
    throw new ValidationError('KYC not found');
  }

  kyc.verificationStatus = status;
  kyc.verificationNotes = notes;
  kyc.verifiedAt = new Date();
  kyc.verifiedBy = req.user!._id;
  await kyc.save();

  // Update user verification status
  const kycUser = await User.findById(kyc.userId);
  if (kycUser) {
    kycUser.isVerified = status === 'approved';
    await kycUser.save();
  }

  sendSuccessResponse(res, { kyc }, 'KYC verification updated successfully');
}));

// @route   DELETE /api/kyc/profile
// @desc    Delete KYC profile
// @access  Private
router.delete('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const userId = req.user!._id;
  
  const kyc = await KYC.findOne({ userId, isActive: true });
  if (!kyc) {
    throw new ValidationError('KYC profile not found');
  }

  // Soft delete
  kyc.isActive = false;
  await kyc.save();

  sendSuccessResponse(res, {}, 'KYC profile deleted successfully');
}));

export default router;

