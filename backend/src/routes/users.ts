import express from 'express';
import multer from 'multer';
import User from '../models/User';
import { authenticateToken, requireStudent, requireEmployer, AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, ValidationError } from '../middleware/errorHandler';
import { uploadImage, deleteImage } from '../config/cloudinary';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // User data is already available from authentication middleware
  const user = req.user;
  
  if (!user) {
    console.error('❌ No user data found in req.user');
    throw new ValidationError('User not found');
  }

  console.log('✅ Profile endpoint - user data:', {
    id: user._id,
    email: user.email,
    userType: user.userType,
    name: user.name
  });

  sendSuccessResponse(res, { user }, 'Profile retrieved successfully');
}));

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const {
    name,
    college,
    skills,
    availability,
    companyName,
    businessType,
    address
  } = req.body;

  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  // Update basic fields
  if (name) user.name = name;

  // Update student-specific fields
  if (user.userType === 'student') {
    if (college) user.college = college;
    if (skills) user.skills = skills.split(',').map((s: string) => s.trim());
    if (availability) user.availability = availability;
  }

  // Update employer-specific fields
  if (user.userType === 'employer') {
    if (companyName) user.companyName = companyName;
    if (businessType) user.businessType = businessType;
    if (address) user.address = address;
  }

  await user.save();

  sendSuccessResponse(res, { user }, 'Profile updated successfully');
}));

// @route   GET /api/users/students
// @desc    Get all students (for employers)
// @access  Private (Employers only)
router.get('/students', authenticateToken, requireEmployer, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { page = 1, limit = 10, skills, availability, location } = req.query;

  const query: any = { 
    userType: 'student', 
    isActive: true,
    approvalStatus: 'approved' // Only show approved students to employers
  };

  // Add filters
  if (skills) {
    query.skills = { $in: (skills as string).split(',').map((s: string) => s.trim()) };
  }
  if (availability) {
    query.availability = availability;
  }

  const students = await User.find(query)
    .select('name college skills availability rating completedJobs totalEarnings')
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit))
    .sort({ rating: -1, completedJobs: -1 });

  const total = await User.countDocuments(query);

  sendSuccessResponse(res, {
    students,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    }
  }, 'Students retrieved successfully');
}));

// @route   GET /api/users/employers
// @desc    Get all employers (for students)
// @access  Private (Students only)
router.get('/employers', authenticateToken, requireStudent, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { page = 1, limit = 10, businessType, location } = req.query;

  const query: any = { userType: 'employer', isActive: true };

  // Add filters
  if (businessType) {
    query.businessType = businessType;
  }

  const employers = await User.find(query)
    .select('name companyName businessType address isVerified rating')
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit))
    .sort({ isVerified: -1, rating: -1 });

  const total = await User.countDocuments(query);

  sendSuccessResponse(res, {
    employers,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    }
  }, 'Employers retrieved successfully');
}));

// @route   GET /api/users/:id
// @desc    Get user by ID (public profile)
// @access  Public
router.get('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const user = await User.findById(req.params.id)
    .select('name email phone userType college skills availability companyName businessType address isVerified isActive rating completedJobs totalEarnings');

  if (!user) {
    throw new ValidationError('User not found');
  }

  // Allow viewing deactivated accounts for authenticated users (employers viewing applicants)
  // but block for public access
  const authHeader = req.headers.authorization;
  const isAuthenticated = authHeader && authHeader.startsWith('Bearer ');
  
  // Determine if account is deactivated
  const isDeactivated = !user.isActive;
  
  // Block public access to deactivated accounts
  if (isDeactivated && !isAuthenticated) {
    throw new ValidationError('User account is deactivated');
  }

  // Include deactivation flag in response
  sendSuccessResponse(res, { 
    user: {
      ...user.toObject(),
      isDeactivated: isDeactivated,
      accountStatus: isDeactivated ? 'deactivated' : 'active'
    }
  }, 'User profile retrieved successfully');
}));

// @route   POST /api/users/upload-avatar
// @desc    Upload profile picture to Cloudinary
// @access  Private
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  try {
    // Delete old profile picture from Cloudinary if exists
    if (user.cloudinaryPublicId) {
      await deleteImage(user.cloudinaryPublicId);
    }

    // Upload new image to Cloudinary
    const result = await uploadImage(req.file, 'studentjobs/avatars');
    
    // Update user with new image URL and public ID
    user.profilePicture = result.secure_url;
    user.cloudinaryPublicId = result.public_id;
    await user.save();

    sendSuccessResponse(res, { 
      profilePicture: result.secure_url,
      publicId: result.public_id 
    }, 'Profile picture uploaded successfully');
  } catch (error) {
    console.error('Upload error:', error);
    throw new ValidationError('Failed to upload profile picture');
  }
}));

// @route   DELETE /api/users/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  // Deactivate account instead of deleting
  user.isActive = false;
  await user.save();

  sendSuccessResponse(res, {}, 'Account deactivated successfully');
}));

export default router;
