import express from 'express';
import mongoose from 'mongoose';
import Application from '../models/Application';
import Job from '../models/Job';
import User from '../models/User';
import KYC from '../models/KYC';
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

  try {
    // Validate input
    if (!jobId) {
      return sendErrorResponse(res, 400, 'Job ID is required');
    }

    // Validate ObjectId format
    if (!mongoose.isValidObjectId(jobId)) {
      return sendErrorResponse(res, 400, 'Invalid job ID format');
    }

    // Validate student ID from authentication
    if (!req.user || !req.user._id) {
      return sendErrorResponse(res, 401, 'User authentication failed');
    }

    if (!mongoose.isValidObjectId(req.user._id)) {
      return sendErrorResponse(res, 400, 'Invalid student ID format');
    }

    // Check if student exists in database
    const studentExists = await User.findById(req.user._id).select('_id name email availability kycStatus isVerified');
    if (!studentExists) {
      return sendErrorResponse(res, 404, 'Student account not found');
    }

    // Check if student's KYC is approved
    const kyc = await KYC.findOne({ userId: req.user._id, isActive: true });
    const kycStatus = kyc?.verificationStatus || studentExists.kycStatus || 'not_submitted';
    const isKYCApproved = kycStatus === 'approved' || studentExists.isVerified;
    
    if (!isKYCApproved) {
      console.log(`⚠️ Student ${req.user._id} attempted to apply without KYC approval`);
      return sendErrorResponse(res, 403, 'Please complete and get your KYC approved before applying to jobs');
    }

    // Check if job exists and is active
    const job = await Job.findById(new mongoose.Types.ObjectId(jobId));
    if (!job) {
      return sendErrorResponse(res, 404, 'Job not found');
    }

    if (job.status !== 'active') {
      return sendErrorResponse(res, 400, 'Job is not currently accepting applications');
    }

    // Check if job is approved (if approval system is in place)
    if (job.approvalStatus && job.approvalStatus !== 'approved') {
      return sendErrorResponse(res, 400, 'Job is not approved for applications');
    }

    // Check if already applied (prevent duplicates)
    const existingApplication = await Application.findOne({
      $or: [
        { jobId: new mongoose.Types.ObjectId(jobId) as any, studentId: new mongoose.Types.ObjectId(req.user._id) as any },
        { job: new mongoose.Types.ObjectId(jobId) as any, student: new mongoose.Types.ObjectId(req.user._id) as any }
      ]
    });

    if (existingApplication) {
      return sendErrorResponse(res, 400, 'You have already applied for this job');
    }

    // Sanitize and validate availability
    const allowedAvailability = ['weekdays', 'weekends', 'both', 'flexible'];
    let sanitizedAvailability = 'flexible'; // default
    
    if (availability) {
      const normalizedAvailability = String(availability).toLowerCase().trim();
      if (allowedAvailability.includes(normalizedAvailability)) {
        sanitizedAvailability = normalizedAvailability;
      }
    } else if (studentExists.availability && allowedAvailability.includes(String(studentExists.availability).toLowerCase())) {
      sanitizedAvailability = String(studentExists.availability).toLowerCase();
    }

    // Validate expectedPay if provided
    if (expectedPay !== undefined && expectedPay !== null) {
      const payAmount = Number(expectedPay);
      if (isNaN(payAmount) || payAmount < 0) {
        return sendErrorResponse(res, 400, 'Invalid expected pay amount');
      }
    }

    // Create application with validated data
    let application;
    try {
      application = await Application.create({
        applicationId: new mongoose.Types.ObjectId(),
        jobId: new mongoose.Types.ObjectId(jobId),
        job: new mongoose.Types.ObjectId(jobId), // Ensure job field is also set for proper linkage
        studentId: new mongoose.Types.ObjectId(req.user._id),
        student: new mongoose.Types.ObjectId(req.user._id), // Ensure student field is also set
        employer: job.employerId,
        status: 'applied',
        appliedAt: new Date(),
        coverLetter: coverLetter ? String(coverLetter).trim() : undefined,
        resume: resume ? String(resume).trim() : undefined,
        expectedPay: expectedPay ? Number(expectedPay) : undefined,
        availability: sanitizedAvailability
      });
    } catch (createErr: any) {
      console.error('❌ Application creation failed:', createErr);
      
      // Handle duplicate key error
      if (createErr.code === 11000 || createErr.code === 11001) {
        return sendErrorResponse(res, 400, 'You have already applied for this job');
      }
      
      // Handle validation errors
      if (createErr.name === 'ValidationError') {
        const validationErrors = Object.values(createErr.errors || {})
          .map((err: any) => err.message)
          .join(', ');
        return sendErrorResponse(res, 400, 'Invalid application data', validationErrors);
      }
      
      // Re-throw for asyncHandler to catch
      throw createErr;
    }


    // Populate job and employer info
    await application.populate([
      { path: 'jobId', select: 'jobTitle companyName location salaryRange' },
      { path: 'employer', select: 'name companyName' }
    ]);

    // Get student info for notifications
    const student = await User.findById(req.user._id).select('name email phone');

    // Get notification service
    const notificationService = (global as any).notificationService as any;
    const studentName = student?.name || student?.email || 'Unknown Student';

    // Send notification to employer (saves to DB and sends via Socket.io)
    if (notificationService && student) {
      try {
        await notificationService.notifyNewApplication(
          job.employerId,
          req.user._id,
          application._id,
          job.jobTitle,
          studentName
        );
        console.log(`✅ Notification sent to employer ${job.employerId} for new application`);
      } catch (notificationErr) {
        console.error('⚠️ Failed to send notification:', notificationErr);
        // Don't fail the application if notification fails
      }

      // Detect suspicious activity (don't block application, just notify)
      try {
        await notificationService.detectSuspiciousApplicationActivity(
          req.user._id,
          job.employerId,
          job._id
        );
      } catch (detectionErr) {
        console.error('⚠️ Failed to detect suspicious activity:', detectionErr);
        // Continue even if detection fails
      }
    }

    // Real-time notification to employer via socket (legacy compatibility)
    try {
      if (socketManager && student) {
        socketManager.notifyNewApplication({
          id: application._id,
          jobId: jobId,
          jobTitle: job.jobTitle,
          companyName: job.companyName,
          studentId: req.user._id,
          studentName: student.name || student.email,
          studentEmail: student.email,
          studentPhone: student.phone,
          coverLetter: coverLetter,
          expectedPay: expectedPay,
          status: 'applied',
          appliedAt: application.appliedAt || application.createdAt || new Date().toISOString()
        }, job.employerId.toString());
      }
    } catch (socketErr) {
      console.error('⚠️ Failed to send socket notification:', socketErr);
      // Don't fail the application, just log the error
    }

    // Email notification to employer (best-effort, don't fail on error)
    try {
      if (emailService && student) {
        await emailService.sendNewApplicationNotification(
          job.employerId.toString(),
          {
            id: application._id,
            jobId: jobId,
            jobTitle: job.jobTitle,
            companyName: job.companyName,
            status: 'applied',
            appliedAt: application.appliedAt || application.createdAt || new Date().toISOString()
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
    } catch (emailErr) {
      console.error('⚠️ Failed to send email notification:', emailErr);
      // Don't fail the application, just log the error
    }

    console.log(`✅ Application submitted successfully: ${student?.name || student?.email} for ${job.jobTitle}`);

    // Return success response with application data
    return sendSuccessResponse(res, { 
      application: {
        _id: application._id,
        jobId: application.jobId,
        studentId: application.studentId,
        status: application.status,
        appliedAt: application.appliedAt || application.createdAt || new Date().toISOString(),
        coverLetter: application.coverLetter,
        expectedPay: application.expectedPay,
        availability: application.availability
      }
    }, 'Application submitted successfully', 201);
    
  } catch (error: any) {
    console.error('❌ Error in job application:', error);
    
    // Return user-friendly error message
    const errorMessage = error.message || 'Failed to submit application';
    const statusCode = error.statusCode || 500;
    
    return sendErrorResponse(
      res, 
      statusCode, 
      errorMessage,
      process.env.NODE_ENV !== 'production' ? error.stack : undefined
    );
  }
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

// @route   PATCH /api/applications/:id/close
// @desc    Close an application (employer only)
// @access  Private (Job owner only)
router.patch('/:id/close', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const application = await Application.findById(req.params.id)
    .populate('jobId', 'employerId jobTitle companyName');
  
  if (!application) {
    throw new ValidationError('Application not found');
  }

  // Check if user owns the job
  const job = await Job.findById(application.jobId);
  if (!job || job.employerId.toString() !== req.user!._id.toString()) {
    throw new ValidationError('Access denied');
  }

  // Update application status to closed
  await application.updateStatus('closed', 'Application closed by employer');

  sendSuccessResponse(res, { application }, 'Application closed successfully');
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
