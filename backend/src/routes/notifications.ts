import express from 'express';
import mongoose from 'mongoose';
import { Job } from '../models/Job';
import { User } from '../models/User';
import { Application } from '../models/Application';
import { Notification } from '../models/Notification';
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

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new ValidationError('Invalid notification ID');
  }

  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { read: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new ValidationError('Notification not found');
  }

  sendSuccessResponse(res, { notification }, 'Notification marked as read');
}));

// @route   GET /api/notifications/my-notifications
// @desc    Get user's notifications
// @access  Private
router.get('/my-notifications', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  const query: any = { userId: req.user!._id };
  if (unreadOnly === 'true') {
    query.read = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Notification.countDocuments(query);

  sendSuccessResponse(res, {
    notifications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  }, 'Notifications retrieved successfully');
}));

// ==================== ADMIN NOTIFICATION ENDPOINTS ====================

// @route   POST /api/notifications/admin/send
// @desc    Send notification to specific user(s) - Admin only
// @access  Private (Admin only)
router.post('/admin/send', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { userIds, title, message, type = 'announcement', metadata } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new ValidationError('User IDs array is required');
  }

  if (!title || !message) {
    throw new ValidationError('Title and message are required');
  }

  // Create notifications for each user
  const notifications = await Promise.all(
    userIds.map((userId: string) => {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return null;
      }
      return Notification.create({
        userId,
        type,
        title,
        message,
        read: false,
        metadata,
        createdBy: req.user!._id
      });
    })
  );

  const validNotifications = notifications.filter(n => n !== null);

  sendSuccessResponse(res, {
    notifications: validNotifications,
    count: validNotifications.length
  }, 'Notifications sent successfully');
}));

// @route   POST /api/notifications/admin/broadcast
// @desc    Broadcast notification to all users or specific user type - Admin only
// @access  Private (Admin only)
router.post('/admin/broadcast', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { userType, title, message, type = 'announcement', metadata } = req.body;

  if (!title || !message) {
    throw new ValidationError('Title and message are required');
  }

  // Build query for target users
  const query: any = {};
  if (userType && userType !== 'all') {
    query.userType = userType;
  }

  // Get all target users
  const users = await User.find(query).select('_id');
  const userIds = users.map(u => u._id);

  if (userIds.length === 0) {
    throw new ValidationError('No users found matching criteria');
  }

  // Create notifications for all users
  const notifications = await Promise.all(
    userIds.map(userId => 
      Notification.create({
        userId,
        type,
        title,
        message,
        read: false,
        metadata,
        createdBy: req.user!._id
      })
    )
  );

  sendSuccessResponse(res, {
    notifications,
    count: notifications.length,
    userType: userType || 'all'
  }, 'Broadcast notifications sent successfully');
}));

// @route   GET /api/notifications/admin/all
// @desc    Get all notifications (for admin to see what was sent) - Admin only
// @access  Private (Admin only)
router.get('/admin/all', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 50, userId, type, read } = req.query;

  const query: any = {};
  if (userId && mongoose.Types.ObjectId.isValid(userId as string)) {
    query.userId = userId;
  }
  if (type) {
    query.type = type;
  }
  if (read !== undefined) {
    query.read = read === 'true';
  }

  const notifications = await Notification.find(query)
    .populate('userId', 'name email userType')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Notification.countDocuments(query);

  sendSuccessResponse(res, {
    notifications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  }, 'All notifications retrieved successfully');
}));

export default router;
