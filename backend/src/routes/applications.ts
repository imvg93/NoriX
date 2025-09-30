import express from 'express';
import mongoose from 'mongoose';
import Application from '../models/Application';
import Job from '../models/Job';
import User from '../models/User';
import { authenticateToken, requireStudent, requireEmployer, AuthRequest } from '../middleware/auth';

import { asyncHandler, sendSuccessResponse, sendErrorResponse, ValidationError } from '../middleware/errorHandler';
import SocketManager from '../utils/socketManager';
import EmailNotificationService from '../services/emailNotificationService';


const router = express.Router();

// Services will be injected from the main server
let socketManager: SocketManager;
let emailService: EmailNotificationService;

export const setApplicationServices = (socket: SocketManager, email: EmailNotificationService) => {
  socketManager = socket;
  emailService = email;
};

// @route   POST /api/applications
// @desc    Apply for a job
// @access  Private (Students only)
router.post('/', authenticateToken, requireStudent, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { jobId, coverLetter, expectedPay, availability, resume } = req.body;

  if (!jobId) {
    throw new ValidationError('Job ID is required');
  }

  // Check if job exists and is active
  const job = await Job.findById(new mongoose.Types.ObjectId(jobId));
  if (!job) {
    throw new ValidationError('Job not found');
  }

  if (job.status !== 'active') {
    throw new ValidationError('Job is not active');
  }

  // Check if already applied (support both legacy and new fields)
  const existingApplication = await Application.findOne({
    $or: [
      { jobId: new mongoose.Types.ObjectId(jobId) as any, studentId: new mongoose.Types.ObjectId(req.user!._id) as any },
      { job: new mongoose.Types.ObjectId(jobId) as any, student: new mongoose.Types.ObjectId(req.user!._id) as any }
    ]
  });

  if (existingApplication) {
    throw new ValidationError('You have already applied for this job');
  }


  // Create application
  const application = await Application.create({
    jobId: jobId,
    job: jobId, // Ensure job field is also set for proper linkage
    studentId: req.user!._id,
    student: req.user!._id, // Ensure student field is also set
    employer: job.employerId,
    coverLetter,
    expectedPay: expectedPay ? Number(expectedPay) : undefined,
    availability: availability || req.user!.availability
  });


 // Populate job and employer info
  await application.populate([
    { path: 'jobId', select: 'jobTitle companyName location salaryRange' },
    { path: 'employer', select: 'name companyName' }
  ]);


  // Get student info for notifications
  const student = await User.findById(req.user!._id).select('name email phone');

  // Real-time notification to employer
  if (socketManager) {
    socketManager.notifyNewApplication({
      id: application._id,
      jobId: jobId,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      studentId: req.user!._id,
      studentName: student?.name || student?.email,
      studentEmail: student?.email,
      studentPhone: student?.phone,
      coverLetter: coverLetter,
      expectedPay: expectedPay,
      status: 'pending',
      appliedAt: application.createdAt
    }, job.employerId.toString());
  }

  // Email notification to employer
  if (emailService && student) {
    await emailService.sendNewApplicationNotification(
      job.employerId.toString(),
      {
        id: application._id,
        jobId: jobId,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        status: 'pending',
        appliedAt: application.createdAt
      },
      {
        name: student.name || student.email,
        email: student.email,
        phone: student.phone
      },
      {
        id: job._id,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        location: job.location,
        jobType: job.workType
      }
    );
  }

  console.log(`📝 New application submitted: ${student?.name || student?.email} for ${job.jobTitle} - Notifications sent`);


  sendSuccessResponse(res, { application }, 'Application submitted successfully', 201);
}));

// @route   GET /api/applications/my-applications
// @desc    Get current user's applications
// @access  Private
router.get('/my-applications', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10, status } = req.query;

  try {
    const query: any = { studentId: req.user!._id };

    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('jobId', 'jobTitle companyName location salaryRange workType status')
      .populate('employer', 'name companyName')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ appliedAt: -1 });

    const total = await Application.countDocuments(query);

    sendSuccessResponse(res, {
      applications,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    }, 'Applications retrieved successfully');
  } catch (e: any) {
    console.error('❌ Failed to fetch my applications:', e?.message);
    return sendErrorResponse(res, 500, 'Failed to fetch applications', process.env.NODE_ENV !== 'production' ? e?.message : undefined);
  }
}));

// @route   GET /api/applications/employer/all
// @desc    Get all applications for employer's jobs
// @access  Private (Employers only)
router.get('/employer/all', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10, status } = req.query;

  // Get all jobs by this employer
  const employerJobs = await Job.find({ employerId: req.user!._id }).select('_id');
  const jobIds = employerJobs.map(job => job._id);

  const query: any = { jobId: { $in: jobIds } };

  if (status) {
    query.status = status;
  }

  const applications = await Application.find(query)
    .populate('jobId', 'jobTitle companyName location salaryRange workType status')
    .populate('studentId', 'name email phone college skills')
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit))
    .sort({ appliedAt: -1 });

  const total = await Application.countDocuments(query);

  sendSuccessResponse(res, {
    applications,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    }
  }, 'Applications retrieved successfully');
}));

// @route   GET /api/applications/job/:jobId
// @desc    Get applications for a specific job (employer only)
// @access  Private (Job owner only)
router.get('/job/:jobId', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10, status } = req.query;

  // Check if user owns the job
  const job = await Job.findById(req.params.jobId);
  if (!job) {
    throw new ValidationError('Job not found');
  }

  if (job.employerId.toString() !== req.user!._id.toString()) {
    throw new ValidationError('You can only view applications for your own jobs');
  }

  const query: any = { jobId: req.params.jobId };

  if (status) {
    query.status = status;
  }

  const applications = await Application.find(query)
    .populate('studentId', 'name college skills availability rating completedJobs')
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit))
    .sort({ appliedAt: -1 });

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

// @route   GET /api/applications/:id
// @desc    Get application details
// @access  Private (Application owner or job owner)
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const application = await Application.findById(req.params.id)
    .populate('jobId', 'jobTitle companyName location salaryRange workType status')
    .populate('studentId', 'name college skills availability rating')
    .populate('employer', 'name companyName');

  if (!application) {
    throw new ValidationError('Application not found');
  }

  // Check if user has access to this application
  if (application.studentId.toString() !== req.user!._id.toString() && 
      application.employer?.toString() !== req.user!._id.toString()) {
    throw new ValidationError('Access denied');
  }

  sendSuccessResponse(res, { application }, 'Application retrieved successfully');
}));

// @route   PUT /api/applications/:id/status
// @desc    Update application status (employer only)
// @access  Private (Job owner only)
router.put('/:id/status', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { status, notes } = req.body;

  if (!status) {
    throw new ValidationError('Status is required');
  }

  const application = await Application.findById(req.params.id);
  if (!application) {
    throw new ValidationError('Application not found');
  }

  // Check if user owns the job
  const job = await Job.findById(application.jobId);
  if (!job || job.employerId.toString() !== req.user!._id.toString()) {
    throw new ValidationError('Access denied');
  }

  // Update status
  await application.updateStatus(status, notes);

  // Populate for response
  await application.populate([
    { path: 'jobId', select: 'title company location' },
    { path: 'studentId', select: 'name college skills' }
  ]);

  // Get job details for notifications
  const jobDetails = await Job.findById(application.jobId).select('jobTitle companyName location workType');

  // Real-time notification to student
  if (socketManager) {
    socketManager.notifyApplicationStatusUpdate({
      id: application._id,
      jobId: application.jobId,
      jobTitle: jobDetails?.jobTitle || 'Unknown Job',
      companyName: jobDetails?.companyName || 'Unknown Company',
      studentId: application.studentId,
      status: status,
      notes: notes,
      updatedAt: new Date()
    }, application.studentId.toString());
  }

  // Email notification to student
  if (emailService && jobDetails) {
    await emailService.sendApplicationStatusNotification(
      application.studentId.toString(),
      {
        id: application._id,
        jobId: application.jobId,
        status: status,
        notes: notes,
        updatedAt: new Date()
      },
      {
        id: jobDetails._id,
        jobTitle: jobDetails.jobTitle,
        companyName: jobDetails.companyName,
        location: jobDetails.location,
        jobType: jobDetails.workType
      }
    );
  }

  console.log(`📋 Application status updated: ${status} for job ${jobDetails?.jobTitle} - Notifications sent to student`);

  sendSuccessResponse(res, { application }, 'Application status updated successfully');
}));

// @route   POST /api/applications/:id/withdraw
// @desc    Withdraw application (student only)
// @access  Private (Application owner only)
router.post('/:id/withdraw', authenticateToken, requireStudent, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const application = await Application.findById(req.params.id);
  if (!application) {
    throw new ValidationError('Application not found');
  }

  // Check if user owns the application
  if (application.studentId.toString() !== req.user!._id.toString()) {
    throw new ValidationError('Access denied');
  }

  // Check if application can be withdrawn
  if (['hired', 'rejected'].includes(application.status)) {
    throw new ValidationError('Cannot withdraw application in current status');
  }

  // Update status to withdrawn
  await application.updateStatus('withdrawn', 'Application withdrawn by student');

  sendSuccessResponse(res, { application }, 'Application withdrawn successfully');
}));

// @route   POST /api/applications/:id/rate
// @desc    Rate the other party after job completion
// @access  Private (Application owner or job owner)
router.post('/:id/rate', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { rating, feedback } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new ValidationError('Valid rating (1-5) is required');
  }

  const application = await Application.findById(req.params.id);
  if (!application) {
    throw new ValidationError('Application not found');
  }

  // Check if user has access to this application
  if (application.studentId?.toString() !== req.user!._id.toString() && 
      application.employer?.toString() !== req.user!._id.toString()) {
    throw new ValidationError('Access denied');
  }

  // Determine who is rating
  const rater = application.studentId?.toString() === req.user!._id.toString() ? 'student' : 'employer';

  // Add rating
  await application.addRating(rater, rating, feedback);

  sendSuccessResponse(res, { application }, 'Rating submitted successfully');
}));

// @route   GET /api/applications/stats
// @desc    Get application statistics for current user
// @access  Private
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const stats = await Application.getStats(new mongoose.Types.ObjectId(req.user!._id), req.user!.userType as 'student' | 'employer');

  sendSuccessResponse(res, { stats }, 'Statistics retrieved successfully');
}));

export default router;
