import express from 'express';
import multer from 'multer';
import User from '../models/User';
import { RoleSelectionAudit } from '../models/RoleSelectionAudit';
import EmployerKYC from '../models/EmployerKYC';
import LocalBusinessKYC from '../models/LocalBusinessKYC';
import IndividualKYC from '../models/IndividualKYC';
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
    phone,
    address,
    college,
    skills,
    availability,
    companyName,
    businessType
  } = req.body;

  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  // Store previous values for comparison
  const previousValues: any = {
    name: user.name,
    phone: user.phone || '',
    address: user.address || '',
  };

  const newValues: any = {};
  const changedFields: string[] = [];

  // Update basic fields
  if (name !== undefined && name !== user.name) {
    previousValues.name = user.name;
    user.name = name;
    newValues.name = name;
    changedFields.push('name');
  }

  if (phone !== undefined && phone !== user.phone) {
    previousValues.phone = user.phone || '';
    user.phone = phone;
    newValues.phone = phone;
    changedFields.push('phone');
  }

  if (address !== undefined && address !== user.address) {
    previousValues.address = user.address || '';
    user.address = address;
    newValues.address = address;
    changedFields.push('address');
  }

  // Update student-specific fields
  if (user.userType === 'student') {
    if (college !== undefined && college !== user.college) {
      previousValues.college = user.college || '';
      user.college = college;
      newValues.college = college;
      changedFields.push('college');
    }

    if (skills !== undefined) {
      const skillsArray = typeof skills === 'string' 
        ? skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : skills;
      
      const prevSkills = (user.skills || []).join(', ');
      const newSkills = Array.isArray(skillsArray) ? skillsArray.join(', ') : '';
      
      if (prevSkills !== newSkills) {
        previousValues.skills = prevSkills;
        user.skills = skillsArray;
        newValues.skills = newSkills;
        changedFields.push('skills');
      }
    }

    if (availability !== undefined && availability !== user.availability) {
      previousValues.availability = user.availability || '';
      user.availability = availability;
      newValues.availability = availability;
      changedFields.push('availability');
    }
  }

  // Update employer-specific fields
  if (user.userType === 'employer') {
    if (companyName !== undefined && companyName !== user.companyName) {
      previousValues.companyName = user.companyName || '';
      user.companyName = companyName;
      newValues.companyName = companyName;
      changedFields.push('companyName');
    }

    if (businessType !== undefined && businessType !== user.businessType) {
      previousValues.businessType = user.businessType || '';
      user.businessType = businessType;
      newValues.businessType = businessType;
      changedFields.push('businessType');
    }
  }

  // Save changes directly to MongoDB
  await user.save();

  console.log(`✅ Profile updated successfully for user: ${user.email}`);
  if (changedFields.length > 0) {
    console.log(`📝 Changed fields: ${changedFields.join(', ')}`);
  }

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

// @route   PUT /api/users/employer-category
// @desc    Update employer category
// @access  Private (Employers only)
router.put('/employer-category', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { employerCategory } = req.body;

  if (!employerCategory || !['corporate', 'local_business', 'individual'].includes(employerCategory)) {
    throw new ValidationError('Valid employer category is required. Must be one of: corporate, local_business, individual');
  }

  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  if (user.userType !== 'employer') {
    throw new ValidationError('Only employers can update their category');
  }

  // Update employer category
  user.employerCategory = employerCategory;
  await user.save();

  sendSuccessResponse(res, { 
    user: {
      _id: user._id,
      employerCategory: user.employerCategory
    }
  }, 'Employer category updated successfully');
}));

// @route   POST /api/users/choose-role
// @desc    Choose employer role and start onboarding
// @access  Private
router.post('/choose-role', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  console.log('✅ /api/users/choose-role endpoint called');
  const { intent, employerType } = req.body;

  // Validate input
  if (!intent || !employerType) {
    throw new ValidationError('intent and employerType are required');
  }

  if (!['corporate', 'local', 'individual'].includes(employerType)) {
    throw new ValidationError('employerType must be one of: corporate, local, individual');
  }

  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  // Ensure user is employer
  if (user.userType !== 'employer') {
    user.userType = 'employer';
  }

  // Map API employerType to DB employerCategory
  const employerCategoryMap: Record<string, 'corporate' | 'local_business' | 'individual'> = {
    'corporate': 'corporate',
    'local': 'local_business',
    'individual': 'individual'
  };

  const employerCategory = employerCategoryMap[employerType];

  // Check if user already has a category and if type change is allowed
  if (user.employerCategory && user.employerCategory !== employerCategory) {
    // Check KYC status - type change only allowed if not-submitted or rejected
    const kycStatus = user.kycStatus || 'not-submitted';
    if (kycStatus === 'pending' || kycStatus === 'approved' || kycStatus === 'suspended') {
      throw new ValidationError(`Cannot change employer type. Your KYC is ${kycStatus}. Please contact admin to reset.`);
    }
  }

  // Update user
  user.employerCategory = employerCategory;
  user.onboardingCompleted = false;
  await user.save();

  // Get client IP and user agent
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  // Create audit entry
  try {
    await RoleSelectionAudit.create({
      userId: user._id,
      intent,
      employerType: employerType as 'corporate' | 'local' | 'individual',
      clientIp,
      userAgent
    });
  } catch (auditError) {
    console.error('❌ Failed to create role selection audit:', auditError);
    // Don't fail the request if audit fails
  }

  // Determine redirect URL based on employer type
  const redirectMap: Record<string, string> = {
    'corporate': '/employer/kyc/corporate',
    'local': '/employer/kyc/local',
    'individual': '/employer/kyc/individual'
  };

  const redirectTo = redirectMap[employerType];

  sendSuccessResponse(res, {
    success: true,
    redirectTo
  }, 'Role selected successfully');
}));

// @route   PUT /api/users/change-employer-type
// @desc    Change employer type (only allowed if KYC is not-submitted or rejected)
// @access  Private
router.put('/change-employer-type', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { employerType } = req.body;

  // Validate input
  if (!employerType || !['corporate', 'local', 'individual'].includes(employerType)) {
    throw new ValidationError('Valid employerType is required. Must be one of: corporate, local, individual');
  }

  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  if (user.userType !== 'employer') {
    throw new ValidationError('Only employers can change their type');
  }

  // Map API employerType to DB employerCategory
  const employerCategoryMap: Record<string, 'corporate' | 'local_business' | 'individual'> = {
    'corporate': 'corporate',
    'local': 'local_business',
    'individual': 'individual'
  };

  const newCategory = employerCategoryMap[employerType];

  // Check if type is actually changing
  if (user.employerCategory === newCategory) {
    throw new ValidationError('You are already registered as this employer type');
  }

  // Check KYC status - type change only allowed if not-submitted or rejected
  const kycStatus = user.kycStatus || 'not-submitted';
  if (kycStatus === 'pending' || kycStatus === 'approved' || kycStatus === 'suspended') {
    throw new ValidationError(`Cannot change employer type. Your KYC is ${kycStatus}. Please contact admin to reset.`);
  }

  const oldCategory = user.employerCategory;

  // Archive old KYC records based on old category
  try {
    if (oldCategory === 'corporate') {
      const oldKYC = await EmployerKYC.findOne({ employerId: user._id, isArchived: false });
      if (oldKYC) {
        oldKYC.isArchived = true;
        oldKYC.archivedAt = new Date();
        await oldKYC.save();
      }
    } else if (oldCategory === 'local_business') {
      const oldKYC = await LocalBusinessKYC.findOne({ employerId: user._id, isArchived: false });
      if (oldKYC) {
        oldKYC.isArchived = true;
        oldKYC.archivedAt = new Date();
        await oldKYC.save();
      }
    } else if (oldCategory === 'individual') {
      const oldKYC = await IndividualKYC.findOne({ employerId: user._id, isArchived: false });
      if (oldKYC) {
        oldKYC.isArchived = true;
        oldKYC.archivedAt = new Date();
        await oldKYC.save();
      }
    }
  } catch (archiveError) {
    console.error('❌ Failed to archive old KYC:', archiveError);
    // Don't fail the request if archiving fails, but log it
  }

  // Update user
  user.employerCategory = newCategory;
  user.kycStatus = 'not-submitted';
  user.onboardingCompleted = false;
  await user.save();

  // Get client IP and user agent for audit
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  // Create audit entry
  try {
    await RoleSelectionAudit.create({
      userId: user._id,
      intent: 'change-type',
      employerType: employerType as 'corporate' | 'local' | 'individual',
      clientIp,
      userAgent
    });
  } catch (auditError) {
    console.error('❌ Failed to create type change audit:', auditError);
    // Don't fail the request if audit fails
  }

  // Determine redirect URL to new type's KYC page
  const redirectMap: Record<string, string> = {
    'corporate': '/employer/kyc/corporate',
    'local': '/employer/kyc/local',
    'individual': '/employer/kyc/individual'
  };

  const redirectTo = redirectMap[employerType];

  sendSuccessResponse(res, {
    success: true,
    redirectTo,
    newType: employerType,
    oldType: oldCategory
  }, 'Employer type changed successfully. Please complete KYC for the new type.');
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
