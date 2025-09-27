import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, ValidationError } from '../middleware/errorHandler';
import User from '../models/User';
import Job from '../models/Job';
import Application from '../models/Application';
import EmployerKYC from '../models/EmployerKYC';

const router = express.Router();

// GET /api/admin/reports/users - Get comprehensive user statistics
router.get('/users', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // Check if user is admin
  if (req.user?.userType !== 'admin') {
    throw new ValidationError('Admin access required');
  }

  try {
    // Get total user counts by type
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ userType: 'student' });
    const employers = await User.countDocuments({ userType: 'employer' });
    const admins = await User.countDocuments({ userType: 'admin' });

    // Get active/inactive users
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    // Get users by verification status
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: false });

    // Get users by email verification
    const emailVerifiedUsers = await User.countDocuments({ emailVerified: true });
    const emailUnverifiedUsers = await User.countDocuments({ emailVerified: false });

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    // Get users by KYC status
    const kycNotSubmitted = await User.countDocuments({ kycStatus: 'not-submitted' });
    const kycPending = await User.countDocuments({ kycStatus: 'pending' });
    const kycApproved = await User.countDocuments({ kycStatus: 'approved' });
    const kycRejected = await User.countDocuments({ kycStatus: 'rejected' });

    // Get detailed user data for recent additions
    const recentUserDetails = await User.find({ 
      createdAt: { $gte: thirtyDaysAgo } 
    })
    .select('name email userType createdAt isActive isVerified kycStatus')
    .sort({ createdAt: -1 })
    .limit(20);

    // Get user growth over time (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const monthlyGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          students: {
            $sum: { $cond: [{ $eq: ['$userType', 'student'] }, 1, 0] }
          },
          employers: {
            $sum: { $cond: [{ $eq: ['$userType', 'employer'] }, 1, 0] }
          },
          admins: {
            $sum: { $cond: [{ $eq: ['$userType', 'admin'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get top companies by user count
    const topCompanies = await User.aggregate([
      {
        $match: { 
          userType: 'employer',
          companyName: { $exists: true, $nin: [null, ''] }
        }
      },
      {
        $group: {
          _id: '$companyName',
          userCount: { $sum: 1 },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
          }
        }
      },
      {
        $sort: { userCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get user activity summary
    const userActivitySummary = {
      totalUsers,
      userTypes: {
        students,
        employers,
        admins
      },
      status: {
        active: activeUsers,
        inactive: inactiveUsers,
        verified: verifiedUsers,
        unverified: unverifiedUsers,
        emailVerified: emailVerifiedUsers,
        emailUnverified: emailUnverifiedUsers
      },
      kycStatus: {
        notSubmitted: kycNotSubmitted,
        pending: kycPending,
        approved: kycApproved,
        rejected: kycRejected
      },
      recentActivity: {
        newUsersLast30Days: recentUsers,
        recentUserDetails
      },
      growth: {
        monthlyGrowth
      },
      topCompanies
    };

    return sendSuccessResponse(res, userActivitySummary, 'User statistics retrieved successfully');

  } catch (error) {
    console.error('Error fetching user statistics:', error);
    throw new ValidationError('Failed to fetch user statistics');
  }
}));

// GET /api/admin/reports/comprehensive - Get comprehensive system statistics
router.get('/comprehensive', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // Check if user is admin
  if (req.user?.userType !== 'admin') {
    throw new ValidationError('Admin access required');
  }

  try {
    // Get all statistics in parallel
    const [
      userStats,
      jobStats,
      applicationStats,
      kycStats,
      employerKycStats
    ] = await Promise.all([
      // User statistics
      Promise.all([
        User.countDocuments(),
        User.countDocuments({ userType: 'student' }),
        User.countDocuments({ userType: 'employer' }),
        User.countDocuments({ userType: 'admin' }),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isVerified: true })
      ]),
      
      // Job statistics
      Promise.all([
        Job.countDocuments(),
        Job.countDocuments({ status: 'active' }),
        Job.countDocuments({ approvalStatus: 'pending' }),
        Job.countDocuments({ approvalStatus: 'approved' }),
        Job.countDocuments({ approvalStatus: 'rejected' }),
        Job.countDocuments({ status: 'expired' })
      ]),
      
      // Application statistics
      Promise.all([
        Application.countDocuments(),
        Application.countDocuments({ status: 'pending' }),
        Application.countDocuments({ status: 'accepted' }),
        Application.countDocuments({ status: 'rejected' }),
        Application.countDocuments({ status: 'withdrawn' })
      ]),
      
      // Student KYC statistics
      Promise.all([
        User.countDocuments({ kycStatus: 'not-submitted' }),
        User.countDocuments({ kycStatus: 'pending' }),
        User.countDocuments({ kycStatus: 'approved' }),
        User.countDocuments({ kycStatus: 'rejected' })
      ]),
      
      // Employer KYC statistics
      Promise.all([
        EmployerKYC.countDocuments(),
        EmployerKYC.countDocuments({ status: 'pending' }),
        EmployerKYC.countDocuments({ status: 'approved' }),
        EmployerKYC.countDocuments({ status: 'rejected' })
      ])
    ]);

    const comprehensiveStats = {
      users: {
        total: userStats[0],
        students: userStats[1],
        employers: userStats[2],
        admins: userStats[3],
        active: userStats[4],
        verified: userStats[5]
      },
      jobs: {
        total: jobStats[0],
        active: jobStats[1],
        pending: jobStats[2],
        approved: jobStats[3],
        rejected: jobStats[4],
        expired: jobStats[5]
      },
      applications: {
        total: applicationStats[0],
        pending: applicationStats[1],
        accepted: applicationStats[2],
        rejected: applicationStats[3],
        withdrawn: applicationStats[4]
      },
      studentKyc: {
        notSubmitted: kycStats[0],
        pending: kycStats[1],
        approved: kycStats[2],
        rejected: kycStats[3]
      },
      employerKyc: {
        total: employerKycStats[0],
        pending: employerKycStats[1],
        approved: employerKycStats[2],
        rejected: employerKycStats[3]
      }
    };

    return sendSuccessResponse(res, comprehensiveStats, 'Comprehensive statistics retrieved successfully');

  } catch (error) {
    console.error('Error fetching comprehensive statistics:', error);
    throw new ValidationError('Failed to fetch comprehensive statistics');
  }
}));

export default router;
