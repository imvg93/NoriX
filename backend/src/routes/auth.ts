import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import OTP from '../models/OTP';
import { authenticateToken, rateLimit, AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, sendErrorResponse, ValidationError } from '../middleware/errorHandler';
import { generateOTP, sendOTPEmail, verifyOTP, getEmailConfigStatus } from '../services/emailService';

const router = express.Router();

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
router.post('/register', rateLimit(15 * 60 * 1000, 10), asyncHandler(async (req: express.Request, res: express.Response) => {
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
  if (!['student', 'employer'].includes(userType)) {
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
    emailVerified: true // Mark as verified since OTP was verified
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

// @route   POST /api/auth/login-request-otp
// @desc    Request OTP for login
// @access  Public
router.post('/login-request-otp', rateLimit(15 * 60 * 1000, 5), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, userType } = req.body;

  // Validate input
  if (!email || !userType) {
    throw new ValidationError('Email and user type are required');
  }

  // Validate user type
  if (!['student', 'employer'].includes(userType)) {
    throw new ValidationError('Invalid user type');
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
  const emailSent = await sendOTPEmail(email, otp, 'login');
  if (!emailSent) {
    const configStatus = getEmailConfigStatus();
    console.error('❌ Failed to send login OTP:', configStatus);
    throw new ValidationError('Failed to send OTP email. Please check your email configuration.');
  }

  sendSuccessResponse(res, {
    message: 'OTP sent to your email address',
    email: email,
    userType: userType
  }, 'OTP sent successfully');
}));

// @route   POST /api/auth/login-verify-otp
// @desc    Verify OTP and login user
// @access  Public
router.post('/login-verify-otp', rateLimit(15 * 60 * 1000, 10), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, userType, otp } = req.body;

  // Validate input
  if (!email || !userType || !otp) {
    throw new ValidationError('Email, user type, and OTP are required');
  }

  // Validate user type
  if (!['student', 'employer'].includes(userType)) {
    throw new ValidationError('Invalid user type');
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
  if (!otpValid) {
    throw new ValidationError('Invalid or expired OTP. Please request a new one.');
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
}));

// @route   POST /api/auth/forgot-password
// @desc    Send password reset OTP
// @access  Public
router.post('/forgot-password', rateLimit(15 * 60 * 1000, 3), asyncHandler(async (req: express.Request, res: express.Response) => {
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
router.post('/send-otp', rateLimit(15 * 60 * 1000, 10), asyncHandler(async (req: express.Request, res: express.Response) => {
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
}));

// @route   POST /api/auth/verify-phone
// @desc    Verify phone number
// @access  Private
router.post('/verify-phone', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // TODO: Implement phone verification logic
  // This could involve sending SMS verification codes
  
  sendSuccessResponse(res, {}, 'Phone verification code sent');
}));

export default router;
