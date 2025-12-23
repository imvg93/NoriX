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
import IndividualKYC from '../models/IndividualKYC';
import LocalBusinessKYC from '../models/LocalBusinessKYC';

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

// Test routes for new endpoints
router.get('/employer/corporate/test', (req, res) => {
  res.json({ message: 'Corporate KYC route is registered!' });
});

router.get('/employer/local-business/test', (req, res) => {
  res.json({ message: 'Local Business KYC route is registered!' });
});

router.get('/employer/individual/test', (req, res) => {
  res.json({ message: 'Individual KYC route is registered!' });
});

// ===== Employer KYC endpoints =====
// POST /api/kyc/employer → submit employer KYC to employer_kyc collection
router.post(
  '/employer',
  authenticateToken,
  requireEmployer,
  upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'companyProof', maxCount: 1 },
  ]),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const employerId = req.user!._id;
  const { 
    fullName,
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
    gstNo,
    PAN, 
    businessRegNo,
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

  const existingDocuments = existing?.documents ? JSON.parse(JSON.stringify(existing.documents)) : {};
  let incomingDocuments: any = {};
  if (documents) {
    if (typeof documents === 'string') {
      try {
        incomingDocuments = JSON.parse(documents);
      } catch (parseErr) {
        console.warn('⚠️ Failed to parse documents payload, ignoring:', parseErr);
      }
    } else if (typeof documents === 'object') {
      incomingDocuments = documents;
    }
  }

  const processedDocuments: any = {
    ...existingDocuments,
    ...incomingDocuments,
  };

  const files = req.files as Record<string, Express.Multer.File[]> | undefined;

  const handleFileUpload = async (file?: Express.Multer.File) => {
    if (!file) return undefined;
    const uploadResult = await uploadImage(file, `kyc/employer/${employerId.toString()}`);
    try {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (cleanupErr) {
      console.warn('⚠️ Failed to cleanup temporary file:', cleanupErr);
    }
    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
  };

  if (files?.idProof && files.idProof[0]) {
    processedDocuments.idProof = await handleFileUpload(files.idProof[0]);
  }

  if (files?.companyProof && files.companyProof[0]) {
    processedDocuments.companyProof = await handleFileUpload(files.companyProof[0]);
  }

  // Prepare KYC data
  const kycData: any = {
    employerId,
    companyName: companyName.trim(),
    companyEmail: companyEmail?.trim() || undefined,
    companyPhone: companyPhone?.trim() || undefined,
    authorizedName: authorizedName?.trim() || fullName?.trim() || undefined,
    fullName: fullName?.trim() || authorizedName?.trim() || undefined,
    businessRegNo: businessRegNo?.trim() || existing?.businessRegNo || undefined,
    designation: designation?.trim() || undefined,
    address: address?.trim() || undefined,
    city: city?.trim() || undefined,
    latitude: latitude?.trim() || undefined,
    longitude: longitude?.trim() || undefined,
    GSTNumber: (gstNo || GSTNumber)?.trim() || undefined,
    PAN: PAN?.trim() || undefined,
    status: 'pending',
    submittedAt: new Date()
  };

  if (Object.keys(processedDocuments).length > 0) {
    kycData.documents = processedDocuments;
  }

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

// POST /api/kyc/employer/corporate → Submit Corporate KYC
router.post(
  '/employer/corporate',
  authenticateToken,
  requireEmployer,
  upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'companyProof', maxCount: 1 },
    { name: 'gstDoc', maxCount: 1 },
  ]),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const employerId = req.user!._id;
    const user = await User.findById(employerId);
    
    if (!user || user.employerCategory !== 'corporate') {
      throw new ValidationError('This endpoint is only for corporate employers');
    }

    const { 
      companyName,
      businessRegistrationType,
      gstNumber,
      GSTNumber,
      businessRegNo,
      companyEmail,
      companyPhone,
      address,
      city,
      pinCode,
      website,
      adminName,
      authorizedName,
      adminEmail,
      adminPhone,
      fullName,
      designation,
    } = req.body || {};

    if (!companyName || !companyName.trim()) {
      throw new ValidationError('Company name is required');
    }
    if (!businessRegistrationType) {
      throw new ValidationError('Business registration type is required');
    }
    if (!companyEmail || !companyEmail.trim()) {
      throw new ValidationError('Company email is required');
    }
    // Basic email domain check (no Gmail/Yahoo)
    const domain = companyEmail.split('@')[1]?.toLowerCase();
    if (['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain || '')) {
      throw new ValidationError('Please use your company email address, not a personal email');
    }
    if (!address || !address.trim()) {
      throw new ValidationError('Office address is required');
    }
    if (!city || !city.trim()) {
      throw new ValidationError('City is required');
    }
    if (!pinCode || !pinCode.trim()) {
      throw new ValidationError('PIN code is required');
    }
    if (!adminName || !adminName.trim()) {
      throw new ValidationError('Admin contact name is required');
    }
    if (!adminEmail || !adminEmail.trim()) {
      throw new ValidationError('Admin contact email is required');
    }

    const existing = await EmployerKYC.findOne({ employerId });
    if (existing && existing.status === 'approved') {
      throw new ValidationError('KYC already approved. Cannot modify approved KYC.');
    }

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const processedDocuments: any = existing?.documents ? JSON.parse(JSON.stringify(existing.documents)) : {};

    const handleFileUpload = async (file?: Express.Multer.File) => {
      if (!file) return undefined;
      const uploadResult = await uploadImage(file, `kyc/employer/${employerId.toString()}`);
      try {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (cleanupErr) {
        console.warn('⚠️ Failed to cleanup temporary file:', cleanupErr);
      }
      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    };

    if (files?.companyProof && files.companyProof[0]) {
      processedDocuments.companyProof = await handleFileUpload(files.companyProof[0]);
    }
    if (files?.idProof && files.idProof[0]) {
      processedDocuments.idProof = await handleFileUpload(files.idProof[0]);
    }
    if (files?.gstDoc && files.gstDoc[0]) {
      processedDocuments.gstCertificateUrl = (await handleFileUpload(files.gstDoc[0]))?.url;
    }

    if (!processedDocuments.companyProof) {
      throw new ValidationError('Registration certificate is required');
    }
    if (!processedDocuments.idProof) {
      throw new ValidationError('Director/Owner ID proof is required');
    }

    const kycData: any = {
      employerId,
      companyName: companyName.trim(),
      businessRegistrationType,
      GSTNumber: (gstNumber || GSTNumber)?.trim()?.toUpperCase() || undefined,
      businessRegNo: businessRegNo?.trim() || undefined,
      companyEmail: companyEmail.trim().toLowerCase(),
      companyPhone: companyPhone?.trim() || undefined,
      address: address.trim(),
      city: city.trim(),
      pinCode: pinCode.trim(),
      website: website?.trim() || undefined,
      authorizedName: (adminName || authorizedName)?.trim() || undefined,
      fullName: (fullName || adminName)?.trim() || undefined,
      adminEmail: adminEmail.trim().toLowerCase(),
      adminPhone: adminPhone?.trim() || undefined,
      designation: designation?.trim() || undefined,
      documents: processedDocuments,
      status: 'pending',
      submittedAt: new Date()
    };

    if (existing?.status === 'rejected') {
      delete kycData.rejectionReason;
    }

    const record = await EmployerKYC.findOneAndUpdate(
      { employerId },
      { $set: kycData },
      { new: true, upsert: true }
    );

    await User.findByIdAndUpdate(employerId, {
      kycStatus: 'pending',
      isVerified: false,
      kycPendingAt: new Date(),
      $unset: { kycVerifiedAt: 1, kycRejectedAt: 1 }
    });

    return sendSuccessResponse(res, { 
      kyc: record,
      status: 'pending'
    }, 'Corporate KYC submitted successfully');
  })
);

// POST /api/kyc/employer/local-business → Submit Local Business KYC
router.post(
  '/employer/local-business',
  authenticateToken,
  requireEmployer,
  upload.fields([
    { name: 'shopPhoto', maxCount: 1 },
    { name: 'businessLicense', maxCount: 1 },
    { name: 'ownerIdProof', maxCount: 1 },
  ]),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const employerId = req.user!._id;
    const user = await User.findById(employerId);
    
    if (!user || user.employerCategory !== 'local_business') {
      throw new ValidationError('This endpoint is only for local business employers');
    }

    const { 
      businessName,
      businessType,
      ownerName,
      ownerEmail,
      ownerPhone,
      address,
      city,
      pinCode,
      locationPin,
    } = req.body || {};

    if (!businessName || !businessName.trim() || businessName.trim().length < 3) {
      throw new ValidationError('Business name is required (minimum 3 characters)');
    }
    if (!businessType) {
      throw new ValidationError('Business type is required');
    }
    if (!ownerName || !ownerName.trim() || ownerName.trim().length < 3) {
      throw new ValidationError('Owner name is required (minimum 3 characters)');
    }
    if (!ownerEmail || !ownerEmail.trim()) {
      throw new ValidationError('Owner email is required');
    }
    if (!address || !address.trim()) {
      throw new ValidationError('Address is required');
    }
    if (!city || !city.trim()) {
      throw new ValidationError('City is required');
    }
    if (!pinCode || !pinCode.trim()) {
      throw new ValidationError('PIN code is required');
    }

    const existing = await LocalBusinessKYC.findOne({ employerId });
    if (existing && existing.status === 'approved') {
      throw new ValidationError('KYC already approved. Cannot modify approved KYC.');
    }

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const processedDocuments: any = existing?.documents ? JSON.parse(JSON.stringify(existing.documents)) : {};

    const handleFileUpload = async (file?: Express.Multer.File) => {
      if (!file) return undefined;
      const uploadResult = await uploadImage(file, `kyc/local-business/${employerId.toString()}`);
      try {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (cleanupErr) {
        console.warn('⚠️ Failed to cleanup temporary file:', cleanupErr);
      }
      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    };

    if (files?.shopPhoto && files.shopPhoto[0]) {
      const result = await handleFileUpload(files.shopPhoto[0]);
      if (result) {
        processedDocuments.shopPhotoUrl = result.url;
        processedDocuments.shopPhotoPublicId = result.publicId;
      }
    }
    if (files?.businessLicense && files.businessLicense[0]) {
      const result = await handleFileUpload(files.businessLicense[0]);
      if (result) {
        processedDocuments.businessLicenseUrl = result.url;
        processedDocuments.businessLicensePublicId = result.publicId;
      }
    }
    if (files?.ownerIdProof && files.ownerIdProof[0]) {
      const result = await handleFileUpload(files.ownerIdProof[0]);
      if (result) {
        processedDocuments.ownerIdProofUrl = result.url;
        processedDocuments.ownerIdProofPublicId = result.publicId;
      }
    }

    // At least ONE proof document required
    if (!processedDocuments.shopPhotoUrl && !processedDocuments.businessLicenseUrl && !processedDocuments.ownerIdProofUrl) {
      throw new ValidationError('Please upload at least one proof document (Shop Photo, Business License, or Owner ID)');
    }

    const kycData: any = {
      employerId,
      businessName: businessName.trim(),
      businessType,
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim().toLowerCase(),
      ownerPhone: ownerPhone?.trim() || '',
      address: address.trim(),
      city: city.trim(),
      pinCode: pinCode.trim(),
      locationPin: locationPin?.trim() || undefined,
      documents: processedDocuments,
      status: 'pending',
      submittedAt: new Date()
    };

    if (existing?.status === 'rejected') {
      delete kycData.rejectionReason;
    }

    const record = await LocalBusinessKYC.findOneAndUpdate(
      { employerId },
      { $set: kycData },
      { new: true, upsert: true }
    );

    await User.findByIdAndUpdate(employerId, {
      kycStatus: 'pending',
      isVerified: false,
      kycPendingAt: new Date(),
      $unset: { kycVerifiedAt: 1, kycRejectedAt: 1 }
    });

    return sendSuccessResponse(res, { 
      kyc: record,
      status: 'pending'
    }, 'Local Business KYC submitted successfully');
  })
);

// POST /api/kyc/employer/individual → Submit Individual KYC
router.post(
  '/employer/individual',
  authenticateToken,
  requireEmployer,
  upload.fields([
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const employerId = req.user!._id;
    const user = await User.findById(employerId);
    
    if (!user || user.employerCategory !== 'individual') {
      throw new ValidationError('This endpoint is only for individual employers');
    }

    const { 
      fullName,
      address,
      city,
      locationPin,
      pinCode,
      aadhaarNumber,
    } = req.body || {};

    if (!fullName || !fullName.trim() || fullName.trim().length < 3) {
      throw new ValidationError('Full name is required (minimum 3 characters)');
    }
    if (!address || !address.trim()) {
      throw new ValidationError('Address is required');
    }
    if (!city || !city.trim()) {
      throw new ValidationError('City is required');
    }
    if (!aadhaarNumber || !aadhaarNumber.trim() || !/^[0-9]{12}$/.test(aadhaarNumber.trim())) {
      throw new ValidationError('Aadhaar number must be exactly 12 digits');
    }

    const existing = await IndividualKYC.findOne({ employerId });
    if (existing && existing.status === 'approved') {
      throw new ValidationError('KYC already approved. Cannot modify approved KYC.');
    }

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    const handleFileUpload = async (file?: Express.Multer.File) => {
      if (!file) return undefined;
      const uploadResult = await uploadImage(file, `kyc/individual/${employerId.toString()}`);
      try {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (cleanupErr) {
        console.warn('⚠️ Failed to cleanup temporary file:', cleanupErr);
      }
      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    };

    if (!files?.aadhaarFront || !files.aadhaarFront[0]) {
      throw new ValidationError('Aadhaar front side is required');
    }
    if (!files?.aadhaarBack || !files.aadhaarBack[0]) {
      throw new ValidationError('Aadhaar back side is required');
    }
    if (!files?.selfie || !files.selfie[0]) {
      throw new ValidationError('Selfie is required for verification');
    }

    const aadhaarFrontResult = await handleFileUpload(files.aadhaarFront[0]);
    const aadhaarBackResult = await handleFileUpload(files.aadhaarBack[0]);
    const selfieResult = await handleFileUpload(files.selfie[0]);

    if (!aadhaarFrontResult || !aadhaarBackResult || !selfieResult) {
      throw new ValidationError('Failed to upload documents. Please try again.');
    }

    const kycData: any = {
      employerId,
      fullName: fullName.trim(),
      aadhaarNumber: aadhaarNumber.trim(),
      address: address.trim(),
      city: city.trim(),
      locationPin: locationPin?.trim() || undefined,
      pinCode: pinCode?.trim() || undefined,
      aadhaarFrontUrl: aadhaarFrontResult.url,
      aadhaarFrontPublicId: aadhaarFrontResult.publicId,
      aadhaarBackUrl: aadhaarBackResult.url,
      aadhaarBackPublicId: aadhaarBackResult.publicId,
      selfieUrl: selfieResult.url,
      selfiePublicId: selfieResult.publicId,
      aadhaarVerified: false, // For future OCR integration
      selfieVerified: false, // For future face matching
      status: 'pending',
      submittedAt: new Date()
    };

    if (existing?.status === 'rejected') {
      delete kycData.rejectionReason;
    }

    const record = await IndividualKYC.findOneAndUpdate(
      { employerId },
      { $set: kycData },
      { new: true, upsert: true }
    );

    await User.findByIdAndUpdate(employerId, {
      kycStatus: 'pending',
      isVerified: false,
      kycPendingAt: new Date(),
      $unset: { kycVerifiedAt: 1, kycRejectedAt: 1 }
    });

    return sendSuccessResponse(res, { 
      kyc: record,
      status: 'pending'
    }, 'Individual KYC submitted successfully');
  })
);

// GET /api/kyc/employer/:id/status → fetch employer KYC status (checks correct model based on category)
router.get('/employer/:id/status', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  
  console.log('🔍 Fetching KYC status for employer:', id);
  
  // Get user KYC status
  const user = await User.findById(id).select('kycStatus isVerified kycVerifiedAt kycRejectedAt kycPendingAt employerCategory');
  
  if (!user) {
    throw new ValidationError('User not found');
  }
  
  // Get detailed KYC record based on employer category
  let kycRecord: any = null;
  if (user.employerCategory === 'corporate') {
    kycRecord = await EmployerKYC.findOne({ employerId: id, isArchived: { $ne: true } });
  } else if (user.employerCategory === 'local_business') {
    kycRecord = await LocalBusinessKYC.findOne({ employerId: id, isArchived: { $ne: true } });
  } else if (user.employerCategory === 'individual') {
    kycRecord = await IndividualKYC.findOne({ employerId: id, isArchived: { $ne: true } });
  }
  
  // Determine the most accurate status
  let status = 'not-submitted';
  if (kycRecord) {
    status = kycRecord.status;
  } else if (user?.kycStatus) {
    status = user.kycStatus;
  }
  
  console.log('📊 KYC Status Debug:', {
    employerId: id,
    employerCategory: user.employerCategory,
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
      kycPendingAt: user?.kycPendingAt,
      employerCategory: user.employerCategory
    },
    completionPercentage: (kycRecord as any)?.completionPercentage || 0,
    fullAddress: (kycRecord as any)?.fullAddress || null,
    submittedAt: kycRecord?.submittedAt || null,
    reviewedAt: kycRecord?.reviewedAt || null
  }, 'Employer KYC status retrieved');
}));

// ===== Individual KYC endpoints (Category C) =====
// POST /api/kyc/individual → submit individual KYC (Aadhaar + selfie)
router.post(
  '/individual',
  authenticateToken,
  requireEmployer,
  upload.fields([
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const employerId = req.user!._id;
    
    // Verify employer category
    const user = await User.findById(employerId);
    if (user?.employerCategory !== 'individual') {
      throw new ValidationError('This KYC route is only for individual employers');
    }

    const { 
      fullName,
      aadhaarNumber
    } = req.body || {};

    // Validate required fields
    if (!fullName || !fullName.trim()) {
      throw new ValidationError('Full name is required');
    }
    if (!aadhaarNumber || !/^[0-9]{12}$/.test(aadhaarNumber)) {
      throw new ValidationError('Valid 12-digit Aadhaar number is required');
    }

    // Check if KYC is already approved
    const existing = await IndividualKYC.findOne({ employerId });
    if (existing && existing.status === 'approved') {
      throw new ValidationError('KYC already approved. Cannot modify approved KYC.');
    }

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    const handleFileUpload = async (file?: Express.Multer.File) => {
      if (!file) return undefined;
      const uploadResult = await uploadImage(file, `kyc/individual/${employerId.toString()}`);
      try {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (cleanupErr) {
        console.warn('⚠️ Failed to cleanup temporary file:', cleanupErr);
      }
      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    };

    // Prepare KYC data
    const kycData: any = {
      employerId,
      fullName: fullName.trim(),
      aadhaarNumber: aadhaarNumber.trim(),
      status: 'pending',
      submittedAt: new Date()
    };

    // Handle file uploads
    if (files?.aadhaarFront && files.aadhaarFront[0]) {
      const result = await handleFileUpload(files.aadhaarFront[0]);
      if (result) {
        kycData.aadhaarFrontUrl = result.url;
        kycData.aadhaarFrontPublicId = result.publicId;
      }
    }

    if (files?.aadhaarBack && files.aadhaarBack[0]) {
      const result = await handleFileUpload(files.aadhaarBack[0]);
      if (result) {
        kycData.aadhaarBackUrl = result.url;
        kycData.aadhaarBackPublicId = result.publicId;
      }
    }

    if (files?.selfie && files.selfie[0]) {
      const result = await handleFileUpload(files.selfie[0]);
      if (result) {
        kycData.selfieUrl = result.url;
        kycData.selfiePublicId = result.publicId;
      }
    }

    // If resubmitting after rejection, clear rejection reason
    if (existing?.status === 'rejected') {
      delete kycData.rejectionReason;
    }

    // Save or update KYC record
    const record = await IndividualKYC.findOneAndUpdate(
      { employerId },
      { $set: kycData },
      { new: true, upsert: true }
    );

    // Update user KYC status
    await User.findByIdAndUpdate(
      employerId,
      {
        $set: {
          kycStatus: 'pending',
          kycPendingAt: new Date(),
          isVerified: false
        },
        $unset: { kycVerifiedAt: 1, kycRejectedAt: 1 }
      }
    );

    return sendSuccessResponse(res, { 
      kyc: record
    }, 'Individual KYC submitted successfully');
  })
);

// GET /api/kyc/individual/status → fetch individual KYC status
router.get('/individual/status', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const employerId = req.user!._id;
  
  const user = await User.findById(employerId);
  if (user?.employerCategory !== 'individual') {
    throw new ValidationError('This route is only for individual employers');
  }

  const kycRecord = await IndividualKYC.findOne({ employerId });
  
  let status = 'not-submitted';
  if (kycRecord) {
    status = kycRecord.status;
  } else if (user?.kycStatus) {
    status = user.kycStatus;
  }

  return sendSuccessResponse(res, { 
    status, 
    kyc: kycRecord,
    user: {
      kycStatus: user?.kycStatus,
      isVerified: user?.isVerified
    }
  }, 'Individual KYC status retrieved');
}));

// ===== Local Business KYC endpoints (Category B) =====
// POST /api/kyc/local-business → submit local business KYC (simplified)
router.post(
  '/local-business',
  authenticateToken,
  requireEmployer,
  upload.fields([
    { name: 'tradeLicense', maxCount: 1 },
    { name: 'shopLicense', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'ownerIdProof', maxCount: 1 },
  ]),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const employerId = req.user!._id;
    
    // Verify employer category
    const user = await User.findById(employerId);
    if (user?.employerCategory !== 'local_business') {
      throw new ValidationError('This KYC route is only for local business employers');
    }

    const { 
      businessName,
      businessType,
      ownerName,
      ownerPhone,
      address,
      city,
      latitude,
      longitude
    } = req.body || {};

    // Validate required fields
    if (!businessName || !businessName.trim()) {
      throw new ValidationError('Business name is required');
    }
    if (!ownerName || !ownerName.trim()) {
      throw new ValidationError('Owner name is required');
    }
    if (!ownerPhone || !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(ownerPhone)) {
      throw new ValidationError('Valid owner phone number is required');
    }
    if (!address || !address.trim()) {
      throw new ValidationError('Business address is required');
    }

    // Check if KYC is already approved
    const existing = await LocalBusinessKYC.findOne({ employerId });
    if (existing && existing.status === 'approved') {
      throw new ValidationError('KYC already approved. Cannot modify approved KYC.');
    }

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    const handleFileUpload = async (file?: Express.Multer.File) => {
      if (!file) return undefined;
      const uploadResult = await uploadImage(file, `kyc/local-business/${employerId.toString()}`);
      try {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (cleanupErr) {
        console.warn('⚠️ Failed to cleanup temporary file:', cleanupErr);
      }
      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    };

    // Prepare documents object
    const documents: any = {};

    if (files?.tradeLicense && files.tradeLicense[0]) {
      const result = await handleFileUpload(files.tradeLicense[0]);
      if (result) {
        documents.tradeLicenseUrl = result.url;
        documents.tradeLicensePublicId = result.publicId;
      }
    }

    if (files?.shopLicense && files.shopLicense[0]) {
      const result = await handleFileUpload(files.shopLicense[0]);
      if (result) {
        documents.shopLicenseUrl = result.url;
        documents.shopLicensePublicId = result.publicId;
      }
    }

    if (files?.addressProof && files.addressProof[0]) {
      const result = await handleFileUpload(files.addressProof[0]);
      if (result) {
        documents.addressProofUrl = result.url;
        documents.addressProofPublicId = result.publicId;
      }
    }

    if (files?.ownerIdProof && files.ownerIdProof[0]) {
      const result = await handleFileUpload(files.ownerIdProof[0]);
      if (result) {
        documents.ownerIdProofUrl = result.url;
        documents.ownerIdProofPublicId = result.publicId;
      }
    }

    // Prepare KYC data
    const kycData: any = {
      employerId,
      businessName: businessName.trim(),
      businessType: businessType?.trim() || undefined,
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      address: address.trim(),
      city: city?.trim() || undefined,
      latitude: latitude?.trim() || undefined,
      longitude: longitude?.trim() || undefined,
      status: 'pending',
      submittedAt: new Date()
    };

    if (Object.keys(documents).length > 0) {
      kycData.documents = documents;
    }

    // If resubmitting after rejection, clear rejection reason
    if (existing?.status === 'rejected') {
      delete kycData.rejectionReason;
    }

    // Save or update KYC record
    const record = await LocalBusinessKYC.findOneAndUpdate(
      { employerId },
      { $set: kycData },
      { new: true, upsert: true }
    );

    // Update user KYC status
    await User.findByIdAndUpdate(
      employerId,
      {
        $set: {
          kycStatus: 'pending',
          kycPendingAt: new Date(),
          isVerified: false,
          companyName: businessName.trim()
        },
        $unset: { kycVerifiedAt: 1, kycRejectedAt: 1 }
      }
    );

    return sendSuccessResponse(res, { 
      kyc: record,
      fullAddress: (record as any).fullAddress
    }, 'Local business KYC submitted successfully');
  })
);

// GET /api/kyc/local-business/status → fetch local business KYC status
router.get('/local-business/status', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const employerId = req.user!._id;
  
  const user = await User.findById(employerId);
  if (user?.employerCategory !== 'local_business') {
    throw new ValidationError('This route is only for local business employers');
  }

  const kycRecord = await LocalBusinessKYC.findOne({ employerId });
  
  let status = 'not-submitted';
  if (kycRecord) {
    status = kycRecord.status;
  } else if (user?.kycStatus) {
    status = user.kycStatus;
  }

  return sendSuccessResponse(res, { 
    status, 
    kyc: kycRecord,
    user: {
      kycStatus: user?.kycStatus,
      isVerified: user?.isVerified
    },
    fullAddress: (kycRecord as any)?.fullAddress || null
  }, 'Local business KYC status retrieved');
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

  const notificationService = (global as any).notificationService;
  if (notificationService) {
    try {
      await notificationService.createNotification({
        receiverId: kycRecord.employerId,
        message: '✅ Your employer KYC has been approved. You can now post jobs.',
        type: 'system',
        metadata: {
          kycId: kycRecord._id,
          status: 'approved',
          reviewedAt: kycRecord.reviewedAt,
        },
      });
    } catch (notifyErr) {
      console.error('❌ Failed to send KYC approval notification:', notifyErr);
    }
  }

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

  const notificationService = (global as any).notificationService;
  if (notificationService) {
    try {
      await notificationService.createNotification({
        receiverId: kycRecord.employerId,
        message: `❌ Your employer KYC was rejected. ${rejectionReason.trim()}`,
        type: 'system',
        metadata: {
          kycId: kycRecord._id,
          status: 'rejected',
          reviewedAt: kycRecord.reviewedAt,
          rejectionReason: kycRecord.rejectionReason,
        },
      });
    } catch (notifyErr) {
      console.error('❌ Failed to send KYC rejection notification:', notifyErr);
    }
  }

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
  kycData.phone = user.phone || '';
  
  // Ensure emergencyContact.phone is set - use user's phone if not provided
  if (!kycData.emergencyContact) {
    kycData.emergencyContact = {};
  }
  if (!kycData.emergencyContact.phone || kycData.emergencyContact.phone.trim().length < 6) {
    kycData.emergencyContact.phone = user.phone || '0000000000'; // Default fallback
  }
  if (!kycData.emergencyContact.name) {
    kycData.emergencyContact.name = kycData.fullName || 'Emergency Contact';
  }
  
  console.log('🔒 SECURITY: Using authenticated user details:', {
    email: user.email,
    phone: user.phone,
    userId: user._id,
    emergencyContact: kycData.emergencyContact
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

