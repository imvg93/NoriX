import express from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import Job from '../models/Job';
import KYC from '../models/KYC';
import Application from '../models/Application';
import { EmployerKYC } from '../models/EmployerKYC';
import LocalBusinessKYC from '../models/LocalBusinessKYC';
import IndividualKYC from '../models/IndividualKYC';
import { KYCAudit } from '../models/KYCAudit';
import { AdminLogin } from '../models/AdminLogin';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, sendErrorResponse, ValidationError } from '../middleware/errorHandler';
import { computeKycStatus } from '../utils/kycStatusHelper';
import SocketManager from '../utils/socketManager';

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/stats', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  console.log('🔍 Admin Stats - Starting comprehensive stats query');
  console.log('  Admin User ID:', req.user!._id);
  
  const [
    totalUsers,
    totalStudents,
    totalEmployers,
    totalAdmins,
    activeUsers,
    verifiedUsers,
    totalJobs,
    pendingJobApprovals,
    approvedJobs,
    rejectedJobs,
    activeJobs,
    totalApplications
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ userType: 'student' }),
    User.countDocuments({ userType: 'employer' }),
    User.countDocuments({ userType: 'admin' }),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isVerified: true }),
    Job.countDocuments(),
    Job.countDocuments({ approvalStatus: 'pending' }),
    Job.countDocuments({ approvalStatus: 'approved' }),
    Job.countDocuments({ approvalStatus: 'rejected' }),
    Job.countDocuments({ status: 'active' }),
    // Note: Application count would need to be added if Application model exists
    0 // Placeholder for now
  ]);

  const stats = {
    users: {
      total: totalUsers,
      students: totalStudents,
      employers: totalEmployers,
      admins: totalAdmins,
      active: activeUsers,
      verified: verifiedUsers,
      pendingApprovals: 0 // No user approval needed
    },
    jobs: {
      total: totalJobs,
      active: activeJobs,
      pendingApprovals: pendingJobApprovals,
      approved: approvedJobs,
      rejected: rejectedJobs
    },
    applications: {
      total: totalApplications
    },
    performance: {
      cpuUsage: null, // TODO: Implement system performance monitoring
      memoryUsage: null
    }
  };

  console.log('📊 Admin Stats - Results:', stats);
  
  sendSuccessResponse(res, stats, 'Admin statistics retrieved successfully');
}));

// User approval routes removed - no approval needed for login/signup

// @route   GET /api/admin/users/pending
// @desc    Get users (simplified - no approval needed)
// @access  Private (Admin only)
router.get('/users/pending', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { userType, page = 1, limit = 10 } = req.query;

  const query: any = { isActive: true };
  if (userType) {
    query.userType = userType;
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));

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

// @route   GET /api/admin/jobs/pending
// @desc    Get active jobs (simplified - no approval needed)
// @access  Private (Admin only)
router.get('/jobs/pending', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10 } = req.query;

  const jobs = await Job.find({ status: 'active' })
    .populate('employer', 'name email companyName')
    .sort({ createdAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));

  const total = await Job.countDocuments({ status: 'active' });

  sendSuccessResponse(res, {
    jobs,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    }
  }, 'Active jobs retrieved successfully');
}));

// @route   PATCH /api/admin/users/:id/approve
// @desc    Approve a user (updates both User and KYC records)
// @access  Private (Admin only)
router.patch('/users/:id/approve', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;

  console.log('🔍 Admin approval request received:', {
    userId: id,
    adminId: req.user!._id,
    timestamp: new Date().toISOString()
  });

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid user ID');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  console.log('📋 User found:', {
    userId: user._id,
    userType: user.userType,
    currentStatus: user.status,
    currentKycStatus: user.kycStatus,
    isActive: user.isActive
  });

  // Convert id to ObjectId if it's a string
  const userIdObjectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

  // Update User model directly using updateOne to ensure it saves
  const updateResult = await User.updateOne(
    { _id: userIdObjectId },
    {
      $set: {
        status: 'approved',
        isActive: true,
        kycStatus: 'approved',
        isVerified: true,
        kycVerifiedAt: new Date()
      },
      $unset: {
        kycRejectedAt: '',
        kycPendingAt: ''
      }
    }
  );

  console.log('📝 MongoDB update result:', {
    matchedCount: updateResult.matchedCount,
    modifiedCount: updateResult.modifiedCount,
    acknowledged: updateResult.acknowledged
  });

  if (updateResult.matchedCount === 0) {
    throw new ValidationError('User not found');
  }

  if (updateResult.modifiedCount === 0) {
    console.log('⚠️ No fields were modified - user may already be approved');
  }

  // Fetch the updated user to verify
  const updatedUser = await User.findById(userIdObjectId);
  if (!updatedUser) {
    throw new ValidationError('User not found after update');
  }

  console.log('✅ User model updated:', {
    userId: updatedUser._id,
    status: updatedUser.status,
    kycStatus: updatedUser.kycStatus,
    isVerified: updatedUser.isVerified,
    isActive: updatedUser.isActive,
    kycVerifiedAt: updatedUser.kycVerifiedAt
  });

  // Update corresponding KYC record based on user type
  if (updatedUser.userType === 'student') {
    // Update student KYC record using updateOne
    const kycUpdateResult = await KYC.updateOne(
      { userId: userIdObjectId, isActive: true },
      {
        $set: {
          verificationStatus: 'approved',
          approvedAt: new Date(),
          approvedBy: req.user!._id
        },
        $unset: {
          rejectedAt: '',
          rejectedBy: '',
          rejectionReason: ''
        }
      }
    );
    console.log('✅ Student KYC update result:', {
      matchedCount: kycUpdateResult.matchedCount,
      modifiedCount: kycUpdateResult.modifiedCount,
      acknowledged: kycUpdateResult.acknowledged
    });
  } else if (updatedUser.userType === 'employer') {
    // Update employer KYC record using updateOne
    const employerKycUpdateResult = await EmployerKYC.updateOne(
      { employerId: userIdObjectId },
      {
        $set: {
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: req.user!._id
        },
        $unset: {
          rejectionReason: ''
        }
      }
    );
    console.log('✅ Employer KYC update result:', {
      matchedCount: employerKycUpdateResult.matchedCount,
      modifiedCount: employerKycUpdateResult.modifiedCount,
      acknowledged: employerKycUpdateResult.acknowledged
    });
  }

  // Verify the update was saved correctly
  const verifiedUser = await User.findById(userIdObjectId);
  console.log('🔍 Verification - User status after save:', {
    userId: verifiedUser?._id,
    status: verifiedUser?.status,
    kycStatus: verifiedUser?.kycStatus,
    isVerified: verifiedUser?.isVerified,
    isActive: verifiedUser?.isActive
  });

  console.log('✅ User approved successfully:', {
    userId: userIdObjectId.toString(),
    userType: updatedUser.userType,
    kycStatus: verifiedUser?.kycStatus,
    isVerified: verifiedUser?.isVerified
  });

  sendSuccessResponse(res, { user: verifiedUser }, 'User approved successfully');
}));

// @route   PATCH /api/admin/users/:id/reject
// @desc    Reject a user (updates both User and KYC records)
// @access  Private (Admin only)
router.patch('/users/:id/reject', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  console.log('🔍 Admin rejection request received:', {
    userId: id,
    adminId: req.user!._id,
    reason: reason,
    timestamp: new Date().toISOString()
  });

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid user ID');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  console.log('📋 User found for rejection:', {
    userId: user._id,
    userType: user.userType,
    currentStatus: user.status,
    currentKycStatus: user.kycStatus
  });

  // Convert id to ObjectId if it's a string
  const userIdObjectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

  // Update User model directly using updateOne to ensure it saves
  const updateResult = await User.updateOne(
    { _id: userIdObjectId },
    {
      $set: {
        status: 'rejected',
        isActive: false,
        kycStatus: 'rejected',
        isVerified: false,
        kycRejectedAt: new Date()
      },
      $unset: {
        kycVerifiedAt: '',
        kycPendingAt: ''
      }
    }
  );

  console.log('📝 MongoDB update result:', {
    matchedCount: updateResult.matchedCount,
    modifiedCount: updateResult.modifiedCount,
    acknowledged: updateResult.acknowledged
  });

  if (updateResult.matchedCount === 0) {
    throw new ValidationError('User not found');
  }

  if (updateResult.modifiedCount === 0) {
    console.log('⚠️ No fields were modified - user may already be rejected');
  }

  // Fetch the updated user to verify
  const updatedUser = await User.findById(userIdObjectId);
  if (!updatedUser) {
    throw new ValidationError('User not found after update');
  }

  console.log('✅ User model updated:', {
    userId: updatedUser._id,
    status: updatedUser.status,
    kycStatus: updatedUser.kycStatus,
    isVerified: updatedUser.isVerified,
    kycRejectedAt: updatedUser.kycRejectedAt
  });

  // Update corresponding KYC record based on user type
  if (updatedUser.userType === 'student') {
    // Update student KYC record using updateOne
    const kycUpdateResult = await KYC.updateOne(
      { userId: userIdObjectId, isActive: true },
      {
        $set: {
          verificationStatus: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: req.user!._id,
          rejectionReason: reason || 'Rejected by admin'
        },
        $unset: {
          approvedAt: '',
          approvedBy: ''
        }
      }
    );
    console.log('✅ Student KYC update result:', {
      matchedCount: kycUpdateResult.matchedCount,
      modifiedCount: kycUpdateResult.modifiedCount,
      acknowledged: kycUpdateResult.acknowledged
    });
  } else if (updatedUser.userType === 'employer') {
    // Update employer KYC record using updateOne
    const employerKycUpdateResult = await EmployerKYC.updateOne(
      { employerId: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          status: 'rejected',
          reviewedAt: new Date(),
          reviewedBy: req.user!._id,
          rejectionReason: reason || 'Rejected by admin'
        }
      }
    );
    console.log('✅ Employer KYC update result:', {
      matchedCount: employerKycUpdateResult.matchedCount,
      modifiedCount: employerKycUpdateResult.modifiedCount,
      acknowledged: employerKycUpdateResult.acknowledged
    });
  }

  // Verify the update was saved correctly
  const verifiedUser = await User.findById(userIdObjectId);
  console.log('🔍 Verification - User status after save:', {
    userId: verifiedUser?._id,
    status: verifiedUser?.status,
    kycStatus: verifiedUser?.kycStatus,
    isVerified: verifiedUser?.isVerified
  });

  console.log('✅ User rejected successfully:', {
    userId: userIdObjectId.toString(),
    userType: updatedUser.userType,
    kycStatus: verifiedUser?.kycStatus,
    reason: reason || 'No reason provided'
  });

  sendSuccessResponse(res, { user: verifiedUser }, 'User rejected successfully');
}));

// User approve/reject routes removed - no approval needed for login/signup

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

  // Update job status and approval status without triggering validation
  const updatedJob = await Job.findByIdAndUpdate(
    id,
    {
      status: 'active',
      approvalStatus: 'approved',
      approvedAt: new Date(),
      approvedBy: req.user!._id
    },
    { new: true }
  );

  if (!updatedJob) {
    throw new ValidationError('Job not found after update');
  }

  const jobId = updatedJob._id instanceof mongoose.Types.ObjectId ? updatedJob._id.toString() : String(updatedJob._id);

  const socketManager = (global as any).socketManager as SocketManager | undefined;
  if (socketManager) {
    socketManager.emitJobApproval(jobId, {
      jobId: updatedJob._id,
      title: updatedJob.jobTitle,
      company: updatedJob.companyName,
      location: updatedJob.location,
      status: 'approved',
      timestamp: new Date()
    });
  }

  sendSuccessResponse(res, { job: updatedJob }, 'Job approved successfully');
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

  // Update job status and approval status
  job.status = 'closed';
  job.approvalStatus = 'rejected';
  job.rejectedAt = new Date();
  job.rejectedBy = req.user!._id;
  job.rejectionReason = reason || 'Job rejected by admin';
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
  
  console.log('📊 Admin KYC Stats - Results:', {
    totalKYC,
    pendingKYC,
    approvedKYC,
    rejectedKYC
  });
  
  sendSuccessResponse(res, {
    total: totalKYC,
    pending: pendingKYC,
    approved: approvedKYC,
    rejected: rejectedKYC
  }, 'KYC statistics retrieved successfully');
}));

// @route   GET /api/admin/kyc/employers
// @desc    Get all employer KYC records (Corporate, Local Business, Individual) with filtering
// @access  Private (Admin only)
router.get('/kyc/employers', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  try {
    const { page = 1, limit = 50, status, search, type = 'all' } = req.query;
    
    const query: any = { isArchived: { $ne: true } }; // Exclude archived records
    if (status && status !== 'all') query.status = status;
    
    // Build search query
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Fetch all three types based on type filter
    let corporateKYC: any[] = [];
    let localBusinessKYC: any[] = [];
    let individualKYC: any[] = [];

    if (type === 'all' || type === 'corporate') {
      corporateKYC = await EmployerKYC.find(query)
        .populate('employerId', 'name email companyName employerCategory')
        .sort({ createdAt: -1 })
        .skip(type === 'all' ? 0 : skip)
        .limit(type === 'all' ? Number(limit) : Number(limit))
        .lean();
    }

    if (type === 'all' || type === 'local_business') {
      localBusinessKYC = await LocalBusinessKYC.find(query)
        .populate('employerId', 'name email companyName employerCategory')
        .sort({ createdAt: -1 })
        .skip(type === 'all' ? 0 : skip)
        .limit(type === 'all' ? Number(limit) : Number(limit))
        .lean();
    }

    if (type === 'all' || type === 'individual') {
      individualKYC = await IndividualKYC.find(query)
        .populate('employerId', 'name email companyName employerCategory')
        .sort({ createdAt: -1 })
        .skip(type === 'all' ? 0 : skip)
        .limit(type === 'all' ? Number(limit) : Number(limit))
        .lean();
    }

    // Combine and normalize all KYC records
    const allKYC = [
      ...corporateKYC.map(k => ({ ...k, kycType: 'corporate' })),
      ...localBusinessKYC.map(k => ({ ...k, kycType: 'local_business' })),
      ...individualKYC.map(k => ({ ...k, kycType: 'individual' }))
    ].sort((a, b) => new Date(b.createdAt || b.submittedAt || 0).getTime() - new Date(a.createdAt || a.submittedAt || 0).getTime());

    // Get counts
    const [corporateTotal, localTotal, individualTotal] = await Promise.all([
      type === 'all' || type === 'corporate' ? EmployerKYC.countDocuments(query) : Promise.resolve(0),
      type === 'all' || type === 'local_business' ? LocalBusinessKYC.countDocuments(query) : Promise.resolve(0),
      type === 'all' || type === 'individual' ? IndividualKYC.countDocuments(query) : Promise.resolve(0)
    ]);

    const total = corporateTotal + localTotal + individualTotal;

    return sendSuccessResponse(res, {
      kyc: allKYC.slice(0, Number(limit)), // Limit combined results
      corporate: {
        records: corporateKYC,
        total: corporateTotal
      },
      localBusiness: {
        records: localBusinessKYC,
        total: localTotal
      },
      individual: {
        records: individualKYC,
        total: individualTotal
      },
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: allKYC.slice(0, Number(limit)).length,
        totalRecords: total
      }
    }, 'All employer KYC records retrieved successfully');
  } catch (error) {
    console.error('❌ Error fetching employer KYC records:', error);
    throw new ValidationError('Failed to fetch employer KYC records');
  }
}));

// @route   GET /api/admin/kyc/all
// @desc    Get all KYC records with filtering and pagination
// @access  Private (Admin only)
router.get('/kyc/all', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  try {
    const { page = 1, limit = 50, status, search, type = 'student' } = req.query;
    
    if (type === 'employer') {
      const query: any = { isArchived: { $ne: true } };
      if (status && status !== 'all') query.status = status;
      if (search) {
        query.$or = [
          { companyName: { $regex: search, $options: 'i' } },
          { 'employerId.name': { $regex: search, $options: 'i' } },
          { 'employerId.email': { $regex: search, $options: 'i' } }
        ];
      }

      const employerKYC = await EmployerKYC.find(query)
        .populate('employerId', 'name email companyName')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await EmployerKYC.countDocuments(query);

      return sendSuccessResponse(res, {
        kyc: employerKYC,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          count: employerKYC.length,
          totalRecords: total
        }
      }, 'All employer KYC records retrieved successfully');
    } else {
      const query: any = {};
      if (status && status !== 'all') query.verificationStatus = status;
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { college: { $regex: search, $options: 'i' } },
          { 'userId.name': { $regex: search, $options: 'i' } },
          { 'userId.email': { $regex: search, $options: 'i' } }
        ];
      }

      const studentKYC = await KYC.find(query)
        .populate('userId', 'name email phone college')
        .sort({ submittedAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await KYC.countDocuments(query);

      return sendSuccessResponse(res, {
        kyc: studentKYC,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          count: studentKYC.length,
          totalRecords: total
        }
      }, 'All student KYC records retrieved successfully');
    }
  } catch (error) {
    console.error('❌ Error fetching all KYC records:', error);
    throw new ValidationError('Failed to fetch KYC records');
  }
}));

// @route   GET /api/admin/kyc/:id
// @desc    Get specific KYC submission details (supports all types)
// @access  Private (Admin only)
router.get('/kyc/:id', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { type } = req.query; // 'student', 'corporate', 'local_business', 'individual'
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid KYC ID');
  }
  
  let kyc: any = null;
  let kycType = 'student';
  
  // Try to find in the appropriate collection
  if (type === 'corporate' || !type) {
    kyc = await EmployerKYC.findById(id)
      .populate('employerId', 'name email companyName employerCategory');
    if (kyc) kycType = 'corporate';
  }
  
  if (!kyc && (type === 'local_business' || !type)) {
    kyc = await LocalBusinessKYC.findById(id)
      .populate('employerId', 'name email companyName employerCategory');
    if (kyc) kycType = 'local_business';
  }
  
  if (!kyc && (type === 'individual' || !type)) {
    kyc = await IndividualKYC.findById(id)
      .populate('employerId', 'name email companyName employerCategory');
    if (kyc) kycType = 'individual';
  }
  
  if (!kyc && (type === 'student' || !type)) {
    kyc = await KYC.findById(id)
      .populate('userId', 'name email phone userType college');
    if (kyc) kycType = 'student';
  }
  
  if (!kyc) {
    throw new ValidationError('KYC submission not found');
  }
  
  sendSuccessResponse(res, { kyc, kycType }, 'KYC submission retrieved successfully');
}));

// @route   PUT /api/admin/kyc/employer/:id/approve
// @desc    Approve employer KYC submission (Corporate, Local Business, or Individual)
// @access  Private (Admin only)
router.put('/kyc/employer/:id/approve', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { reason, kycType } = req.body; // kycType: 'corporate', 'local_business', 'individual'
  
  console.log('🔍 Admin Employer KYC Approve - Starting approval process');
  console.log('  Admin User ID:', req.user!._id);
  console.log('  KYC ID:', id);
  console.log('  KYC Type:', kycType);
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid KYC ID');
  }
  
  if (!kycType || !['corporate', 'local_business', 'individual'].includes(kycType)) {
    throw new ValidationError('Invalid KYC type. Must be: corporate, local_business, or individual');
  }
  
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      let kyc: any = null;
      let employerId: any = null;
      
      // Find KYC in the appropriate collection
      if (kycType === 'corporate') {
        kyc = await EmployerKYC.findById(id).session(session);
        if (kyc) employerId = kyc.employerId;
      } else if (kycType === 'local_business') {
        kyc = await LocalBusinessKYC.findById(id).session(session);
        if (kyc) employerId = kyc.employerId;
      } else if (kycType === 'individual') {
        kyc = await IndividualKYC.findById(id).session(session);
        if (kyc) employerId = kyc.employerId;
      }
      
      if (!kyc) {
        throw new ValidationError('KYC submission not found');
      }
      
      const prevStatus = kyc.status;
      
      // Update KYC status
      kyc.status = 'approved';
      kyc.reviewedAt = new Date();
      kyc.reviewedBy = req.user!._id;
      if (reason) kyc.rejectionReason = undefined; // Clear rejection reason if exists
      await kyc.save({ session });
      
      // Update user status atomically
      await User.findByIdAndUpdate(employerId, { 
        kycStatus: 'approved',
        isVerified: true,
        kycVerifiedAt: new Date(),
        $unset: { kycRejectedAt: 1, kycPendingAt: 1 }
      }, { session });
      
      console.log('✅ Admin Employer KYC Approve - Approval completed');
    });
    
    // Get updated data
    let updatedKYC: any = null;
    if (kycType === 'corporate') {
      updatedKYC = await EmployerKYC.findById(id).populate('employerId', 'name email companyName employerCategory');
    } else if (kycType === 'local_business') {
      updatedKYC = await LocalBusinessKYC.findById(id).populate('employerId', 'name email companyName employerCategory');
    } else if (kycType === 'individual') {
      updatedKYC = await IndividualKYC.findById(id).populate('employerId', 'name email companyName employerCategory');
    }
    
    const updatedUser = await User.findById(updatedKYC?.employerId);
    
    // Create notification
    try {
      const { Notification } = await import('../models/Notification');
      await (Notification as any).create({
        userId: updatedKYC!.employerId,
        type: 'kyc',
        title: 'KYC Approved ✅',
        message: 'Your employer KYC has been approved. You can now post jobs.',
        createdBy: req.user!._id
      });
    } catch (e) {
      console.warn('⚠️ Failed to create approval notification:', (e as any)?.message);
    }
    
    sendSuccessResponse(res, {
      kyc: updatedKYC,
      user: updatedUser,
      kycType,
      message: 'Employer KYC approved successfully'
    }, 'Employer KYC approved successfully');
    
  } catch (error) {
    console.error('❌ Admin Employer KYC Approve - Transaction failed:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}));

// @route   PUT /api/admin/kyc/employer/:id/reject
// @desc    Reject employer KYC submission (Corporate, Local Business, or Individual)
// @access  Private (Admin only)
router.put('/kyc/employer/:id/reject', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { reason, kycType } = req.body;
  
  console.log('🔍 Admin Employer KYC Reject - Starting rejection process');
  console.log('  Admin User ID:', req.user!._id);
  console.log('  KYC ID:', id);
  console.log('  KYC Type:', kycType);
  console.log('  Rejection reason:', reason);
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid KYC ID');
  }
  
  if (!reason || reason.trim().length === 0) {
    throw new ValidationError('Rejection reason is required');
  }
  
  if (!kycType || !['corporate', 'local_business', 'individual'].includes(kycType)) {
    throw new ValidationError('Invalid KYC type. Must be: corporate, local_business, or individual');
  }
  
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      let kyc: any = null;
      let employerId: any = null;
      
      // Find KYC in the appropriate collection
      if (kycType === 'corporate') {
        kyc = await EmployerKYC.findById(id).session(session);
        if (kyc) employerId = kyc.employerId;
      } else if (kycType === 'local_business') {
        kyc = await LocalBusinessKYC.findById(id).session(session);
        if (kyc) employerId = kyc.employerId;
      } else if (kycType === 'individual') {
        kyc = await IndividualKYC.findById(id).session(session);
        if (kyc) employerId = kyc.employerId;
      }
      
      if (!kyc) {
        throw new ValidationError('KYC submission not found');
      }
      
      const prevStatus = kyc.status;
      
      // Update KYC status
      kyc.status = 'rejected';
      kyc.reviewedAt = new Date();
      kyc.reviewedBy = req.user!._id;
      kyc.rejectionReason = reason;
      await kyc.save({ session });
      
      // Update user status atomically
      await User.findByIdAndUpdate(employerId, { 
        kycStatus: 'rejected',
        isVerified: false,
        kycRejectedAt: new Date(),
        $unset: { kycVerifiedAt: 1, kycPendingAt: 1 }
      }, { session });
      
      console.log('✅ Admin Employer KYC Reject - Rejection completed');
    });
    
    // Get updated data
    let updatedKYC: any = null;
    if (kycType === 'corporate') {
      updatedKYC = await EmployerKYC.findById(id).populate('employerId', 'name email companyName employerCategory');
    } else if (kycType === 'local_business') {
      updatedKYC = await LocalBusinessKYC.findById(id).populate('employerId', 'name email companyName employerCategory');
    } else if (kycType === 'individual') {
      updatedKYC = await IndividualKYC.findById(id).populate('employerId', 'name email companyName employerCategory');
    }
    
    const updatedUser = await User.findById(updatedKYC?.employerId);
    
    // Create notification
    try {
      const { Notification } = await import('../models/Notification');
      await (Notification as any).create({
        userId: updatedKYC!.employerId,
        type: 'kyc',
        title: 'KYC Rejected ❌',
        message: `Your employer KYC was rejected. Reason: ${reason}`,
        createdBy: req.user!._id
      });
    } catch (e) {
      console.warn('⚠️ Failed to create rejection notification:', (e as any)?.message);
    }
    
    sendSuccessResponse(res, {
      kyc: updatedKYC,
      user: updatedUser,
      kycType,
      message: 'Employer KYC rejected successfully'
    }, 'Employer KYC rejected successfully');
    
  } catch (error) {
    console.error('❌ Admin Employer KYC Reject - Transaction failed:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}));

// @route   PUT /api/admin/kyc/:id/approve
// @desc    Approve KYC submission (atomic transaction) - Student KYC
// @access  Private (Admin only)
router.put('/kyc/:id/approve', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { reason } = req.body; // Optional approval reason
  
  console.log('🔍 Admin KYC Approve - Starting atomic approval process');
  console.log('  Admin User ID:', req.user!._id);
  console.log('  KYC ID:', id);
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log('❌ Admin KYC Approve - Invalid KYC ID:', id);
    throw new ValidationError('Invalid KYC ID');
  }
  
  // Use MongoDB transaction for atomic updates
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const kyc = await KYC.findById(id).session(session);
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
      
      const prevStatus = kyc.verificationStatus;
      
      // Update KYC status
      kyc.verificationStatus = 'approved';
      kyc.approvedAt = new Date();
      kyc.approvedBy = req.user!._id;
      kyc.verificationNotes = reason || 'Approved by admin';
      await kyc.save({ session });
      
      // Update user status atomically
      await User.findByIdAndUpdate(kyc.userId, { 
        kycStatus: 'approved',
        isVerified: true,
        kycVerifiedAt: new Date(),
        $unset: { kycRejectedAt: 1, kycPendingAt: 1 }
      }, { session });
      
      // Create audit entry
      const auditEntry = new KYCAudit({
        userId: kyc.userId,
        adminId: req.user!._id,
        action: 'approved',
        reason: reason || 'KYC approved by admin',
        prevStatus,
        newStatus: 'approved',
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      await auditEntry.save({ session });
      
      console.log('✅ Admin KYC Approve - Atomic approval completed');
    });
    
    // Get updated data for response
    const updatedKYC = await KYC.findById(id).populate('userId', 'name email phone');
    const updatedUser = await User.findById(updatedKYC?.userId);
    
    // Emit real-time update to user
    const socketManager = (global as any).socketManager;
    if (socketManager && updatedKYC) {
      socketManager.emitKYCStatusUpdate(updatedKYC.userId.toString(), {
        status: 'approved',
        isVerified: true,
        message: 'Your KYC has been approved! You can now explore and apply for jobs.',
        action: 'approved',
        reason: reason || 'Approved by admin'
      });
    }

    // Create in-app notification
    try {
      const { Notification } = await import('../models/Notification');
      await (Notification as any).create({
        userId: updatedKYC!.userId,
        type: 'kyc',
        title: 'KYC Approved ✅',
        message: 'Your KYC has been approved. All features are now enabled.',
        createdBy: req.user!._id
      });
    } catch (e) {
      console.warn('⚠️ Failed to create approval notification:', (e as any)?.message);
    }
    
    // Compute canonical status
    const canonicalStatus = computeKycStatus(updatedUser!, updatedKYC);
    
    sendSuccessResponse(res, {
      kyc: updatedKYC,
      user: updatedUser,
      status: canonicalStatus,
      message: 'KYC approved successfully'
    }, 'KYC approved successfully');
    
  } catch (error) {
    console.error('❌ Admin KYC Approve - Transaction failed:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}));

// @route   PUT /api/admin/kyc/:id/reject
// @desc    Reject KYC submission (atomic transaction)
// @access  Private (Admin only)
router.put('/kyc/:id/reject', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  console.log('🔍 Admin KYC Reject - Starting atomic rejection process');
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
  
  // Use MongoDB transaction for atomic updates
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const kyc = await KYC.findById(id).session(session);
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
      
      const prevStatus = kyc.verificationStatus;
      
      // Update KYC status
      kyc.verificationStatus = 'rejected';
      kyc.rejectedAt = new Date();
      kyc.rejectedBy = req.user!._id;
      kyc.rejectionReason = reason;
      await kyc.save({ session });
      
      // Update user status atomically
      await User.findByIdAndUpdate(kyc.userId, { 
        kycStatus: 'rejected',
        isVerified: false,
        kycRejectedAt: new Date(),
        $unset: { kycVerifiedAt: 1, kycPendingAt: 1 }
      }, { session });
      
      // Create audit entry
      const auditEntry = new KYCAudit({
        userId: kyc.userId,
        adminId: req.user!._id,
        action: 'rejected',
        reason: reason,
        prevStatus,
        newStatus: 'rejected',
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      await auditEntry.save({ session });
      
      console.log('✅ Admin KYC Reject - Atomic rejection completed');
    });
    
    // Get updated data for response
    const updatedKYC = await KYC.findById(id).populate('userId', 'name email phone');
    const updatedUser = await User.findById(updatedKYC?.userId);
    
    // Emit real-time update to user
    const socketManager = (global as any).socketManager;
    if (socketManager && updatedKYC) {
      socketManager.emitKYCStatusUpdate(updatedKYC.userId.toString(), {
        status: 'rejected',
        isVerified: false,
        message: `Your KYC was rejected. Please re-submit with proper details. Reason: ${reason}`,
        action: 'rejected',
        reason: reason,
        canResubmit: true
      });
    }

    // Create in-app notification
    try {
      const { Notification } = await import('../models/Notification');
      await (Notification as any).create({
        userId: updatedKYC!.userId,
        type: 'kyc',
        title: 'KYC Rejected ❌',
        message: `Your KYC was rejected. Reason: ${reason}`,
        createdBy: req.user!._id
      });
    } catch (e) {
      console.warn('⚠️ Failed to create rejection notification:', (e as any)?.message);
    }
    
    // Compute canonical status
    const canonicalStatus = computeKycStatus(updatedUser!, updatedKYC);
    
    sendSuccessResponse(res, {
      kyc: updatedKYC,
      user: updatedUser,
      status: canonicalStatus,
      message: 'KYC rejected successfully'
    }, 'KYC rejected successfully');
    
  } catch (error) {
    console.error('❌ Admin KYC Reject - Transaction failed:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}));

// @route   PATCH /api/admin/kyc/:id/suspend
// @desc    Suspend KYC submission (atomic transaction)
// @access  Private (Admin only)
router.patch('/kyc/:id/suspend', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  console.log('🔍 Admin KYC Suspend - Starting atomic suspension process');
  console.log('  Admin User ID:', req.user!._id);
  console.log('  KYC ID:', id);
  console.log('  Suspension reason:', reason);
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log('❌ Admin KYC Suspend - Invalid KYC ID:', id);
    throw new ValidationError('Invalid KYC ID');
  }
  
  // Use MongoDB transaction for atomic updates
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const kyc = await KYC.findById(id).session(session);
      if (!kyc) {
        console.log('❌ Admin KYC Suspend - KYC not found:', id);
        throw new ValidationError('KYC submission not found');
      }
      
      console.log('📋 Admin KYC Suspend - Found KYC:', {
        id: kyc._id,
        userId: kyc.userId,
        fullName: kyc.fullName,
        email: kyc.email,
        currentStatus: kyc.verificationStatus
      });
      
      const prevStatus = kyc.verificationStatus;
      
      // Update KYC status
      (kyc as any).verificationStatus = 'suspended';
      (kyc as any).suspendedAt = new Date();
      (kyc as any).suspendedBy = req.user!._id;
      (kyc as any).suspensionReason = reason || 'Suspended by admin';
      await kyc.save({ session });
      
      // Update user status atomically
      await User.findByIdAndUpdate(kyc.userId, { 
        kycStatus: 'suspended',
        isVerified: false
      }, { session });
      
      // Create audit entry
      const auditEntry = new KYCAudit({
        userId: kyc.userId,
        adminId: req.user!._id,
        action: 'suspended',
        reason: reason || 'Suspended by admin',
        prevStatus,
        newStatus: 'suspended',
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      await auditEntry.save({ session });
      
      console.log('✅ Admin KYC Suspend - Atomic suspension completed');
    });
    
    // Get updated data for response
    const updatedKYC = await KYC.findById(id).populate('userId', 'name email phone');
    const updatedUser = await User.findById(updatedKYC?.userId);
    
    // Emit real-time update to user
    const socketManager = (global as any).socketManager;
    if (socketManager && updatedKYC) {
      socketManager.emitKYCStatusUpdate(updatedKYC.userId.toString(), {
        status: 'suspended',
        isVerified: false,
        message: 'Your KYC has been suspended. Contact admin for support.',
        action: 'suspended',
        reason: reason || 'Suspended by admin'
      });
    }

    // Create in-app notification
    try {
      const { Notification } = await import('../models/Notification');
      await (Notification as any).create({
        userId: updatedKYC!.userId,
        type: 'kyc',
        title: 'KYC Suspended ⏸️',
        message: 'Your KYC has been suspended. Contact support for assistance.',
        createdBy: req.user!._id
      });
    } catch (e) {
      console.warn('⚠️ Failed to create suspension notification:', (e as any)?.message);
    }
    
    // Compute canonical status
    const canonicalStatus = computeKycStatus(updatedUser!, updatedKYC);
    
    sendSuccessResponse(res, {
      kyc: updatedKYC,
      user: updatedUser,
      status: canonicalStatus,
      message: 'KYC suspended successfully'
    }, 'KYC suspended successfully');
    
  } catch (error) {
    console.error('❌ Admin KYC Suspend - Transaction failed:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}));

// @route   PUT /api/admin/kyc/:id/pending
// @desc    Set KYC submission to pending status
// @access  Private (Admin only)
router.put('/kyc/:id/pending', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  
  console.log('🔍 Admin KYC Pending - Starting pending process');
  console.log('  KYC ID:', id);
  console.log('  Admin User ID:', req.user!._id);
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log('❌ Admin KYC Pending - Invalid KYC ID');
    return sendErrorResponse(res, 400, 'Invalid KYC ID');
  }
  
  const kyc = await KYC.findById(id).populate('userId', 'name email phone userType');
  
  if (!kyc) {
    console.log('❌ Admin KYC Pending - KYC not found');
    return sendErrorResponse(res, 404, 'KYC submission not found');
  }
  
  console.log('✅ Admin KYC Pending - KYC found:', {
    id: kyc._id,
    userId: kyc.userId,
    currentStatus: kyc.verificationStatus
  });
  
  // Update KYC status to pending
  kyc.verificationStatus = 'pending';
  kyc.lastUpdated = new Date();
  await kyc.save();
  
  console.log('✅ Admin KYC Pending - KYC status updated to pending');
  
  // SECURITY: Update user's KYC status in both collections
  await User.findByIdAndUpdate(kyc.userId, { 
    kycStatus: 'pending',
    isVerified: false,
    kycPendingAt: new Date()
  });
  
  console.log('✅ Admin KYC Pending - User KYC status updated in both collections');
  
  sendSuccessResponse(res, { kyc }, 'KYC submission set to pending successfully');
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
  // No approval status filter - approval removed from login/signup

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

  user.status = 'suspended';
  user.isActive = false;
  // Also mark KYC as suspended to gate job actions
  user.kycStatus = 'suspended' as any;
  await user.save();

  // Notify user
  try {
    const { Notification } = await import('../models/Notification');
    await (Notification as any).create({
      userId: user._id,
      type: 'kyc',
      title: 'Account Suspended',
      message: 'Your account KYC status is suspended by admin. Contact support.',
      createdBy: req.user!._id
    });
  } catch (e) {
    console.warn('⚠️ Failed to create suspension notification:', (e as any)?.message);
  }

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

  user.status = 'approved';
  user.isActive = true;
  // Do not auto-approve KYC here; just clear suspended flag if set
  if (user.kycStatus === 'suspended') {
    user.kycStatus = 'pending';
  }
  await user.save();

  // Notify user
  try {
    const { Notification } = await import('../models/Notification');
    await (Notification as any).create({
      userId: user._id,
      type: 'system',
      title: 'Account Activated',
      message: 'Your account has been activated by admin.',
      createdBy: req.user!._id
    });
  } catch (e) {
    console.warn('⚠️ Failed to create activation notification:', (e as any)?.message);
  }

  sendSuccessResponse(res, { user }, 'User activated successfully');
}));

// @route   PATCH /api/admin/users/:id/role
// @desc    Update a user's role/userType
// @access  Private (Admin only)
router.patch('/users/:id/role', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { userType } = req.body as { userType?: 'student' | 'employer' | 'admin' };

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid user ID');
  }

  if (!userType || !['student', 'employer', 'admin'].includes(userType)) {
    throw new ValidationError('Invalid user type. Allowed values are student, employer, admin.');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  // Prevent the currently authenticated admin from demoting their own role accidentally
  const isSelf = String(user._id as mongoose.Types.ObjectId) === String(req.user!._id as mongoose.Types.ObjectId);
  if (isSelf && userType !== 'admin') {
    throw new ValidationError('You cannot change your own role to a non-admin type.');
  }

  user.userType = userType;
  // Only update role if changing to/from admin, otherwise preserve existing role
  if (userType === 'admin') {
    user.role = 'admin';
  } else if (userType === 'student') {
    user.role = 'student';
  }
  // For 'employer' userType, preserve existing role (should be 'individual', 'corporate', or 'local')

  await user.save();

  sendSuccessResponse(res, { user }, 'User role updated successfully');
}));

// @route   GET /api/admin/login-history
// @desc    Get admin login history
// @access  Private (Admin only)
router.get('/login-history', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 20, status, adminId, startDate, endDate } = req.query;
  
  // Build filter object
  const filter: any = {};
  
  if (status && ['success', 'failed'].includes(status as string)) {
    filter.loginStatus = status;
  }
  
  if (adminId && mongoose.Types.ObjectId.isValid(adminId as string)) {
    filter.adminId = new mongoose.Types.ObjectId(adminId as string);
  }
  
  if (startDate || endDate) {
    filter.loginTime = {};
    if (startDate) {
      filter.loginTime.$gte = new Date(startDate as string);
    }
    if (endDate) {
      filter.loginTime.$lte = new Date(endDate as string);
    }
  }
  
  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);
  
  // Get login history with pagination
  const [loginHistory, totalCount] = await Promise.all([
    AdminLogin.find(filter)
      .populate('adminId', 'name email')
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AdminLogin.countDocuments(filter)
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / Number(limit));
  
  sendSuccessResponse(res, {
    loginHistory,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalCount,
      hasNext: Number(page) < totalPages,
      hasPrev: Number(page) > 1
    }
  }, 'Admin login history retrieved successfully');
}));

// @route   GET /api/admin/login-stats
// @desc    Get admin login statistics
// @access  Private (Admin only)
router.get('/login-stats', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { days = 30 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));
  
  // Get login statistics
  const [
    totalLogins,
    successfulLogins,
    failedLogins,
    uniqueAdmins,
    recentLogins
  ] = await Promise.all([
    AdminLogin.countDocuments({ loginTime: { $gte: startDate } }),
    AdminLogin.countDocuments({ 
      loginTime: { $gte: startDate },
      loginStatus: 'success'
    }),
    AdminLogin.countDocuments({ 
      loginTime: { $gte: startDate },
      loginStatus: 'failed'
    }),
    AdminLogin.distinct('adminId', { loginTime: { $gte: startDate } }),
    AdminLogin.find({ loginTime: { $gte: startDate } })
      .populate('adminId', 'name email')
      .sort({ loginTime: -1 })
      .limit(10)
  ]);
  
  // Get daily login counts for the last 7 days
  const dailyStats = await AdminLogin.aggregate([
    {
      $match: {
        loginTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$loginTime' }
        },
        successCount: {
          $sum: { $cond: [{ $eq: ['$loginStatus', 'success'] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ['$loginStatus', 'failed'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  sendSuccessResponse(res, {
    period: `${days} days`,
    totalLogins,
    successfulLogins,
    failedLogins,
    successRate: totalLogins > 0 ? ((successfulLogins / totalLogins) * 100).toFixed(2) : 0,
    uniqueAdmins: uniqueAdmins.length,
    recentLogins,
    dailyStats
  }, 'Admin login statistics retrieved successfully');
}));

// @route   GET /api/admin/dashboard-data
// @desc    Get comprehensive admin dashboard data
// @access  Private (Admin only)
router.get('/dashboard-data', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  try {
    // Get KYC data with student details
    const kycData = await KYC.find({})
      .populate('userId', 'name email phone college skills isActive emailVerified phoneVerified')
      .sort({ submittedAt: -1 });

    // Get admin login history
    const loginHistory = await AdminLogin.find({})
      .populate('adminId', 'name email')
      .sort({ loginTime: -1 })
      .limit(20);

    // Get statistics
    const [
      totalKYC,
      pendingKYC,
      approvedKYC,
      rejectedKYC,
      totalLogins,
      successfulLogins,
      failedLogins,
      totalStudents,
      totalEmployers
    ] = await Promise.all([
      KYC.countDocuments(),
      KYC.countDocuments({ verificationStatus: 'pending' }),
      KYC.countDocuments({ verificationStatus: 'approved' }),
      KYC.countDocuments({ verificationStatus: 'rejected' }),
      AdminLogin.countDocuments(),
      AdminLogin.countDocuments({ loginStatus: 'success' }),
      AdminLogin.countDocuments({ loginStatus: 'failed' }),
      User.countDocuments({ userType: 'student' }),
      User.countDocuments({ userType: 'employer' })
    ]);

    // Format KYC data
    const formattedKYC = kycData.map(kyc => ({
      _id: kyc._id,
      studentId: kyc.userId._id,
      studentName: kyc.fullName,
      studentEmail: kyc.email,
      studentPhone: kyc.phone,
      college: kyc.college,
      courseYear: kyc.courseYear,
      status: kyc.verificationStatus,
      submittedAt: kyc.submittedAt,
      approvedAt: kyc.approvedAt,
      approvedBy: kyc.approvedBy,
      rejectedAt: kyc.rejectedAt,
      rejectedBy: kyc.rejectedBy,
      rejectionReason: kyc.rejectionReason,
      documents: {
        aadharCard: kyc.aadharCard,
        collegeIdCard: kyc.collegeIdCard
      },
      availability: {
        hoursPerWeek: kyc.hoursPerWeek,
        availableDays: kyc.availableDays,
        stayType: kyc.stayType
      },
      jobPreferences: {
        preferredJobTypes: kyc.preferredJobTypes,
        experienceSkills: kyc.experienceSkills
      },
      emergencyContact: kyc.emergencyContact,
      payroll: kyc.payroll,
      userDetails: kyc.userId && typeof kyc.userId === 'object' && 'name' in kyc.userId ? {
        name: (kyc.userId as any).name,
        email: (kyc.userId as any).email,
        phone: (kyc.userId as any).phone,
        college: (kyc.userId as any).college,
        skills: (kyc.userId as any).skills,
        isActive: (kyc.userId as any).isActive,
        emailVerified: (kyc.userId as any).emailVerified,
        phoneVerified: (kyc.userId as any).phoneVerified,
        // approvalStatus removed - no approval needed for login/signup
      } : null
    }));

    // Format login history
    const formattedLogins = loginHistory.map(login => ({
      _id: login._id,
      adminId: login.adminId && typeof login.adminId === 'object' && '_id' in login.adminId ? (login.adminId as any)._id : login.adminId,
      adminName: login.adminName,
      adminEmail: login.adminEmail,
      loginTime: login.loginTime,
      loginStatus: login.loginStatus,
      ipAddress: login.ipAddress,
      userAgent: login.userAgent,
      failureReason: login.failureReason,
      sessionDuration: login.sessionDuration,
      logoutTime: login.logoutTime
    }));

    // Calculate success rate
    const loginSuccessRate = totalLogins > 0 ? ((successfulLogins / totalLogins) * 100).toFixed(2) : 0;
    const kycApprovalRate = totalKYC > 0 ? ((approvedKYC / totalKYC) * 100).toFixed(2) : 0;

    sendSuccessResponse(res, {
      kycData: formattedKYC,
      loginHistory: formattedLogins,
      statistics: {
        kyc: {
          total: totalKYC,
          pending: pendingKYC,
          approved: approvedKYC,
          rejected: rejectedKYC,
          approvalRate: kycApprovalRate
        },
        logins: {
          total: totalLogins,
          successful: successfulLogins,
          failed: failedLogins,
          successRate: loginSuccessRate
        },
        users: {
          students: totalStudents,
          employers: totalEmployers,
          total: totalStudents + totalEmployers
        }
      }
    }, 'Admin dashboard data retrieved successfully');
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    throw new ValidationError('Failed to fetch admin dashboard data');
  }
}));

router.get('/employers/:employerId/details', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { employerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    throw new ValidationError('Invalid employer ID');
  }

  const employer = await User.findById(employerId)
    .select('-password -refreshToken -resetToken')
    .lean();

  if (!employer || employer.userType !== 'employer') {
    throw new ValidationError('Employer not found');
  }

  const [jobCount, latestKYC] = await Promise.all([
    Job.countDocuments({ employerId }),
    KYC.findOne({ userId: employerId, isActive: true })
      .sort({ createdAt: -1 })
      .lean()
  ]);

  const canonicalStatus = computeKycStatus(employer as any, latestKYC as any);

  sendSuccessResponse(res, {
    employer,
    jobCount,
    kyc: {
      status: canonicalStatus,
      record: latestKYC
    }
  }, 'Employer details retrieved successfully');
}));

// ==================== COMPREHENSIVE ADMIN DATA ENDPOINTS ====================

// @route   GET /api/admin/comprehensive-data
// @desc    Get all data for admin dashboard (users, jobs, applications, KYC)
// @access  Private (Admin only)
router.get('/comprehensive-data', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  try {
    console.log('🔍 Fetching comprehensive admin data...');
    
    // Fetch all users with pagination
    const { userPage = 1, userLimit = 50, userType, userStatus } = req.query;
    const userQuery: any = {};
    if (userType && userType !== 'all') userQuery.userType = userType;
    if (userStatus && userStatus !== 'all') {
      if (userStatus === 'active') userQuery.isActive = true;
      if (userStatus === 'inactive') userQuery.isActive = false;
    }

    const users = await User.find(userQuery)
      .select('-password -refreshToken -resetToken')
      .sort({ createdAt: -1 })
      .limit(Number(userLimit))
      .skip((Number(userPage) - 1) * Number(userLimit))
      .lean();

    const totalUsers = await User.countDocuments(userQuery);

    // Fetch all jobs with pagination
    const { jobPage = 1, jobLimit = 50, jobStatus, jobApprovalStatus } = req.query;
    const jobQuery: any = {};
    if (jobStatus && jobStatus !== 'all') jobQuery.status = jobStatus;
    if (jobApprovalStatus && jobApprovalStatus !== 'all') jobQuery.approvalStatus = jobApprovalStatus;

    const jobs = await Job.find(jobQuery)
      .populate('employerId', 'name email companyName')
      .sort({ createdAt: -1 })
      .limit(Number(jobLimit))
      .skip((Number(jobPage) - 1) * Number(jobLimit))
      .lean();

    const totalJobs = await Job.countDocuments(jobQuery);

    // Fetch all applications with pagination
    const { appPage = 1, appLimit = 50, appStatus } = req.query;
    const appQuery: any = {};
    if (appStatus && appStatus !== 'all') appQuery.status = appStatus;

    const applications = await Application.find(appQuery)
      .populate('studentId', 'name email phone college')
      .populate({
        path: 'jobId',
        select: 'title company location employerId',
        populate: {
          path: 'employerId',
          select: 'name email companyName'
        }
      })
      .sort({ createdAt: -1 })
      .limit(Number(appLimit))
      .skip((Number(appPage) - 1) * Number(appLimit))
      .lean();

    const totalApplications = await Application.countDocuments(appQuery);

    // Fetch all KYC records with pagination
    const { kycPage = 1, kycLimit = 50, kycStatus } = req.query;
    const kycQuery: any = {};
    if (kycStatus && kycStatus !== 'all') kycQuery.verificationStatus = kycStatus;

    const kycRecords = await KYC.find(kycQuery)
      .populate('userId', 'name email phone college')
      .sort({ submittedAt: -1 })
      .limit(Number(kycLimit))
      .skip((Number(kycPage) - 1) * Number(kycLimit))
      .lean();

    const totalKYC = await KYC.countDocuments(kycQuery);

    // Fetch all employer KYC records
    const employerKYC = await EmployerKYC.find({})
      .populate('employerId', 'name email companyName')
      .sort({ createdAt: -1 })
      .lean();

    // Get comprehensive statistics
    const [
      totalStudents,
      totalEmployers,
      totalAdmins,
      activeUsers,
      pendingJobs,
      approvedJobs,
      rejectedJobs,
      pendingKYC,
      approvedKYC,
      rejectedKYC,
      pendingApplications,
      approvedApplications,
      rejectedApplications
    ] = await Promise.all([
      User.countDocuments({ userType: 'student' }),
      User.countDocuments({ userType: 'employer' }),
      User.countDocuments({ userType: 'admin' }),
      User.countDocuments({ isActive: true }),
      Job.countDocuments({ approvalStatus: 'pending' }),
      Job.countDocuments({ approvalStatus: 'approved' }),
      Job.countDocuments({ approvalStatus: 'rejected' }),
      KYC.countDocuments({ verificationStatus: 'pending' }),
      KYC.countDocuments({ verificationStatus: 'approved' }),
      KYC.countDocuments({ verificationStatus: 'rejected' }),
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'approved' }),
      Application.countDocuments({ status: 'rejected' })
    ]);

    const comprehensiveData = {
      users: {
        data: users,
        pagination: {
          current: Number(userPage),
          total: Math.ceil(totalUsers / Number(userLimit)),
          count: users.length,
          totalRecords: totalUsers
        },
        stats: {
          total: totalUsers,
          students: totalStudents,
          employers: totalEmployers,
          admins: totalAdmins,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        }
      },
      jobs: {
        data: jobs,
        pagination: {
          current: Number(jobPage),
          total: Math.ceil(totalJobs / Number(jobLimit)),
          count: jobs.length,
          totalRecords: totalJobs
        },
        stats: {
          total: totalJobs,
          pending: pendingJobs,
          approved: approvedJobs,
          rejected: rejectedJobs,
          active: approvedJobs
        }
      },
      applications: {
        data: applications,
        pagination: {
          current: Number(appPage),
          total: Math.ceil(totalApplications / Number(appLimit)),
          count: applications.length,
          totalRecords: totalApplications
        },
        stats: {
          total: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications
        }
      },
      kyc: {
        studentKYC: {
          data: kycRecords,
          pagination: {
            current: Number(kycPage),
            total: Math.ceil(totalKYC / Number(kycLimit)),
            count: kycRecords.length,
            totalRecords: totalKYC
          },
          stats: {
            total: totalKYC,
            pending: pendingKYC,
            approved: approvedKYC,
            rejected: rejectedKYC
          }
        },
        employerKYC: {
          data: employerKYC,
          stats: {
            total: employerKYC.length,
            pending: employerKYC.filter(k => k.status === 'pending').length,
            approved: employerKYC.filter(k => k.status === 'approved').length,
            rejected: employerKYC.filter(k => k.status === 'rejected').length
          }
        }
      },
      summary: {
        totalUsers,
        totalJobs,
        totalApplications,
        totalKYC: totalKYC + employerKYC.length,
        activeEmployers: totalEmployers,
        pendingApprovals: pendingJobs + pendingKYC + pendingApplications
      }
    };

    console.log('📊 Comprehensive admin data fetched successfully');
    sendSuccessResponse(res, comprehensiveData, 'Comprehensive admin data retrieved successfully');
  } catch (error) {
    console.error('❌ Error fetching comprehensive admin data:', error);
    throw new ValidationError('Failed to fetch comprehensive admin data');
  }
}));

// @route   GET /api/admin/users/all
// @desc    Get all users with filtering and pagination
// @access  Private (Admin only)
router.get('/users/all', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  try {
    const { page = 1, limit = 50, userType, status, search } = req.query;
    
    const query: any = {};
    if (userType && userType !== 'all') query.userType = userType;
    if (status && status !== 'all') {
      if (status === 'active') query.isActive = true;
      if (status === 'inactive') query.isActive = false;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -refreshToken -resetToken')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await User.countDocuments(query);

    sendSuccessResponse(res, {
      users,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: users.length,
        totalRecords: total
      }
    }, 'All users retrieved successfully');
  } catch (error) {
    console.error('❌ Error fetching all users:', error);
    throw new ValidationError('Failed to fetch users');
  }
}));

// @route   GET /api/admin/jobs/all
// @desc    Get all jobs with filtering and pagination
// @access  Private (Admin only)
router.get('/jobs/all', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  try {
    const { page = 1, limit = 50, status, approvalStatus, search } = req.query;
    
    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (approvalStatus && approvalStatus !== 'all') query.approvalStatus = approvalStatus;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const jobs = await Job.find(query)
      .populate('employer', 'name email companyName')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Job.countDocuments(query);

    sendSuccessResponse(res, {
      jobs,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: jobs.length,
        totalRecords: total
      }
    }, 'All jobs retrieved successfully');
  } catch (error) {
    console.error('❌ Error fetching all jobs:', error);
    throw new ValidationError('Failed to fetch jobs');
  }
}));

// @route   GET /api/admin/applications/all
// @desc    Get all applications with filtering and pagination
// @access  Private (Admin only)
router.get('/applications/all', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    
    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { 'studentId.name': { $regex: search, $options: 'i' } },
        { 'jobId.title': { $regex: search, $options: 'i' } },
        { 'jobId.employerId.name': { $regex: search, $options: 'i' } }
      ];
    }

    const applications = await Application.find(query)
      .populate('studentId', 'name email phone college')
      .populate({
        path: 'jobId',
        select: 'title company location employerId',
        populate: {
          path: 'employerId',
          select: 'name email companyName'
        }
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Application.countDocuments(query);

    sendSuccessResponse(res, {
      applications,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: applications.length,
        totalRecords: total
      }
    }, 'All applications retrieved successfully');
  } catch (error) {
    console.error('❌ Error fetching all applications:', error);
    throw new ValidationError('Failed to fetch applications');
  }
}));

// @route   GET /api/admin/dashboard-summary
// @desc    Get dashboard summary statistics
// @access  Private (Admin only)
router.get('/dashboard-summary', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  try {
    console.log('🔍 Fetching dashboard summary...');
    
    const [
      totalUsers,
      totalStudents,
      totalEmployers,
      totalAdmins,
      activeUsers,
      totalJobs,
      pendingJobs,
      approvedJobs,
      rejectedJobs,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalStudentKYC,
      pendingStudentKYC,
      approvedStudentKYC,
      rejectedStudentKYC,
      totalEmployerKYC,
      pendingEmployerKYC,
      approvedEmployerKYC,
      rejectedEmployerKYC
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ userType: 'student' }),
      User.countDocuments({ userType: 'employer' }),
      User.countDocuments({ userType: 'admin' }),
      User.countDocuments({ isActive: true }),
      Job.countDocuments(),
      Job.countDocuments({ approvalStatus: 'pending' }),
      Job.countDocuments({ approvalStatus: 'approved' }),
      Job.countDocuments({ approvalStatus: 'rejected' }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'approved' }),
      Application.countDocuments({ status: 'rejected' }),
      KYC.countDocuments(),
      KYC.countDocuments({ verificationStatus: 'pending' }),
      KYC.countDocuments({ verificationStatus: 'approved' }),
      KYC.countDocuments({ verificationStatus: 'rejected' }),
      EmployerKYC.countDocuments(),
      EmployerKYC.countDocuments({ status: 'pending' }),
      EmployerKYC.countDocuments({ status: 'approved' }),
      EmployerKYC.countDocuments({ status: 'rejected' })
    ]);

    const summary = {
      users: {
        total: totalUsers,
        students: totalStudents,
        employers: totalEmployers,
        admins: totalAdmins,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      jobs: {
        total: totalJobs,
        pending: pendingJobs,
        approved: approvedJobs,
        rejected: rejectedJobs,
        active: approvedJobs
      },
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        approved: approvedApplications,
        rejected: rejectedApplications
      },
      kyc: {
        student: {
          total: totalStudentKYC,
          pending: pendingStudentKYC,
          approved: approvedStudentKYC,
          rejected: rejectedStudentKYC
        },
        employer: {
          total: totalEmployerKYC,
          pending: pendingEmployerKYC,
          approved: approvedEmployerKYC,
          rejected: rejectedEmployerKYC
        },
        total: totalStudentKYC + totalEmployerKYC
      },
      overview: {
        totalUsers,
        totalJobs,
        totalApplications,
        totalKYC: totalStudentKYC + totalEmployerKYC,
        activeEmployers: totalEmployers,
        pendingApprovals: pendingJobs + pendingStudentKYC + pendingEmployerKYC + pendingApplications
      }
    };

    console.log('📊 Dashboard summary fetched successfully');
    sendSuccessResponse(res, summary, 'Dashboard summary retrieved successfully');
  } catch (error) {
    console.error('❌ Error fetching dashboard summary:', error);
    throw new ValidationError('Failed to fetch dashboard summary');
  }
}));

export default router;