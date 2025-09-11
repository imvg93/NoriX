import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Job from '../models/Job';
import KYC from '../models/KYC';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, ValidationError } from '../middleware/errorHandler';

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/stats', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const [
    totalUsers,
    totalStudents,
    totalEmployers,
    pendingUserApprovals,
    totalJobs,
    pendingJobApprovals,
    approvedJobs,
    totalApplications
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ userType: 'student' }),
    User.countDocuments({ userType: 'employer' }),
    User.countDocuments({ approvalStatus: 'pending' }),
    Job.countDocuments(),
    Job.countDocuments({ approvalStatus: 'pending' }),
    Job.countDocuments({ approvalStatus: 'approved' }),
    // Note: Application count would need to be added if Application model exists
    0 // Placeholder for now
  ]);

  sendSuccessResponse(res, {
    users: {
      total: totalUsers,
      students: totalStudents,
      employers: totalEmployers,
      pendingApprovals: pendingUserApprovals
    },
    jobs: {
      total: totalJobs,
      pendingApprovals: pendingJobApprovals,
      approved: approvedJobs
    },
    applications: {
      total: totalApplications
    }
  }, 'Admin statistics retrieved successfully');
}));

// @route   GET /api/admin/users/pending
// @desc    Get users pending approval
// @access  Private (Admin only)
router.get('/users/pending', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10, userType } = req.query;

  const query: any = { approvalStatus: 'pending' };
  if (userType) {
    query.userType = userType;
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ submittedAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));

  const total = await User.countDocuments(query);

  sendSuccessResponse(res, {
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  }, 'Pending users retrieved successfully');
}));

// @route   GET /api/admin/jobs/pending
// @desc    Get jobs pending approval
// @access  Private (Admin only)
router.get('/jobs/pending', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10 } = req.query;

  const jobs = await Job.find({ approvalStatus: 'pending' })
    .populate('employer', 'name email companyName')
    .sort({ submittedAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));

  const total = await Job.countDocuments({ approvalStatus: 'pending' });

  sendSuccessResponse(res, {
    jobs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  }, 'Pending jobs retrieved successfully');
}));

// @route   PATCH /api/admin/users/:id/approve
// @desc    Approve a user
// @access  Private (Admin only)
router.patch('/users/:id/approve', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid user ID');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  if (user.approvalStatus !== 'pending') {
    throw new ValidationError('User is not pending approval');
  }

  user.approvalStatus = 'approved';
  user.approvedAt = new Date();
  user.approvedBy = req.user!._id;
  await user.save();

  sendSuccessResponse(res, { user }, 'User approved successfully');
}));

// @route   PATCH /api/admin/users/:id/reject
// @desc    Reject a user
// @access  Private (Admin only)
router.patch('/users/:id/reject', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid user ID');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  if (user.approvalStatus !== 'pending') {
    throw new ValidationError('User is not pending approval');
  }

  user.approvalStatus = 'rejected';
  user.approvedAt = new Date();
  user.approvedBy = req.user!._id;
  user.rejectionReason = reason;
  await user.save();

  sendSuccessResponse(res, { user }, 'User rejected successfully');
}));

// @route   PATCH /api/admin/jobs/:id/approve
// @desc    Approve a job
// @access  Private (Admin only)
router.patch('/jobs/:id/approve', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid job ID');
  }

  const job = await Job.findById(id);
  if (!job) {
    throw new ValidationError('Job not found');
  }

  if (job.approvalStatus !== 'pending') {
    throw new ValidationError('Job is not pending approval');
  }

  job.approvalStatus = 'approved';
  job.status = 'active'; // Make job active after approval
  job.approvedAt = new Date();
  job.approvedBy = req.user!._id;
  await job.save();

  sendSuccessResponse(res, { job }, 'Job approved successfully');
}));

// @route   PATCH /api/admin/jobs/:id/reject
// @desc    Reject a job
// @access  Private (Admin only)
router.patch('/jobs/:id/reject', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid job ID');
  }

  const job = await Job.findById(id);
  if (!job) {
    throw new ValidationError('Job not found');
  }

  if (job.approvalStatus !== 'pending') {
    throw new ValidationError('Job is not pending approval');
  }

  job.approvalStatus = 'rejected';
  job.status = 'closed'; // Close rejected jobs
  job.approvedAt = new Date();
  job.approvedBy = req.user!._id;
  job.rejectionReason = reason;
  await job.save();

  sendSuccessResponse(res, { job }, 'Job rejected successfully');
}));

// @route   GET /api/admin/kyc
// @desc    Get all KYC submissions for admin review
// @access  Private (Admin only)
router.get('/kyc', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { status = 'all', page = 1, limit = 10 } = req.query;
  
  console.log('🔍 Admin KYC Query - Starting query');
  console.log('  Admin User ID:', req.user!._id);
  console.log('  Query params:', { status, page, limit });
  
  let filter: any = { isActive: true };
  if (status !== 'all') {
    filter.verificationStatus = status;
  }
  
  console.log('🔍 Admin KYC Query - Filter:', JSON.stringify(filter, null, 2));
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [kycSubmissions, totalCount] = await Promise.all([
    KYC.find(filter)
      .populate('userId', 'name email phone userType')
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    KYC.countDocuments(filter)
  ]);
  
  console.log('📊 Admin KYC Query - Results:');
  console.log('  Total count:', totalCount);
  console.log('  Returned documents:', kycSubmissions.length);
  console.log('  Documents:', kycSubmissions.map(k => ({
    id: k._id,
    userId: k.userId?._id,
    userName: (k.userId as any)?.name,
    userEmail: (k.userId as any)?.email,
    fullName: k.fullName,
    email: k.email,
    phone: k.phone,
    verificationStatus: k.verificationStatus,
    submittedAt: k.submittedAt,
    createdAt: (k as any).createdAt,
    aadharCard: k.aadharCard ? 'Present' : 'Missing',
    collegeIdCard: k.collegeIdCard ? 'Present' : 'Missing'
  })));
  
  sendSuccessResponse(res, {
    kycSubmissions,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / Number(limit)),
      totalCount,
      hasNext: skip + kycSubmissions.length < totalCount,
      hasPrev: Number(page) > 1
    }
  }, 'KYC submissions retrieved successfully');
}));

// @route   GET /api/admin/kyc/:id
// @desc    Get specific KYC submission details
// @access  Private (Admin only)
router.get('/kyc/:id', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid KYC ID');
  }
  
  const kyc = await KYC.findById(id)
    .populate('userId', 'name email phone userType college');
  
  if (!kyc) {
    throw new ValidationError('KYC submission not found');
  }
  
  sendSuccessResponse(res, { kyc }, 'KYC submission retrieved successfully');
}));

// @route   PUT /api/admin/kyc/:id/approve
// @desc    Approve KYC submission
// @access  Private (Admin only)
router.put('/kyc/:id/approve', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  
  console.log('🔍 Admin KYC Approve - Starting approval process');
  console.log('  Admin User ID:', req.user!._id);
  console.log('  KYC ID:', id);
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log('❌ Admin KYC Approve - Invalid KYC ID:', id);
    throw new ValidationError('Invalid KYC ID');
  }
  
  const kyc = await KYC.findById(id);
  if (!kyc) {
    console.log('❌ Admin KYC Approve - KYC not found:', id);
    throw new ValidationError('KYC submission not found');
  }
  
  console.log('📋 Admin KYC Approve - Found KYC:', {
    id: kyc._id,
    userId: kyc.userId,
    fullName: kyc.fullName,
    email: kyc.email,
    currentStatus: kyc.verificationStatus
  });
  
  if (kyc.verificationStatus !== 'pending') {
    console.log('❌ Admin KYC Approve - KYC not pending:', kyc.verificationStatus);
    throw new ValidationError('KYC submission is not pending review');
  }
  
  kyc.verificationStatus = 'approved';
  kyc.approvedAt = new Date();
  kyc.approvedBy = req.user!._id;
  await kyc.save();
  
  console.log('✅ Admin KYC Approve - KYC approved successfully');
  console.log('  New status:', kyc.verificationStatus);
  console.log('  Approved at:', kyc.approvedAt);
  console.log('  Approved by:', kyc.approvedBy);
  
  // Update user's KYC status
  await User.findByIdAndUpdate(kyc.userId, { 
    kycStatus: 'verified',
    kycVerifiedAt: new Date()
  });
  
  console.log('✅ Admin KYC Approve - User KYC status updated');
  
  sendSuccessResponse(res, { kyc }, 'KYC submission approved successfully');
}));

// @route   PUT /api/admin/kyc/:id/reject
// @desc    Reject KYC submission
// @access  Private (Admin only)
router.put('/kyc/:id/reject', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  console.log('🔍 Admin KYC Reject - Starting rejection process');
  console.log('  Admin User ID:', req.user!._id);
  console.log('  KYC ID:', id);
  console.log('  Rejection reason:', reason);
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log('❌ Admin KYC Reject - Invalid KYC ID:', id);
    throw new ValidationError('Invalid KYC ID');
  }
  
  if (!reason || reason.trim().length === 0) {
    console.log('❌ Admin KYC Reject - Missing rejection reason');
    throw new ValidationError('Rejection reason is required');
  }
  
  const kyc = await KYC.findById(id);
  if (!kyc) {
    console.log('❌ Admin KYC Reject - KYC not found:', id);
    throw new ValidationError('KYC submission not found');
  }
  
  console.log('📋 Admin KYC Reject - Found KYC:', {
    id: kyc._id,
    userId: kyc.userId,
    fullName: kyc.fullName,
    email: kyc.email,
    currentStatus: kyc.verificationStatus
  });
  
  if (kyc.verificationStatus !== 'pending') {
    console.log('❌ Admin KYC Reject - KYC not pending:', kyc.verificationStatus);
    throw new ValidationError('KYC submission is not pending review');
  }
  
  kyc.verificationStatus = 'rejected';
  kyc.rejectedAt = new Date();
  kyc.rejectedBy = req.user!._id;
  kyc.rejectionReason = reason;
  await kyc.save();
  
  console.log('✅ Admin KYC Reject - KYC rejected successfully');
  console.log('  New status:', kyc.verificationStatus);
  console.log('  Rejected at:', kyc.rejectedAt);
  console.log('  Rejected by:', kyc.rejectedBy);
  console.log('  Rejection reason:', kyc.rejectionReason);
  
  // Update user's KYC status
  await User.findByIdAndUpdate(kyc.userId, { 
    kycStatus: 'rejected',
    kycRejectedAt: new Date()
  });
  
  console.log('✅ Admin KYC Reject - User KYC status updated');
  
  sendSuccessResponse(res, { kyc }, 'KYC submission rejected successfully');
}));

// @route   GET /api/admin/kyc/stats
// @desc    Get KYC statistics for admin dashboard
// @access  Private (Admin only)
router.get('/kyc/stats', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  console.log('🔍 Admin KYC Stats - Starting stats query');
  console.log('  Admin User ID:', req.user!._id);
  
  const [
    totalKYC,
    pendingKYC,
    approvedKYC,
    rejectedKYC
  ] = await Promise.all([
    KYC.countDocuments({ isActive: true }),
    KYC.countDocuments({ verificationStatus: 'pending', isActive: true }),
    KYC.countDocuments({ verificationStatus: 'approved', isActive: true }),
    KYC.countDocuments({ verificationStatus: 'rejected', isActive: true })
  ]);
  
  const stats = {
    total: totalKYC,
    pending: pendingKYC,
    approved: approvedKYC,
    rejected: rejectedKYC
  };
  
  console.log('📊 Admin KYC Stats - Results:', stats);
  
  sendSuccessResponse(res, stats, 'KYC statistics retrieved successfully');
}));

// @route   GET /api/admin/users
// @desc    Get all users with optional filtering
// @access  Private (Admin only)
router.get('/users', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10, userType, status } = req.query;

  let filter: any = {};
  if (userType) {
    filter.userType = userType;
  }
  if (status) {
    filter.approvalStatus = status;
  }

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));

  const total = await User.countDocuments(filter);

  sendSuccessResponse(res, {
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  }, 'Users retrieved successfully');
}));

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (soft delete)
// @access  Private (Admin only)
router.delete('/users/:id', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid user ID');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  // Prevent admin from deleting themselves
  if ((user._id as any).toString() === (req.user!._id as string).toString()) {
    throw new ValidationError('Cannot delete your own account');
  }

  // Soft delete by setting isActive to false
  user.isActive = false;
  await user.save();

  sendSuccessResponse(res, {}, 'User deleted successfully');
}));

// @route   PATCH /api/admin/users/:id/suspend
// @desc    Suspend a user
// @access  Private (Admin only)
router.patch('/users/:id/suspend', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid user ID');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  // Prevent admin from suspending themselves
  if ((user._id as any).toString() === (req.user!._id as string).toString()) {
    throw new ValidationError('Cannot suspend your own account');
  }

  user.isActive = false;
  await user.save();

  sendSuccessResponse(res, { user }, 'User suspended successfully');
}));

// @route   PATCH /api/admin/users/:id/activate
// @desc    Activate a user
// @access  Private (Admin only)
router.patch('/users/:id/activate', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid user ID');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  user.isActive = true;
  await user.save();

  sendSuccessResponse(res, { user }, 'User activated successfully');
}));

export default router;