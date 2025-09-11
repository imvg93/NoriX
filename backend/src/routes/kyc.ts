import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import KYC from '../models/KYC';
import User from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, ValidationError } from '../middleware/errorHandler';
import { uploadImage, deleteImage } from '../config/cloudinary';

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
  
  // For auto-save, only validate fields that are present
  const isAutoSave = !kycData.fullName || !kycData.dob || !kycData.phone;
  
  if (!isAutoSave) {
    console.log('📋 KYC Profile Save - Complete submission detected');
    // Validate required fields for complete submission
    const requiredFields = [
      'fullName', 'dob', 'phone', 'email', 'address',
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

