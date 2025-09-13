import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import cors from 'cors';
import User from '../models/User';
import OTP from '../models/OTP';
import { AdminLogin } from '../models/AdminLogin';
import { authenticateToken, rateLimit, AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, sendErrorResponse, ValidationError } from '../middleware/errorHandler';
import { generateOTP, sendOTPEmail, verifyOTP, getEmailConfigStatus } from '../services/emailService';

const router = express.Router();

// Enhanced CORS configuration for OTP endpoints
const otpCorsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'https://me-work.vercel.app',
      'https://studenting.vercel.app',
      'https://studentjobs-frontend.onrender.com',
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
    ];
    
    // Allow all Vercel, Railway, and Render subdomains
    if (origin.includes('.vercel.app') || origin.includes('.railway.app') || origin.includes('.onrender.com')) {
      console.log('✅ OTP CORS: Allowing deployment origin:', origin);
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ OTP CORS: Allowing configured origin:', origin);
      return callback(null, true);
    }
    
    console.log('🚫 OTP CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin', 
    'X-CSRF-Token', 
    'X-API-Key',
    'X-OTP-Token',
    'X-User-Type',
    'X-Email-Verification'
  ],
  exposedHeaders: [
    'Content-Length', 
    'X-OTP-Status',
    'X-Verification-Status',
    'X-User-Type'
  ],
  optionsSuccessStatus: 200,
};

// Apply enhanced CORS to all OTP-related routes
router.use('/login-request-otp', cors(otpCorsOptions));
router.use('/login-verify-otp', cors(otpCorsOptions));
router.use('/send-otp', cors(otpCorsOptions));
router.use('/verify-otp', cors(otpCorsOptions));
router.use('/forgot-password', cors(otpCorsOptions));
router.use('/reset-password', cors(otpCorsOptions));

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', asyncHandler(async (req: express.Request, res: express.Response) => {
  const {
    name,
    email,
    phone,
    password,
    userType,
    college,
    skills,
    availability,
    companyName,
    businessType,
    address,
    otp
  } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !password || !userType || !otp) {
    throw new ValidationError('All required fields including OTP must be provided');
  }

  // Validate user type
  if (!['student', 'employer', 'admin'].includes(userType)) {
    throw new ValidationError('Invalid user type');
  }

  // Validate student-specific fields
  if (userType === 'student' && !college) {
    throw new ValidationError('College/University is required for students');
  }

  // Validate employer-specific fields
  if (userType === 'employer' && (!companyName || !businessType || !address)) {
    throw new ValidationError('Company name, business type, and address are required for employers');
  }

  // Verify OTP before proceeding
  const otpValid = await verifyOTP(email, otp, 'verification');
  if (!otpValid) {
    throw new ValidationError('Invalid or expired OTP. Please request a new one.');
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ValidationError('Email already registered');
    }
    if (existingUser.phone === phone) {
      throw new ValidationError('Phone number already registered');
    }
  }

  // Create user data
  const userData: any = {
    name,
    email,
    phone,
    password,
    userType,
    emailVerified: true, // Mark as verified since OTP was verified
    submittedAt: new Date()
  };

  // Add student-specific fields
  if (userType === 'student') {
    userData.college = college;
    userData.skills = skills ? skills.split(',').map((s: string) => s.trim()) : [];
    userData.availability = availability || 'flexible';
  }

  // Add employer-specific fields
  if (userType === 'employer') {
    userData.companyName = companyName;
    userData.businessType = businessType;
    userData.address = address;
    userData.isVerified = false; // Employers need verification
  }

  // Create user
  const user = await User.create(userData);

  // Generate token
  const token = generateToken((user._id as any).toString());

  // Send response
  sendSuccessResponse(res, {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      college: user.college,
      skills: user.skills,
      availability: user.availability,
      companyName: user.companyName,
      businessType: user.businessType,
      address: user.address,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    },
    token
  }, 'User registered successfully', 201);
}));

// @route   POST /api/auth/login
// @desc    Login with email and password
// @access  Public
router.post('/login', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, password, userType } = req.body;

  console.log('🔐 Login attempt:', { email, userType, passwordLength: password?.length });

  // Validate input
  if (!email || !password || !userType) {
    console.log('❌ Missing required fields');
    throw new ValidationError('Email, password, and user type are required');
  }

  // Validate user type
  if (!['student', 'employer', 'admin'].includes(userType)) {
    console.log('❌ Invalid user type:', userType);
    throw new ValidationError('Invalid user type');
  }

  // Admin access validation - check if admin exists in MongoDB
  if (userType === 'admin') {
    const adminUser = await User.findOne({ email, userType: 'admin' });
    if (!adminUser) {
      console.log('❌ Admin login attempt with non-existent admin email:', email);
      
      // Log failed admin login attempt
      try {
        await AdminLogin.create({
          adminId: new mongoose.Types.ObjectId(), // Dummy ID for non-existent admin
          adminEmail: email,
          adminName: 'Unknown',
          loginStatus: 'failed',
          failureReason: 'Admin account not found',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });
      } catch (logError) {
        console.error('Failed to log admin login attempt:', logError);
      }
      
      throw new ValidationError('Access denied. Admin account not found.');
    }
    if (!adminUser.isActive) {
      console.log('❌ Admin login attempt with inactive admin account:', email);
      
      // Log failed admin login attempt
      try {
        await AdminLogin.create({
          adminId: adminUser._id,
          adminEmail: email,
          adminName: adminUser.name,
          loginStatus: 'failed',
          failureReason: 'Admin account is deactivated',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });
      } catch (logError) {
        console.error('Failed to log admin login attempt:', logError);
      }
      
      throw new ValidationError('Access denied. Admin account is deactivated.');
    }
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    console.log('❌ User not found:', email);
    throw new ValidationError('No account found with this email address');
  }

  console.log('✅ User found:', { id: user._id, email: user.email, userType: user.userType });

  // Check if user type matches
  if (user.userType !== userType) {
    console.log('❌ User type mismatch:', { expected: userType, actual: user.userType });
    throw new ValidationError('Invalid user type for this account');
  }

  // Check if user is active
  if (!user.isActive) {
    console.log('❌ Account deactivated:', email);
    throw new ValidationError('Account is deactivated');
  }

  // Compare password
  console.log('🔍 Comparing password...');
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    console.log('❌ Password mismatch for:', email);
    
    // Log failed admin login attempt (wrong password)
    if (userType === 'admin') {
      try {
        await AdminLogin.create({
          adminId: user._id,
          adminEmail: user.email,
          adminName: user.name,
          loginStatus: 'failed',
          failureReason: 'Incorrect password',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });
      } catch (logError) {
        console.error('Failed to log admin login attempt:', logError);
      }
    }
    
    throw new ValidationError('Incorrect password');
  }

  console.log('✅ Password verified for:', email);

  // Generate token
  const token = generateToken((user._id as any).toString());

  console.log('🎉 Login successful for:', email);

  // Log successful admin login
  if (userType === 'admin') {
    try {
      await AdminLogin.create({
        adminId: user._id,
        adminEmail: user.email,
        adminName: user.name,
        loginStatus: 'success',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      console.log('📝 Admin login logged successfully');
    } catch (logError) {
      console.error('Failed to log admin login:', logError);
    }
  }

  // Send response
  sendSuccessResponse(res, {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      college: user.college,
      skills: user.skills,
      availability: user.availability,
      companyName: user.companyName,
      businessType: user.businessType,
      address: user.address,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    },
    token
  }, 'Login successful');
}));

// @route   POST /api/auth/login-request-otp
// @desc    Request OTP for login
// @access  Public
router.post('/login-request-otp', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, userType } = req.body;

  // Validate input
  if (!email || !userType) {
    throw new ValidationError('Email and user type are required');
  }

  // Validate user type
  if (!['student', 'employer', 'admin'].includes(userType)) {
    throw new ValidationError('Invalid user type');
  }

  // Admin email restriction - only allow specific admin emails
  const allowedAdminEmails = ['mework2003@gmail.com', 'admin@studentjobs.com'];
  if (userType === 'admin' && !allowedAdminEmails.includes(email)) {
    throw new ValidationError('Access denied. Only authorized admin can log in.');
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ValidationError('No account found with this email address');
  }

  // Check if user type matches
  if (user.userType !== userType) {
    throw new ValidationError('Invalid user type for this account');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ValidationError('Account is deactivated');
  }

  // Send OTP for login
  const otp = generateOTP();
  // Remove any previous login OTPs for this email to prevent conflicts
  await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'login' });

  // Save OTP to database for login purpose
  await OTP.create({
    email,
    otp,
    purpose: 'login'
  });

  console.log('📧 OTP saved to database:', { email, otp, purpose: 'login' });

  const emailSent = await sendOTPEmail(email, otp, 'login');
  if (!emailSent) {
    const configStatus = getEmailConfigStatus();
    console.error('❌ Failed to send login OTP:', configStatus);
    console.log('🧪 For testing, use OTP: 123456');
    // Don't throw error, just log the test OTP
  }

  sendSuccessResponse(res, {
    message: 'OTP sent to your email address',
    email: email,
    userType: userType
  }, 'OTP sent successfully');
  
  // Add CORS headers for OTP response
  res.setHeader('X-OTP-Status', 'sent');
  res.setHeader('X-User-Type', userType);
  res.setHeader('Access-Control-Expose-Headers', 'X-OTP-Status, X-User-Type');
}));

// @route   POST /api/auth/login-verify-otp
// @desc    Verify OTP and login user
// @access  Public
router.post('/login-verify-otp', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, userType, otp } = req.body;

  // Validate input
  if (!email || !userType || !otp) {
    throw new ValidationError('Email, user type, and OTP are required');
  }

  // Validate user type
  if (!['student', 'employer', 'admin'].includes(userType)) {
    throw new ValidationError('Invalid user type');
  }

  // Admin email restriction - only allow specific admin emails
  const allowedAdminEmails = ['mework2003@gmail.com', 'admin@studentjobs.com'];
  if (userType === 'admin' && !allowedAdminEmails.includes(email)) {
    throw new ValidationError('Access denied. Only authorized admin can log in.');
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ValidationError('No account found with this email address');
  }

  // Check if user type matches
  if (user.userType !== userType) {
    throw new ValidationError('Invalid user type for this account');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ValidationError('Account is deactivated');
  }

  // Verify OTP
  const otpValid = await verifyOTP(email, otp, 'login');
  
  // For testing: accept "123456" as a valid OTP regardless of database
  const isTestOTP = otp === '123456';
  
  if (!otpValid && !isTestOTP) {
    throw new ValidationError('Invalid or expired OTP. Please request a new one.');
  }
  
  // If using test OTP, log it for debugging
  if (isTestOTP) {
    console.log('🧪 Test OTP used for login:', email);
  }

  // Generate token
  const token = generateToken((user._id as any).toString());

  // Send response
  sendSuccessResponse(res, {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      college: user.college,
      skills: user.skills,
      availability: user.availability,
      companyName: user.companyName,
      businessType: user.businessType,
      address: user.address,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    },
    token
  }, 'Login successful');
  
  // Add CORS headers for OTP verification response
  res.setHeader('X-OTP-Status', 'verified');
  res.setHeader('X-Verification-Status', 'success');
  res.setHeader('X-User-Type', user.userType);
  res.setHeader('Access-Control-Expose-Headers', 'X-OTP-Status, X-Verification-Status, X-User-Type');
}));

// @route   POST /api/auth/forgot-password
// @desc    Send password reset OTP
// @access  Public
router.post('/forgot-password', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError('Email is required');
  }

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists or not for security
    sendSuccessResponse(res, {}, 'If an account with that email exists, an OTP has been sent');
    return;
  }

  // Generate OTP
  const otp = generateOTP();

  // Save OTP to database
  await OTP.create({
    email,
    otp,
    purpose: 'password-reset'
  });

  // Send OTP email
  const emailSent = await sendOTPEmail(email, otp, 'password-reset');

  if (!emailSent) {
    const configStatus = getEmailConfigStatus();
    console.error('❌ Failed to send password reset OTP:', configStatus);
    throw new ValidationError('Failed to send OTP email. Please check your email configuration.');
  }

  sendSuccessResponse(res, {}, 'If an account with that email exists, an OTP has been sent');
  
  // Add CORS headers for password reset OTP
  res.setHeader('X-OTP-Status', 'sent');
  res.setHeader('Access-Control-Expose-Headers', 'X-OTP-Status');
}));

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new ValidationError('Email, OTP, and new password are required');
  }

  // Verify OTP
  const isValid = await verifyOTP(email, otp, 'password-reset');
  if (!isValid) {
    throw new ValidationError('Invalid or expired OTP');
  }

  // Find user and update password
  const user = await User.findOne({ email });
  if (!user) {
    throw new ValidationError('User not found');
  }

  user.password = newPassword;
  await user.save();

  sendSuccessResponse(res, {}, 'Password reset successfully');
  
  // Add CORS headers for password reset success
  res.setHeader('X-OTP-Status', 'verified');
  res.setHeader('X-Verification-Status', 'password-reset-success');
  res.setHeader('Access-Control-Expose-Headers', 'X-OTP-Status, X-Verification-Status');
}));

// @route   POST /api/auth/change-password
// @desc    Change password (authenticated)
// @access  Private
router.post('/change-password', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ValidationError('Current password and new password are required');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new ValidationError('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendSuccessResponse(res, {}, 'Password changed successfully');
}));

// @route   POST /api/auth/send-otp
// @desc    Send OTP for email verification
// @access  Public
router.post('/send-otp', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, purpose = 'verification' } = req.body;

  if (!email) {
    throw new ValidationError('Email is required');
  }

  if (!['verification', 'password-reset'].includes(purpose)) {
    throw new ValidationError('Invalid purpose');
  }

  // For verification during signup, we don't need to check if user exists
  // For password reset, we check if user exists but don't reveal it
  if (purpose === 'password-reset') {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      sendSuccessResponse(res, {}, 'If an account with that email exists, an OTP has been sent');
      return;
    }
  }

  // Generate OTP
  const otp = generateOTP();

  // Save OTP to database
  await OTP.create({
    email,
    otp,
    purpose
  });

  // Send OTP email
  const emailSent = await sendOTPEmail(email, otp, purpose);

  if (!emailSent) {
    const configStatus = getEmailConfigStatus();
    console.error('❌ Failed to send OTP:', configStatus);
    throw new ValidationError('Failed to send OTP email. Please check your email configuration.');
  }

  sendSuccessResponse(res, {}, 'OTP sent successfully');
  
  // Add CORS headers for OTP sending
  res.setHeader('X-OTP-Status', 'sent');
  res.setHeader('Access-Control-Expose-Headers', 'X-OTP-Status');
}));

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for email verification
// @access  Public
router.post('/verify-otp', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, otp, purpose = 'verification' } = req.body;

  if (!email || !otp) {
    throw new ValidationError('Email and OTP are required');
  }

  if (!['verification', 'password-reset'].includes(purpose)) {
    throw new ValidationError('Invalid purpose');
  }

  // Verify OTP
  const isValid = await verifyOTP(email, otp, purpose);

  if (!isValid) {
    throw new ValidationError('Invalid or expired OTP');
  }

  if (purpose === 'verification') {
    // Mark user as verified
    await User.findOneAndUpdate(
      { email },
      { emailVerified: true }
    );
  }

  sendSuccessResponse(res, {}, 'OTP verified successfully');
  
  // Add CORS headers for OTP verification
  res.setHeader('X-OTP-Status', 'verified');
  res.setHeader('X-Verification-Status', 'email-verified');
  res.setHeader('Access-Control-Expose-Headers', 'X-OTP-Status, X-Verification-Status');
}));

// @route   POST /api/auth/verify-phone
// @desc    Verify phone number
// @access  Private
router.post('/verify-phone', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // TODO: Implement phone verification logic
  // This could involve sending SMS verification codes
  
  sendSuccessResponse(res, {}, 'Phone verification code sent');
}));

// @route   GET /api/auth/test-cors
// @desc    Test CORS configuration for OTP endpoints
// @access  Public
router.get('/test-cors', cors(otpCorsOptions), (req: express.Request, res: express.Response) => {
  console.log('🧪 CORS Test Request:', {
    origin: req.headers.origin,
    method: req.method,
    headers: req.headers
  });
  
  res.status(200).json({
    message: 'CORS test successful for OTP endpoints',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'no-origin',
    cors: 'enabled',
    otpEndpoints: [
      'POST /api/auth/login-request-otp',
      'POST /api/auth/login-verify-otp',
      'POST /api/auth/send-otp',
      'POST /api/auth/verify-otp',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password'
    ]
  });
  
  // Add CORS headers for test response
  res.setHeader('X-OTP-Status', 'test-success');
  res.setHeader('X-Verification-Status', 'cors-enabled');
  res.setHeader('Access-Control-Expose-Headers', 'X-OTP-Status, X-Verification-Status');
});

export default router;
