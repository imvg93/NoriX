import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import KYC from '../models/KYC';
import Application from '../models/Application';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, ValidationError } from '../middleware/errorHandler';

const router = express.Router();

// Log route registration
console.log('📝 Profile route module loaded');

// @route   GET /api/profile/:id
// @desc    Get complete student profile data by ID
// @access  Private (can fetch own profile or admin can fetch any)
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const requestingUserId = req.user!._id.toString();
  const requestingUserType = req.user!.userType;

  // Validate ObjectId
  if (!mongoose.isValidObjectId(id)) {
    throw new ValidationError('Invalid student ID format');
  }

  // Check if user can access this profile (own profile or admin)
  if (id !== requestingUserId && requestingUserType !== 'admin') {
    throw new ValidationError('Access denied. You can only view your own profile.');
  }

  // Get user details
  const user = await User.findById(id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  // Only return student profiles
  if (user.userType !== 'student') {
    throw new ValidationError('Profile endpoint is only available for students');
  }

  // Get KYC details and applications in parallel for better performance
  const [kyc, applications] = await Promise.all([
    KYC.findOne({ userId: id, isActive: true }).lean(),
    Application.find({
      $or: [
        { studentId: id },
        { student: id }
      ]
    })
      .populate('jobId', 'jobTitle companyName location salaryRange workType status description createdAt')
      .populate('job', 'jobTitle companyName location salaryRange workType status description createdAt')
      .sort({ appliedAt: -1, createdAt: -1 })
      .limit(50)
      .lean()
  ]);

  // Normalize applications
  const normalizedApplications = applications.map(app => {
    // Type guard for populated objects
    const jobIdObj = app.jobId && typeof app.jobId === 'object' && 'jobTitle' in app.jobId ? app.jobId as any : null;
    const jobObj = app.job && typeof app.job === 'object' && 'jobTitle' in app.job ? app.job as any : null;
    const job = jobIdObj || jobObj;
    
    return {
      _id: String(app._id),
      jobTitle: job ? (job.jobTitle || job.title || 'Unknown Job') : 'Unknown Job',
      company: job ? (job.companyName || job.company || 'Unknown Company') : 'Unknown Company',
      location: job ? (job.location || 'Not specified') : 'Not specified',
      status: app.status || 'applied',
      appliedAt: app.appliedAt || app.createdAt || new Date(),
      coverLetter: app.coverLetter,
      expectedPay: app.expectedPay,
      salaryRange: job ? (job.salaryRange || job.salary || 'Not specified') : 'Not specified'
    };
  });

  // Get work history (approved/accepted applications - these are considered completed work)
  const workHistory = applications
    .filter(app => app.status === 'approved' || app.status === 'accepted')
    .map(app => {
      // Type guard for populated objects
      const jobIdObj = app.jobId && typeof app.jobId === 'object' && 'jobTitle' in app.jobId ? app.jobId as any : null;
      const jobObj = app.job && typeof app.job === 'object' && 'jobTitle' in app.job ? app.job as any : null;
      const job = jobIdObj || jobObj;
      
      return {
        jobTitle: job ? (job.jobTitle || job.title || 'Unknown Job') : 'Unknown Job',
        company: job ? (job.companyName || job.company || 'Unknown Company') : 'Unknown Company',
        status: app.status === 'approved' ? 'Approved' : 'Accepted',
        completedAt: app.hiredDate || app.shortlistedDate || app.appliedAt || app.createdAt || new Date()
      };
    });

  // Get documents from KYC
  const documents: Array<{ type: string; fileUrl: string }> = [];
  if (kyc) {
    if (kyc.aadharCard) {
      documents.push({
        type: 'Aadhaar Card',
        fileUrl: kyc.aadharCard
      });
    }
    if (kyc.collegeIdCard) {
      documents.push({
        type: 'College ID Card',
        fileUrl: kyc.collegeIdCard
      });
    }
  }

  // Extract resume from applications (if any)
  applications.forEach(app => {
    if (app.resume) {
      documents.push({
        type: 'Resume',
        fileUrl: app.resume
      });
    }
  });

  // Build profile response
  const profileData = {
    student: {
      name: user.name || 'Unknown',
      email: user.email || '',
      phone: user.phone || '',
      kycStatus: kyc?.verificationStatus || user.kycStatus || 'not-submitted',
      role: user.skills && user.skills.length > 0 ? user.skills.join(', ') : 'Student',
      skills: user.skills || [],
      experience: kyc?.experienceSkills || 'No experience listed',
      college: user.college || kyc?.college || 'Not specified',
      availability: user.availability || kyc?.availableDays?.join(', ') || 'Not specified',
      // Additional info from KYC
      dob: kyc?.dob ? new Date(kyc.dob).toLocaleDateString() : undefined,
      gender: kyc?.gender || undefined,
      address: kyc?.address || user.address || undefined,
      courseYear: kyc?.courseYear || undefined,
      hoursPerWeek: kyc?.hoursPerWeek || undefined,
      preferredJobTypes: kyc?.preferredJobTypes || [],
      emergencyContact: kyc?.emergencyContact || undefined
    },
    workHistory: workHistory.length > 0 ? workHistory : [],
    applications: normalizedApplications.length > 0 ? normalizedApplications : [],
    documents: documents.length > 0 ? documents : []
  };

  sendSuccessResponse(res, profileData, 'Student profile retrieved successfully');
}));

export default router;

