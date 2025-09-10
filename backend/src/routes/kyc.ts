import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import KYC from '../models/KYC';
import User from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, ValidationError } from '../middleware/errorHandler';

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

// @route   POST /api/kyc/profile
// @desc    Create or update KYC profile
// @access  Private
router.post('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const userId = req.user!._id;
  
  console.log('🔍 KYC Profile Save - User ID:', userId);
  console.log('🔍 KYC Profile Save - Request Body:', JSON.stringify(req.body, null, 2));
  
  // Check if user exists and is a student
  const user = await User.findById(userId);
  if (!user) {
    throw new ValidationError('User not found');
  }
  
  if (user.userType !== 'student') {
    throw new ValidationError('Only students can submit KYC profiles');
  }

  const kycData = req.body;
  
  // For auto-save, only validate fields that are present
  const isAutoSave = !kycData.fullName || !kycData.dob || !kycData.phone;
  
  if (!isAutoSave) {
    // Validate required fields for complete submission
    const requiredFields = [
      'fullName', 'dob', 'phone', 'email', 'address',
      'college', 'courseYear',
      'stayType', 'hoursPerWeek', 'availableDays',
      // 'govtIdType', 'govtIdFiles', 'photoFile', // Removed - no longer required
      'emergencyContact'
    ];
    
    for (const field of requiredFields) {
      if (!kycData[field]) {
        throw new ValidationError(`${field} is required`);
      }
    }
  }

  // Check if KYC already exists
  let kyc = await KYC.findOne({ userId, isActive: true });
  
  if (kyc) {
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
  } else {
    // Create new KYC
    kyc = new KYC({
      userId,
      ...kycData,
      verificationStatus: 'pending'
    });
    await kyc.save();
  }

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

// @route   POST /api/kyc/upload
// @desc    Upload KYC documents
// @access  Private
router.post('/upload', authenticateToken, upload.array('files', 5), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ValidationError('No files uploaded');
    }

    const files = req.files as Express.Multer.File[];
    
    // Validate files
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new ValidationError(`File ${file.originalname} is not an image`);
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new ValidationError(`File ${file.originalname} is too large (max 5MB)`);
      }
    }

    const fileUrls = files.map(file => `/uploads/kyc/${file.filename}`);
    
    sendSuccessResponse(res, { 
      files: fileUrls,
      count: files.length 
    }, 'Files uploaded successfully');
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}));

// @route   POST /api/kyc/submit
// @desc    Submit KYC for verification
// @access  Private
router.post('/submit', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const userId = req.user!._id;
  
  const kyc = await KYC.findOne({ userId, isActive: true });
  if (!kyc) {
    throw new ValidationError('KYC profile not found. Please complete your profile first.');
  }

  // Validate all required fields are present
  const requiredFields = [
    'fullName', 'dob', 'phone', 'email', 'address',
    'college', 'courseYear',
    'stayType', 'hoursPerWeek', 'availableDays',
    // 'govtIdType', 'govtIdFiles', 'photoFile', // Removed - no longer required
    'emergencyContact'
  ];
  
  for (const field of requiredFields) {
    if (!kyc[field as keyof typeof kyc]) {
      throw new ValidationError(`Please complete ${field} before submitting`);
    }
  }

  // Update verification status
  kyc.verificationStatus = 'in-review';
  kyc.submittedAt = new Date();
  await kyc.save();

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
