import express from 'express';
import mongoose from 'mongoose';
import { Job } from '../models/Job';
import { User } from '../models/User';
import { Application } from '../models/Application';
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
  const job = await Job.create({
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
    highlighted: true, // Jobs stay highlighted until assigned
    createdAt: new Date()
  });

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

// @route   GET /api/enhanced-jobs/student-dashboard
// @desc    Get jobs for student dashboard with highlighted jobs
// @access  Private (Students only)
router.get('/student-dashboard', authenticateToken, requireStudent, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10 } = req.query;

  // Get active jobs
  const jobs = await Job.find({ status: 'active' })
    .populate('employerId', 'name companyName')
    .sort({ highlighted: -1, createdAt: -1 }) // Highlighted jobs first, then by date
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
  }, 'Jobs retrieved successfully');
}));

// @route   POST /api/enhanced-jobs/:jobId/apply
// @desc    Student applies for a job
// @access  Private (Students only)
router.post('/:jobId/apply', authenticateToken, requireStudent, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { jobId } = req.params;

  // Check if job exists and is active
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ValidationError('Job not found');
  }

  if (job.status !== 'active') {
    throw new ValidationError('Job is not active');
  }

  // Check if already applied
  const existingApplication = await Application.findOne({
    jobId: jobId,
    studentId: req.user!._id
  });

  if (existingApplication) {
    throw new ValidationError('You have already applied for this job');
  }

  // Create application
  const application = await Application.create({
    applicationId: new mongoose.Types.ObjectId(),
    jobId: jobId,
    studentId: req.user!._id,
    employer: job.employerId,
    status: 'applied',
    appliedAt: new Date()
  });

  // Update job to remove highlighted status (student has seen it)
  await Job.findByIdAndUpdate(jobId, { highlighted: false });

  // Trigger employer notification
  try {
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
  } catch (error) {
    console.error('Failed to send notification:', error);
  }

  // Populate job and employer info
  await application.populate('jobId', 'jobTitle companyName location salaryRange');
  await application.populate('employer', 'name companyName');

  sendSuccessResponse(res, { application }, 'Application submitted successfully', 201);
}));

// @route   GET /api/enhanced-jobs/employer-dashboard
// @desc    Get jobs and applications for employer dashboard
// @access  Private (Employers only)
router.get('/employer-dashboard', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10 } = req.query;

  // Get employer's jobs
  const jobs = await Job.find({ employerId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));

  // Get applications for these jobs
  const jobIds = jobs.map(job => job._id);
  const applications = await Application.find({ jobId: { $in: jobIds } })
    .populate('studentId', 'name email phone college')
    .populate('jobId', 'jobTitle location salaryRange');

  const total = await Job.countDocuments({ employerId: req.user!._id });

  sendSuccessResponse(res, {
    jobs,
    applications,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    }
  }, 'Employer dashboard data retrieved successfully');
}));

// @route   PATCH /api/enhanced-jobs/applications/:applicationId/approve
// @desc    Employer approves an application
// @access  Private (Employers only)
router.patch('/applications/:applicationId/approve', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
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
  await application.updateStatus('accepted', 'Application approved by employer');

  // Trigger student notification
  try {
    await fetch('http://localhost:5000/api/notifications/application-approved', {
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

  // Get all jobs by this employer
  const employerJobs = await Job.find({ employerId: req.user!._id }).select('_id');
  const jobIds = employerJobs.map(job => job._id);

  const query: any = { jobId: { $in: jobIds } };
  if (status) {
    query.status = status;
  }

  const applications = await Application.find(query)
    .populate('jobId', 'jobTitle companyName location salaryRange')
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
  }, 'Employer applications retrieved successfully');
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