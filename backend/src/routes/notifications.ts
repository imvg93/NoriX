import express from 'express';
import mongoose from 'mongoose';
import { Job } from '../models/Job';
import { User } from '../models/User';
import { Application } from '../models/Application';
import { Notification } from '../models/Notification';
import { authenticateToken, requireRole, AuthRequest, requireEmployer, requireStudent } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, sendErrorResponse, ValidationError } from '../middleware/errorHandler';
import NotificationService from '../services/notificationService';

const router = express.Router();

// Notification service will be injected
let notificationService: NotificationService | null = null;

export const setNotificationService = (service: NotificationService) => {
  notificationService = service;
};

// @route   POST /api/notifications/application-submitted
// @desc    Send notification to employer when student applies
// @access  Private (Internal use)
router.post('/application-submitted', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { jobId, studentId, applicationId } = req.body as {
    jobId: string | mongoose.Types.ObjectId;
    studentId: string | mongoose.Types.ObjectId;
    applicationId: string | mongoose.Types.ObjectId;
  };

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

  const jobIdValue = job._id as mongoose.Types.ObjectId | string;
  const studentIdValue = student._id as mongoose.Types.ObjectId | string;
  const recipientId = ((job.employerId as any)?._id ?? job.employerId) as
    | mongoose.Types.ObjectId
    | string
    | undefined;

  if (!recipientId) {
    throw new ValidationError('Job does not have an associated employer');
  }

  // Create notification data
  const notification = {
    type: 'application_submitted',
    title: 'New Job Application',
    message: `A new student has applied for your job posting: ${job.jobTitle}`,
    data: {
      jobId: jobIdValue,
      jobTitle: job.jobTitle,
      studentId: studentIdValue,
      studentName: student.name,
      studentEmail: student.email,
      applicationId: applicationId,
      appliedAt: new Date()
    },
    recipientId,
    recipientType: 'employer',
    isRead: false,
    createdAt: new Date()
  };

  // In a real implementation, you would:
  // 1. Save notification to database
  // 2. Send email notification
  // 3. Send push notification
  // 4. Send real-time notification via WebSocket

  let createdNotification = null;
  if (notificationService) {
    try {
      createdNotification = await notificationService.createNotification({
        receiverId: recipientId,
        senderId: req.user!._id,
        message: notification.message,
        type: 'application',
        metadata: notification.data,
      });
    } catch (serviceErr) {
      console.error('❌ Failed to persist employer notification:', serviceErr);
    }
  }

  console.log('📧 Notification to Employer:', {
    employer: (job.employerId as any).name,
    employerEmail: (job.employerId as any).email,
    jobTitle: job.jobTitle,
    studentName: student.name,
    studentEmail: student.email,
    message: notification.message
  });

  sendSuccessResponse(res, { notification: createdNotification || notification }, 'Employer notification sent successfully');
}));

// @route   POST /api/notifications/application-approved
// @desc    Send notification to student when application is approved
// @access  Private (Internal use)
router.post('/application-approved', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { jobId, studentId, applicationId, employerId } = req.body as {
    jobId: string | mongoose.Types.ObjectId;
    studentId: string | mongoose.Types.ObjectId;
    applicationId: string | mongoose.Types.ObjectId;
    employerId: string | mongoose.Types.ObjectId;
  };

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

  const jobIdValue = job._id as mongoose.Types.ObjectId | string;
  const employerIdValue = employer._id as mongoose.Types.ObjectId | string;

  // Create notification data
  const notification = {
    type: 'application_approved',
    title: 'Application Approved!',
    message: `Your profile has been shortlisted for the job: ${job.jobTitle}. Wait for employer contact.`,
    data: {
      jobId: jobIdValue,
      jobTitle: job.jobTitle,
      employerId: employerIdValue,
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

  let createdNotification = null;
  if (notificationService) {
    try {
      createdNotification = await notificationService.createNotification({
        receiverId: studentId,
        senderId: employerId,
        message: notification.message,
        type: 'application',
        metadata: notification.data,
      });
    } catch (serviceErr) {
      console.error('❌ Failed to persist student notification (approved):', serviceErr);
    }
  }

  console.log('📧 Notification to Student:', {
    studentId: studentId,
    jobTitle: job.jobTitle,
    employerName: employer.name,
    employerEmail: employer.email,
    message: notification.message
  });

  sendSuccessResponse(res, { notification: createdNotification || notification }, 'Student notification sent successfully');
}));

// @route   POST /api/notifications/application-rejected
// @desc    Send notification to student when application is rejected
// @access  Private (Internal use)
router.post('/application-rejected', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { jobId, studentId, applicationId, employerId, reason } = req.body as {
    jobId: string | mongoose.Types.ObjectId;
    studentId: string | mongoose.Types.ObjectId;
    applicationId: string | mongoose.Types.ObjectId;
    employerId: string | mongoose.Types.ObjectId;
    reason?: string;
  };

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

  const jobIdValue = job._id as mongoose.Types.ObjectId | string;
  const employerIdValue = employer._id as mongoose.Types.ObjectId | string;

  // Create notification data
  const notification = {
    type: 'application_rejected',
    title: 'Application Rejected',
    message: `Your application was rejected for the job: ${job.jobTitle}. Please review details and apply for other jobs.`,
    data: {
      jobId: jobIdValue,
      jobTitle: job.jobTitle,
      employerId: employerIdValue,
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

  let createdNotification = null;
  if (notificationService) {
    try {
      createdNotification = await notificationService.createNotification({
        receiverId: studentId,
        senderId: employerId,
        message: notification.message,
        type: 'application',
        metadata: notification.data,
      });
    } catch (serviceErr) {
      console.error('❌ Failed to persist student notification (rejected):', serviceErr);
    }
  }

  console.log('📧 Notification to Student:', {
    studentId: studentId,
    jobTitle: job.jobTitle,
    employerName: employer.name,
    employerEmail: employer.email,
    rejectionReason: reason,
    message: notification.message
  });

  sendSuccessResponse(res, { notification: createdNotification || notification }, 'Student notification sent successfully');
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

  // Use notification service if available
  if (notificationService) {
    const notification = await notificationService.markAsRead(notificationId, req.user!._id);
    return sendSuccessResponse(res, { notification }, 'Notification marked as read');
  }

  // Fallback to direct database update
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new ValidationError('Notification not found');
  }

  // Verify ownership
  if (notification.receiverId.toString() !== req.user!._id.toString()) {
    throw new ValidationError('Access denied: Not your notification');
  }

  notification.isRead = true;
  notification.read = true; // Sync legacy field
  notification.readAt = new Date();
  await notification.save();

  sendSuccessResponse(res, { notification }, 'Notification marked as read');
}));

// @route   PATCH /api/notifications/mark-all-read
// @desc    Mark all notifications as read for the current user
// @access  Private
router.patch('/mark-all-read', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // Use notification service if available
  if (notificationService) {
    const count = await notificationService.markAllAsRead(req.user!._id);
    return sendSuccessResponse(res, { count }, `${count} notifications marked as read`);
  }

  // Fallback to direct database update
  const result = await Notification.updateMany(
    { receiverId: req.user!._id, isRead: false },
    { 
      isRead: true,
      read: true, // Sync legacy field
      readAt: new Date()
    }
  );

  sendSuccessResponse(res, { count: result.modifiedCount || 0 }, 'All notifications marked as read');
}));

// @route   GET /api/notifications/my-notifications
// @desc    Get user's notifications
// @access  Private
router.get('/my-notifications', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 20, unreadOnly = false, type } = req.query;

  // Use notification service if available
  if (notificationService) {
    const result = await notificationService.getUserNotifications(
      req.user!._id,
      {
        unreadOnly: unreadOnly === 'true',
        type: type as 'application' | 'system' | 'alert' | undefined,
        limit: Number(limit),
        page: Number(page)
      }
    );

    return sendSuccessResponse(res, {
      notifications: result.notifications,
      unreadCount: result.unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        pages: Math.ceil(result.total / Number(limit))
      }
    }, 'Notifications retrieved successfully');
  }

  // Fallback to direct database query
  const query: any = { receiverId: req.user!._id };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }
  if (type) {
    query.type = type;
  }

  const notifications = await Notification.find(query)
    .populate('senderId', 'name email')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ receiverId: req.user!._id, isRead: false });

  sendSuccessResponse(res, {
    notifications,
    unreadCount,
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
