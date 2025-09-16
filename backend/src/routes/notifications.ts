import express from 'express';
import mongoose from 'mongoose';
import { Job } from '../models/Job';
import { User } from '../models/User';
import { Application } from '../models/Application';
import { authenticateToken, requireRole, AuthRequest, requireEmployer, requireStudent } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, sendErrorResponse, ValidationError } from '../middleware/errorHandler';

const router = express.Router();

// @route   POST /api/notifications/application-submitted
// @desc    Send notification to employer when student applies
// @access  Private (Internal use)
router.post('/application-submitted', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { jobId, studentId, applicationId } = req.body;

  if (!jobId || !studentId || !applicationId) {
    throw new ValidationError('Missing required fields: jobId, studentId, applicationId');
  }

  // Get job and student details
  const [job, student] = await Promise.all([
    Job.findById(jobId).populate('employerId', 'name email companyName'),
    User.findById(studentId)
  ]);

  if (!job || !student) {
    throw new ValidationError('Job or student not found');
  }

  // Create notification data
  const notification = {
    type: 'application_submitted',
    title: 'New Job Application',
    message: `A new student has applied for your job posting: ${job.jobTitle}`,
    data: {
      jobId: job._id,
      jobTitle: job.jobTitle,
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      applicationId: applicationId,
      appliedAt: new Date()
    },
    recipientId: job.employerId,
    recipientType: 'employer',
    isRead: false,
    createdAt: new Date()
  };

  // In a real implementation, you would:
  // 1. Save notification to database
  // 2. Send email notification
  // 3. Send push notification
  // 4. Send real-time notification via WebSocket

  console.log('📧 Notification to Employer:', {
    employer: (job.employerId as any).name,
    employerEmail: (job.employerId as any).email,
    jobTitle: job.jobTitle,
    studentName: student.name,
    studentEmail: student.email,
    message: notification.message
  });

  sendSuccessResponse(res, { notification }, 'Employer notification sent successfully');
}));

// @route   POST /api/notifications/application-approved
// @desc    Send notification to student when application is approved
// @access  Private (Internal use)
router.post('/application-approved', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { jobId, studentId, applicationId, employerId } = req.body;

  if (!jobId || !studentId || !applicationId || !employerId) {
    throw new ValidationError('Missing required fields: jobId, studentId, applicationId, employerId');
  }

  // Get job and employer details
  const [job, employer] = await Promise.all([
    Job.findById(jobId),
    User.findById(employerId)
  ]);

  if (!job || !employer) {
    throw new ValidationError('Job or employer not found');
  }

  // Create notification data
  const notification = {
    type: 'application_approved',
    title: 'Application Approved!',
    message: `Your profile has been shortlisted for the job: ${job.jobTitle}. Wait for employer contact.`,
    data: {
      jobId: job._id,
      jobTitle: job.jobTitle,
      employerId: employer._id,
      employerName: employer.name,
      employerEmail: employer.email,
      applicationId: applicationId,
      approvedAt: new Date()
    },
    recipientId: studentId,
    recipientType: 'student',
    isRead: false,
    createdAt: new Date()
  };

  console.log('📧 Notification to Student:', {
    studentId: studentId,
    jobTitle: job.jobTitle,
    employerName: employer.name,
    employerEmail: employer.email,
    message: notification.message
  });

  sendSuccessResponse(res, { notification }, 'Student notification sent successfully');
}));

// @route   POST /api/notifications/application-rejected
// @desc    Send notification to student when application is rejected
// @access  Private (Internal use)
router.post('/application-rejected', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { jobId, studentId, applicationId, employerId, reason } = req.body;

  if (!jobId || !studentId || !applicationId || !employerId) {
    throw new ValidationError('Missing required fields: jobId, studentId, applicationId, employerId');
  }

  // Get job and employer details
  const [job, employer] = await Promise.all([
    Job.findById(jobId),
    User.findById(employerId)
  ]);

  if (!job || !employer) {
    throw new ValidationError('Job or employer not found');
  }

  // Create notification data
  const notification = {
    type: 'application_rejected',
    title: 'Application Rejected',
    message: `Your application was rejected for the job: ${job.jobTitle}. Please review details and apply for other jobs.`,
    data: {
      jobId: job._id,
      jobTitle: job.jobTitle,
      employerId: employer._id,
      employerName: employer.name,
      employerEmail: employer.email,
      applicationId: applicationId,
      rejectionReason: reason,
      rejectedAt: new Date()
    },
    recipientId: studentId,
    recipientType: 'student',
    isRead: false,
    createdAt: new Date()
  };

  console.log('📧 Notification to Student:', {
    studentId: studentId,
    jobTitle: job.jobTitle,
    employerName: employer.name,
    employerEmail: employer.email,
    rejectionReason: reason,
    message: notification.message
  });

  sendSuccessResponse(res, { notification }, 'Student notification sent successfully');
}));

// @route   GET /api/notifications/student
// @desc    Get notifications for student
// @access  Private (Students only)
router.get('/student', authenticateToken, requireStudent, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10, unreadOnly = false } = req.query;

  // In a real implementation, you would fetch from a notifications collection
  // For now, we'll return a mock response
  const notifications = [
    {
      id: '1',
      type: 'application_approved',
      title: 'Application Approved!',
      message: 'Your profile has been shortlisted for the job: Software Developer. Wait for employer contact.',
      isRead: false,
      createdAt: new Date()
    },
    {
      id: '2',
      type: 'application_rejected',
      title: 'Application Rejected',
      message: 'Your application was rejected for the job: Data Analyst. Please review details and apply for other jobs.',
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ];

  sendSuccessResponse(res, {
    notifications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: notifications.length,
      pages: Math.ceil(notifications.length / Number(limit))
    }
  }, 'Student notifications retrieved successfully');
}));

// @route   GET /api/notifications/employer
// @desc    Get notifications for employer
// @access  Private (Employers only)
router.get('/employer', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 10, unreadOnly = false } = req.query;

  // In a real implementation, you would fetch from a notifications collection
  // For now, we'll return a mock response
  const notifications = [
    {
      id: '1',
      type: 'application_submitted',
      title: 'New Job Application',
      message: 'A new student has applied for your job posting: Software Developer',
      isRead: false,
      createdAt: new Date()
    },
    {
      id: '2',
      type: 'application_submitted',
      title: 'New Job Application',
      message: 'A new student has applied for your job posting: Data Analyst',
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ];

  sendSuccessResponse(res, {
    notifications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: notifications.length,
      pages: Math.ceil(notifications.length / Number(limit))
    }
  }, 'Employer notifications retrieved successfully');
}));

// @route   PATCH /api/notifications/:notificationId/read
// @desc    Mark notification as read
// @access  Private
router.patch('/:notificationId/read', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { notificationId } = req.params;

  // In a real implementation, you would update the notification in the database
  console.log(`📧 Marking notification ${notificationId} as read for user ${req.user!._id}`);

  sendSuccessResponse(res, { notificationId }, 'Notification marked as read');
}));

export default router;
