import express from 'express';
import mongoose from 'mongoose';
import { Job } from '../models/Job';
import { User } from '../models/User';
import { Application } from '../models/Application';
import { KYC } from '../models/KYC';
import { authenticateToken, requireRole, AuthRequest, requireEmployer, requireStudent } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, sendErrorResponse, ValidationError } from '../middleware/errorHandler';

const router = express.Router();

// @route   POST /api/enhanced-jobs
// @desc    Employer posts a job (essential fields only)
// @access  Private (Employers only)
router.post('/', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const {
    jobTitle,
    description,
    location,
    salaryRange,
    workType,
    skillsRequired,
    applicationDeadline
  } = req.body;

  // Validate required fields
  if (!jobTitle || !description || !location || !salaryRange || !workType || !applicationDeadline) {
    console.log('❌ Missing required fields:', { jobTitle, description, location, salaryRange, workType, applicationDeadline });
    console.log('📦 Full request body:', req.body);
    throw new ValidationError('Missing required fields: jobTitle, description, location, salaryRange, workType, applicationDeadline');
  }

  // Get employer data for auto-fill (already available in req.user from auth middleware)
  const employer = req.user;
  console.log('🔍 Employer data from auth middleware:', {
    id: employer?._id,
    email: employer?.email,
    userType: employer?.userType,
    companyName: employer?.companyName,
    name: employer?.name
  });
  
  if (!employer) {
    console.error('❌ No employer data found in req.user');
    throw new ValidationError('Employer not found');
  }
  
  if (employer.userType !== 'employer') {
    console.error('❌ User is not an employer:', employer.userType);
    throw new ValidationError('Only employers can post jobs');
  }

  // Create job with only essential fields
  const jobData = {
    jobId: new mongoose.Types.ObjectId(),
    employerId: req.user!._id,
    jobTitle,
    description,
    location,
    salaryRange,
    workType,
    skillsRequired: skillsRequired || [],
    applicationDeadline: new Date(applicationDeadline),
    
    // Auto-filled employer info
    companyName: employer.companyName || employer.name || 'Company Name',
    email: employer.email || '',
    phone: employer.phone || '',
    companyLogo: employer.companyLogo || '',
    businessType: employer.businessType || '',
    employerName: employer.name || '',
    
    // System fields
    status: 'active',
    // approvalStatus will be set by schema default: 'approved'

    highlighted: true, // Jobs stay highlighted until assigned

    createdAt: new Date()
  };

  console.log('📝 Creating job with data:', jobData);
  const job = await Job.create(jobData);
  console.log('✅ Job created with approvalStatus:', job.approvalStatus);

  // Populate employer info
  await job.populate('employerId', 'name email companyName');

  console.log('✅ Job created successfully:', {
    jobId: job._id,
    jobTitle: job.jobTitle,
    employerId: job.employerId,
    companyName: job.companyName,
    email: job.email,
    approvalStatus: job.approvalStatus
  });

  sendSuccessResponse(res, { job }, 'Job posted successfully', 201);
}));

// @route   PATCH /api/enhanced-jobs/:id/status
// @desc    Update job status (employer can close/reopen their job)
// @access  Private (Employers only)
router.patch('/:id/status', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!mongoose.isValidObjectId(id)) {
    throw new ValidationError('Invalid job ID');
  }

  if (!['active', 'paused', 'closed', 'expired'].includes(status)) {
    throw new ValidationError('Invalid status value');
  }

  const job = await Job.findById(id);
  if (!job) {
    throw new ValidationError('Job not found');
  }

  if (job.employerId.toString() !== req.user!._id.toString()) {
    throw new ValidationError('Access denied');
  }

  job.status = status as typeof job.status;
  await job.save();

  sendSuccessResponse(res, { job }, 'Job status updated successfully');
}));

// @route   GET /api/enhanced-jobs/student-dashboard
// @desc    Get jobs for student dashboard with highlighted jobs
// @access  Private (Students only)
router.get('/student-dashboard', authenticateToken, requireStudent, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    // Check student's KYC status
    const studentId = req.user!._id;
    const user = await User.findById(studentId).select('kycStatus isVerified');
    const kyc = await KYC.findOne({ userId: studentId, isActive: true });
    
    // Determine if KYC is approved
    const kycStatus = kyc?.verificationStatus || user?.kycStatus || 'not_submitted';
    const isKYCApproved = kycStatus === 'approved' || user?.isVerified;
    
    console.log(`🔍 Student ${studentId} KYC status:`, {
      kycStatus,
      isVerified: user?.isVerified,
      isKYCApproved
    });
    
    // BUILD QUERY - Show jobs regardless of KYC status
    // Students can VIEW jobs, but need KYC to APPLY
    const filter: any = {
      status: 'active',
      approvalStatus: 'approved'
    };

    const jobs = await Job.find(filter)
      .populate('employerId', 'name companyName email')
      .sort({ highlighted: -1, createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Job.countDocuments(filter);

    console.log(`✅ Returning ${jobs.length} jobs to student (KYC: ${isKYCApproved ? 'approved' : 'not approved'})`);

    // Return jobs with KYC status flag
    // kycRequired indicates if KYC is needed to APPLY (not to view)
    sendSuccessResponse(res, {
      jobs,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      },
      kycRequired: !isKYCApproved,  // Flag for frontend - can't apply without KYC
      kycStatus: kycStatus,
      canApply: isKYCApproved,  // Explicit flag for apply button
      message: isKYCApproved ? 'Jobs retrieved successfully' : 'Complete KYC to apply for jobs'
    }, 'Jobs retrieved successfully');
  } catch (e: any) {
    console.error('❌ Failed to fetch student dashboard jobs:', e?.message);
    return sendErrorResponse(res, 500, 'Failed to fetch jobs', process.env.NODE_ENV !== 'production' ? e?.message : undefined);
  }
}));

// @route   POST /api/enhanced-jobs/:jobId/apply
// @desc    Student applies for a job
// @access  Private (Students only)
router.post('/:jobId/apply', authenticateToken, requireStudent, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { jobId } = req.params;
  const { coverLetter, resume, expectedPay, availability } = req.body || {};

  try {
    console.log(`[apply] jobId param=`, jobId, ' studentId=', req.user?._id, ' payload=', req.body);
    if (!jobId) {
      return sendErrorResponse(res, 400, 'Job ID is required');
    }
    if (!mongoose.isValidObjectId(jobId)) {
      return sendErrorResponse(res, 400, 'Invalid job ID');
    }

    // Check if student's KYC is approved
    const studentId = req.user!._id;
    const user = await User.findById(studentId).select('kycStatus isVerified');
    const kyc = await KYC.findOne({ userId: studentId, isActive: true });
    
    const kycStatus = kyc?.verificationStatus || user?.kycStatus || 'not_submitted';
    const isKYCApproved = kycStatus === 'approved' || user?.isVerified;
    
    if (!isKYCApproved) {
      console.log(`⚠️ Student ${studentId} attempted to apply without KYC approval`);
      return sendErrorResponse(res, 403, 'Please complete and get your KYC approved before applying to jobs');
    }

    // Check if job exists and is active
    const job = await Job.findById(new mongoose.Types.ObjectId(jobId));
    if (!job) {
      return sendErrorResponse(res, 404, 'Job not found');
    }

    if (job.status !== 'active') {
      return sendErrorResponse(res, 400, 'Job is not active');
    }

    if (job.approvalStatus && job.approvalStatus !== 'approved') {
      return sendErrorResponse(res, 400, 'Job is not approved for applications');
    }

    // Check if already applied (both legacy and new fields)
    const existingApplication = await Application.findOne({
      $or: [
        { jobId: new mongoose.Types.ObjectId(jobId) as any, studentId: new mongoose.Types.ObjectId(req.user!._id) as any },
        { job: new mongoose.Types.ObjectId(jobId) as any, student: new mongoose.Types.ObjectId(req.user!._id) as any }
      ]
    });

    if (existingApplication) {
      return sendErrorResponse(res, 400, 'You have already applied for this job');
    }

    const allowedAvailability = new Set(['weekdays', 'weekends', 'both', 'flexible']);
    const normalizeAvailability = (value?: any) => {
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        if (allowedAvailability.has(lower)) {
          return lower;
        }
      }
      return undefined;
    };

    const sanitizedAvailability =
      normalizeAvailability(availability) ||
      normalizeAvailability((req.user as any)?.availability) ||
      'flexible';

    // Create application
    let application;
    try {
      application = await Application.create({
        applicationId: new mongoose.Types.ObjectId(),
        jobId: new mongoose.Types.ObjectId(jobId),
        studentId: new mongoose.Types.ObjectId(req.user!._id),
        // Also set legacy fields to satisfy any existing unique index on (job, student)
        job: new mongoose.Types.ObjectId(jobId) as any,
        student: new mongoose.Types.ObjectId(req.user!._id) as any,
        employer: job.employerId,
        status: 'applied',
        appliedAt: new Date(),
        coverLetter: coverLetter || undefined,
        resume: resume || undefined,
        expectedPay: expectedPay ? Number(expectedPay) : undefined,
        availability: sanitizedAvailability
      });
    } catch (createErr: any) {
      console.error('❌ Application.create failed:', createErr);
      if (createErr && (createErr.code === 11000 || createErr.code === 11001)) {
        return sendErrorResponse(res, 400, 'You have already applied for this job');
      }
      if (createErr && createErr.name === 'ValidationError') {
        return sendErrorResponse(res, 400, 'Invalid application data', createErr.message);
      }
      throw createErr;
    }

    // Emit real-time notification to employer about new application
    try {
      const socketManager = (global as any).socketManager;
      if (socketManager && job.employerId) {
        socketManager.emitNewApplication(job.employerId.toString(), {
          applicationId: application._id,
          studentId: req.user!._id,
          studentName: (req as any).user?.name || 'Student',
          jobId: jobId,
          jobTitle: job.jobTitle,
          company: job.companyName,
          status: 'applied',
          appliedAt: new Date()
        });
      }
    } catch (emitErr) {
      console.error('Failed to emit socket event:', emitErr);
    }

    // Trigger employer notification (best-effort)
    try {
      if (typeof fetch !== 'undefined') {
        await fetch('http://localhost:5000/api/notifications/application-submitted', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${req.headers.authorization?.replace('Bearer ', '')}`
          },
          body: JSON.stringify({
            jobId,
            studentId: req.user!._id,
            employerId: job.employerId
          })
        });
      }
    } catch (notifyErr) {
      console.error('Failed to send notification:', notifyErr);
    }

    // Populate job and employer info
    await application.populate('jobId', 'jobTitle companyName location salaryRange');
    await application.populate('employer', 'name companyName');

    sendSuccessResponse(res, { application }, 'Application submitted successfully', 201);
  } catch (e: any) {
    console.error('❌ Failed to submit application:', e);
    const errorDetails = process.env.NODE_ENV !== 'production' ? (e?.stack || e?.message || e) : undefined;
    return sendErrorResponse(res, 500, 'Failed to submit application', errorDetails);
  }
}));

// @route   GET /api/enhanced-jobs/employer-dashboard
// @desc    Get jobs and applications for employer dashboard
// @access  Private (Employers only)
router.get('/employer-dashboard', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const employerId = req.user!._id;
    const currentPage = Number(page);
    const pageSize = Number(limit);

    const jobs = await Job.find({ employerId })
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const jobIds = jobs.map(job => job._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('studentId', 'name email skills availability')
      .sort({ appliedAt: -1 })
      .lean();

    const appsByJob: Record<string, any[]> = {};
    for (const app of applications) {
      const key = app.jobId?.toString();
      if (!key) continue;
      if (!appsByJob[key]) appsByJob[key] = [];
      appsByJob[key].push({
        applicationId: app._id,
        studentId: (app.studentId as any)?._id,
        name: (app.studentId as any)?.name || 'Candidate',
        email: (app.studentId as any)?.email || 'N/A',
        skills: (app.studentId as any)?.skills || [],
        availability: (app.studentId as any)?.availability,
        resumeUrl: app.resume || '',
        coverLetter: app.coverLetter || '',
        appliedAt: app.appliedAt,
        status: app.status
      });
    }

    const totalJobs = await Job.countDocuments({ employerId });

    const structuredJobs = jobs.map(job => {
      const jobKey = job._id.toString();
      const applicants = appsByJob[jobKey] || [];
      return {
        jobId: job._id,
        jobTitle: job.jobTitle || (job as any).title || '',
        jobDescription: job.description || '',
        companyName: job.companyName || '',
        location: job.location || '',
        status: job.status,
        approvalStatus: job.approvalStatus || job.status || 'pending',
        salaryRange: job.salaryRange || '',
        workType: job.workType || (job as any).type || '',
        skillsRequired: Array.isArray(job.skillsRequired) ? job.skillsRequired : [],
        requirements: Array.isArray(job.skillsRequired) ? job.skillsRequired : (Array.isArray((job as any).requirements) ? (job as any).requirements : []),
        createdAt: job.createdAt || (job as any).updatedAt || new Date(),
        highlighted: job.highlighted,
        applicants,
        applicationsCount: applicants.length
      };
    });

    sendSuccessResponse(res, {
      jobs: structuredJobs,
      pagination: {
        current: currentPage,
        pages: Math.ceil(totalJobs / pageSize),
        total: totalJobs
      }
    }, 'Employer dashboard data retrieved successfully');
  } catch (e: any) {
    console.error('❌ Failed to fetch employer dashboard:', e);
    return sendErrorResponse(res, 500, 'Failed to fetch employer dashboard', process.env.NODE_ENV !== 'production' ? (e?.stack || e?.message || e) : undefined);
  }
}));

// @route   PATCH /api/enhanced-jobs/applications/:applicationId/approve
// @desc    Employer approves an application
// @access  Private (Employers only)
router.patch('/applications/:applicationId/approve', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { applicationId } = req.params;

  const application = await Application.findById(applicationId)
    .populate('jobId', 'jobTitle companyName location salaryRange')
    .populate('studentId', 'name email');
  
  if (!application) {
    throw new ValidationError('Application not found');
  }

  // Check if user owns the job
  const job = await Job.findById(application.jobId);
  if (!job || job.employerId.toString() !== req.user!._id.toString()) {
    throw new ValidationError('Access denied');
  }

  // Update application status
  await application.updateStatus('accepted', 'Application approved by employer');

  // Real-time notification to student via socket
  const socketManager = (global as any).socketManager;
  if (socketManager && application.studentId) {
    const studentId = typeof application.studentId === 'object' 
      ? (application.studentId as any)._id.toString() 
      : String(application.studentId);
    
    const jobData = typeof application.jobId === 'object' ? application.jobId : job;
    
    socketManager.notifyApplicationStatusUpdate({
      _id: application._id,
      status: 'accepted',
      jobId: job._id,
      jobTitle: (jobData as any).jobTitle || job.jobTitle,
      companyName: (jobData as any).companyName || job.companyName,
      location: (jobData as any).location || job.location,
      salaryRange: (jobData as any).salaryRange || job.salaryRange,
      approvedAt: application.shortlistedDate || new Date(),
      message: `Your application for ${(jobData as any).jobTitle || job.jobTitle} at ${(jobData as any).companyName || job.companyName} has been approved! 🎉`
    }, studentId);
    
    console.log(`📢 Real-time notification sent to student ${studentId} for approved application`);
  }

  sendSuccessResponse(res, { application }, 'Application approved successfully');
}));

// @route   PATCH /api/enhanced-jobs/applications/:applicationId/reject
// @desc    Employer rejects an application
// @access  Private (Employers only)
router.patch('/applications/:applicationId/reject', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { applicationId } = req.params;

  const application = await Application.findById(applicationId);
  if (!application) {
    throw new ValidationError('Application not found');
  }

  // Check if user owns the job
  const job = await Job.findById(application.jobId);
  if (!job || job.employerId.toString() !== req.user!._id.toString()) {
    throw new ValidationError('Access denied');
  }

  // Update application status
  await application.updateStatus('rejected', 'Application rejected by employer');

  // Trigger student notification
  try {
    await fetch('http://localhost:5000/api/notifications/application-rejected', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.headers.authorization?.replace('Bearer ', '')}`
      },
      body: JSON.stringify({
        applicationId,
        studentId: application.studentId,
        jobTitle: job.jobTitle
      })
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }

  sendSuccessResponse(res, { application }, 'Application rejected successfully');
}));

// @route   GET /api/enhanced-jobs/applications/recent-approved
// @desc    Get recent approved applications for the logged-in student
// @access  Private (Students only)
router.get('/applications/recent-approved', authenticateToken, requireStudent, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { limit = 10 } = req.query;

  const applications = await Application.find({ 
    studentId: req.user!._id,
    status: 'accepted'
  })
    .populate('jobId', 'jobTitle companyName location salaryRange')
    .populate('employer', 'name companyName phone address')
    .sort({ shortlistedDate: -1 }) // Sort by approval date (most recent first)
    .limit(Number(limit));

  const recentApplications = applications.map(app => ({
    _id: app._id,
    jobTitle: (app.jobId as any)?.jobTitle || 'Unknown Job',
    companyName: (app.jobId as any)?.companyName || 'Unknown Company',
    location: (app.jobId as any)?.location || 'Unknown Location',
    salaryRange: (app.jobId as any)?.salaryRange || 'Not specified',
    status: app.status,
    approvedDate: app.shortlistedDate || app.updatedAt,
    appliedDate: app.appliedAt,
    jobId: (app.jobId as any)?._id || app.jobId,
    // Include employer contact details for approved applications
    employerContact: {
      name: (app.employer as any)?.name || 'Unknown',
      companyName: (app.employer as any)?.companyName || 'Unknown Company',
      phone: (app.employer as any)?.phone || 'Not provided',
      address: (app.employer as any)?.address || 'Not provided'
    }
  }));

  sendSuccessResponse(res, { applications: recentApplications }, 'Recent approved applications retrieved successfully');
}));

// @route   GET /api/enhanced-jobs/applications/approved-with-contact
// @desc    Get approved applications with employer contact details for the logged-in student
// @access  Private (Students only)
router.get('/applications/approved-with-contact', authenticateToken, requireStudent, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { limit = 10 } = req.query;

  const applications = await Application.find({ 
    studentId: req.user!._id,
    status: 'accepted'
  })
    .populate('jobId', 'jobTitle companyName location salaryRange workType description')
    .populate('employer', 'name companyName phone address email businessType')
    .sort({ shortlistedDate: -1 }) // Sort by approval date (most recent first)
    .limit(Number(limit));

  const approvedApplicationsWithContact = applications.map(app => ({
    _id: app._id,
    jobTitle: (app.jobId as any)?.jobTitle || 'Unknown Job',
    companyName: (app.jobId as any)?.companyName || 'Unknown Company',
    location: (app.jobId as any)?.location || 'Unknown Location',
    salaryRange: (app.jobId as any)?.salaryRange || 'Not specified',
    workType: (app.jobId as any)?.workType || 'Not specified',
    description: (app.jobId as any)?.description || 'No description available',
    status: app.status,
    approvedDate: app.shortlistedDate || app.updatedAt,
    appliedDate: app.appliedAt,
    jobId: (app.jobId as any)?._id || app.jobId,
    // Full employer contact details for approved applications
    employerContact: {
      name: (app.employer as any)?.name || 'Unknown',
      companyName: (app.employer as any)?.companyName || 'Unknown Company',
      phone: (app.employer as any)?.phone || 'Not provided',
      address: (app.employer as any)?.address || 'Not provided',
      email: (app.employer as any)?.email || 'Not provided',
      businessType: (app.employer as any)?.businessType || 'Not specified'
    }
  }));

  sendSuccessResponse(res, { applications: approvedApplicationsWithContact }, 'Approved applications with contact details retrieved successfully');
}));

// @route   GET /api/enhanced-jobs/applications/student
// @desc    Get applications for the logged-in student
// @access  Private (Students only)
router.get('/applications/student', authenticateToken, requireStudent, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10, status } = req.query;

  const query: any = { studentId: req.user!._id };
  if (status) {
    query.status = status;
  }

  const applications = await Application.find(query)
    .populate('jobId', 'jobTitle companyName location salaryRange')
    .populate('employer', 'name companyName')
    .sort({ appliedAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));

  const total = await Application.countDocuments(query);

  sendSuccessResponse(res, {
    applications,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    }
  }, 'Student applications retrieved successfully');
}));

// @route   GET /api/enhanced-jobs/applications/employer
// @desc    Get applications for the logged-in employer's jobs
// @access  Private (Employers only)
router.get('/applications/employer', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10, status } = req.query;

  try {
    // Get all jobs by this employer
    const employerJobs = await Job.find({ employerId: req.user!._id }).select('_id');
    const jobIds = employerJobs.map(job => job._id);

    const query: any = { jobId: { $in: jobIds } };
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('jobId', 'jobTitle companyName location salaryRange')
      .populate('studentId', 'name email skills')
      .sort({ appliedAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Application.countDocuments(query);

    // Only highlighted student details + resume link from application
    const safeApplications = applications.map(app => ({
      _id: app._id,
      status: app.status,
      appliedAt: app.appliedAt,
      job: app.jobId,
      student: app.studentId ? {
        _id: (app.studentId as any)._id,
        name: (app.studentId as any).name,
        email: (app.studentId as any).email,
        skills: (app.studentId as any).skills || [],
        resume: (app as any).resume || ''
      } : null
    }));

    sendSuccessResponse(res, {
      applications: safeApplications,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    }, 'Employer applications retrieved successfully');
  } catch (e: any) {
    console.error('❌ Failed to fetch employer applications:', e?.message);
    return sendErrorResponse(res, 500, 'Failed to fetch employer applications', process.env.NODE_ENV !== 'production' ? e?.message : undefined);
  }
}));

// @route   GET /api/enhanced-jobs/:jobId/applications
// @desc    Get applications for a specific job (employer only)
// @access  Private (Job owner only)
router.get('/:jobId/applications', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { jobId } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  // Check if user owns the job
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ValidationError('Job not found');
  }

  if (job.employerId.toString() !== req.user!._id.toString()) {
    throw new ValidationError('Access denied');
  }

  const query: any = { jobId };
  if (status) {
    query.status = status;
  }

  const applications = await Application.find(query)
    .populate('studentId', 'name email phone college')
    .sort({ appliedAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));

  const total = await Application.countDocuments(query);

  sendSuccessResponse(res, {
    applications,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    }
  }, 'Job applications retrieved successfully');
}));

export default router;