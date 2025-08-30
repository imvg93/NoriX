import express from 'express';
import User from '../models/User';
import Job from '../models/Job';
import Application from '../models/Application';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, ValidationError } from '../middleware/errorHandler';

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', authenticateToken, requireAdmin, asyncHandler(async (req: express.Request, res: express.Response) => {
  // Get user statistics
  const totalUsers = await User.countDocuments();
  const totalStudents = await User.countDocuments({ userType: 'student' });
  const totalEmployers = await User.countDocuments({ userType: 'employer' });
  const pendingVerifications = await User.countDocuments({ userType: 'employer', isVerified: false });

  // Get job statistics
  const totalJobs = await Job.countDocuments();
  const activeJobs = await Job.countDocuments({ status: 'active' });
  const pendingJobVerifications = await Job.countDocuments({ isVerified: false });

  // Get application statistics
  const totalApplications = await Application.countDocuments();
  const recentApplications = await Application.countDocuments({
    appliedDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  // Get recent activity
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email userType createdAt');

  const recentJobs = await Job.find()
    .sort({ postedDate: -1 })
    .limit(5)
    .select('title company status postedDate');

  sendSuccessResponse(res, {
    stats: {
      users: {
        total: totalUsers,
        students: totalStudents,
        employers: totalEmployers,
        pendingVerifications
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        pendingVerifications: pendingJobVerifications
      },
      applications: {
        total: totalApplications,
        recent: recentApplications
      }
    },
    recentActivity: {
      users: recentUsers,
      jobs: recentJobs
    }
  }, 'Dashboard statistics retrieved successfully');
}));

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private (Admin only)
router.get('/users', authenticateToken, requireAdmin, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { page = 1, limit = 20, userType, status, search } = req.query;

  const query: any = {};

  // Add filters
  if (userType) query.userType = userType;
  if (status === 'active') query.isActive = true;
  if (status === 'inactive') query.isActive = false;
  if (status === 'unverified') query.isVerified = false;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  sendSuccessResponse(res, {
    users,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    }
  }, 'Users retrieved successfully');
}));

// @route   GET /api/admin/jobs
// @desc    Get all jobs with pagination and filters
// @access  Private (Admin only)
router.get('/jobs', authenticateToken, requireAdmin, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { page = 1, limit = 20, status, verified, search } = req.query;

  const query: any = {};

  // Add filters
  if (status) query.status = status;
  if (verified === 'true') query.isVerified = true;
  if (verified === 'false') query.isVerified = false;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
  }

  const jobs = await Job.find(query)
    .populate('employer', 'name email companyName')
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit))
    .sort({ postedDate: -1 });

  const total = await Job.countDocuments(query);

  sendSuccessResponse(res, {
    jobs,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    }
  }, 'Jobs retrieved successfully');
}));

// @route   PUT /api/admin/users/:id/verify
// @desc    Verify employer account
// @access  Private (Admin only)
router.put('/users/:id/verify', authenticateToken, requireAdmin, asyncHandler(async (req: express.Request, res: express.Response) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ValidationError('User not found');
  }

  if (user.userType !== 'employer') {
    throw new ValidationError('Only employer accounts can be verified');
  }

  if (user.isVerified) {
    throw new ValidationError('User is already verified');
  }

  user.isVerified = true;
  await user.save();

  sendSuccessResponse(res, { user }, 'Employer account verified successfully');
}));

// @route   PUT /api/admin/jobs/:id/verify
// @desc    Verify job posting
// @access  Private (Admin only)
router.put('/jobs/:id/verify', authenticateToken, requireAdmin, asyncHandler(async (req: express.Request, res: express.Response) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ValidationError('Job not found');
  }

  if (job.isVerified) {
    throw new ValidationError('Job is already verified');
  }

  job.isVerified = true;
  await job.save();

  sendSuccessResponse(res, { job }, 'Job posting verified successfully');
}));

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Private (Admin only)
router.put('/users/:id/status', authenticateToken, requireAdmin, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    throw new ValidationError('isActive must be a boolean value');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  user.isActive = isActive;
  await user.save();

  sendSuccessResponse(res, { user }, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
}));

// @route   PUT /api/admin/jobs/:id/status
// @desc    Update job status
// @access  Private (Admin only)
router.put('/jobs/:id/status', authenticateToken, requireAdmin, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { status } = req.body;

  if (!['active', 'paused', 'closed', 'expired'].includes(status)) {
    throw new ValidationError('Invalid job status');
  }

  const job = await Job.findById(req.params.id);
  if (!job) {
    throw new ValidationError('Job not found');
  }

  job.status = status;
  await job.save();

  sendSuccessResponse(res, { job }, 'Job status updated successfully');
}));

// @route   DELETE /api/admin/users/:id
// @desc    Delete user account (admin only)
// @access  Private (Admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, asyncHandler(async (req: express.Request, res: express.Response) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  // Check if user has active jobs or applications
  const activeJobs = await Job.countDocuments({ employer: user._id, status: 'active' });
  const activeApplications = await Application.countDocuments({
    $or: [{ student: user._id }, { employer: user._id }],
    status: { $in: ['applied', 'shortlisted', 'interviewed'] }
  });

  if (activeJobs > 0 || activeApplications > 0) {
    throw new ValidationError('Cannot delete user with active jobs or applications');
  }

  await User.findByIdAndDelete(user._id);

  sendSuccessResponse(res, {}, 'User account deleted successfully');
}));

// @route   DELETE /api/admin/jobs/:id
// @desc    Delete job posting (admin only)
// @access  Private (Admin only)
router.delete('/jobs/:id', authenticateToken, requireAdmin, asyncHandler(async (req: express.Request, res: express.Response) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    throw new ValidationError('Job not found');
  }

  // Check if job has active applications
  const activeApplications = await Application.countDocuments({
    job: job._id,
    status: { $in: ['applied', 'shortlisted', 'interviewed'] }
  });

  if (activeApplications > 0) {
    throw new ValidationError('Cannot delete job with active applications');
  }

  await Job.findByIdAndDelete(job._id);

  sendSuccessResponse(res, {}, 'Job posting deleted successfully');
}));

// @route   GET /api/admin/analytics
// @desc    Get platform analytics
// @access  Private (Admin only)
router.get('/analytics', authenticateToken, requireAdmin, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { period = '30' } = req.query; // days

  const startDate = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);

  // User growth
  const userGrowth = await User.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Job growth
  const jobGrowth = await Job.aggregate([
    { $match: { postedDate: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$postedDate' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Application growth
  const applicationGrowth = await Application.aggregate([
    { $match: { appliedDate: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedDate' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Top performing metrics
  const topEmployers = await Job.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$employer',
        totalJobs: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalApplications: { $sum: '$applications' }
      }
    },
    { $sort: { totalApplications: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'employerInfo'
      }
    },
    { $unwind: '$employerInfo' },
    {
      $project: {
        name: '$employerInfo.name',
        companyName: '$employerInfo.companyName',
        totalJobs: 1,
        totalViews: 1,
        totalApplications: 1
      }
    }
  ]);

  sendSuccessResponse(res, {
    growth: {
      users: userGrowth,
      jobs: jobGrowth,
      applications: applicationGrowth
    },
    topEmployers
  }, 'Analytics retrieved successfully');
}));

export default router;
