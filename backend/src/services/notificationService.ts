import mongoose from 'mongoose';
import Notification, { INotification } from '../models/Notification';
import SocketManager from '../utils/socketManager';

export interface CreateNotificationData {
  receiverId: string | mongoose.Types.ObjectId;
  senderId?: string | mongoose.Types.ObjectId;
  message: string;
  type: 'application' | 'system' | 'alert';
  metadata?: {
    jobId?: string | mongoose.Types.ObjectId;
    applicationId?: string | mongoose.Types.ObjectId;
    [key: string]: any;
  };
}

class NotificationService {
  private socketManager: SocketManager | null = null;

  constructor() {
    // Socket manager will be injected
  }

  public setSocketManager(socketManager: SocketManager) {
    this.socketManager = socketManager;
  }

  /**
   * Create and send a notification (saves to DB and sends via Socket.io)
   */
  public async createNotification(data: CreateNotificationData): Promise<INotification> {
    try {
      // Ensure ObjectId format
      const receiverId = typeof data.receiverId === 'string' 
        ? new mongoose.Types.ObjectId(data.receiverId) 
        : data.receiverId;
      
      const senderId = data.senderId 
        ? (typeof data.senderId === 'string' ? new mongoose.Types.ObjectId(data.senderId) : data.senderId)
        : undefined;

      // Create notification in database
      const notification = await Notification.create({
        receiverId,
        senderId,
        message: data.message,
        type: data.type,
        isRead: false,
        metadata: data.metadata || {},
        createdAt: new Date()
      });

      // Send real-time notification via Socket.io
      if (this.socketManager) {
        this.socketManager.emitToUser(
          receiverId.toString(),
          'notification:new',
          {
            _id: notification._id,
            receiverId: notification.receiverId,
            senderId: notification.senderId,
            message: notification.message,
            type: notification.type,
            isRead: notification.isRead,
            metadata: notification.metadata,
            createdAt: notification.createdAt
          }
        );
      }

      console.log(`✅ Notification created and sent: ${data.type} to ${receiverId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create and send multiple notifications
   */
  public async createBulkNotifications(notifications: CreateNotificationData[]): Promise<INotification[]> {
    const createdNotifications: INotification[] = [];
    
    for (const data of notifications) {
      try {
        const notification = await this.createNotification(data);
        createdNotifications.push(notification);
      } catch (error) {
        console.error(`❌ Failed to create notification for ${data.receiverId}:`, error);
        // Continue with other notifications even if one fails
      }
    }

    return createdNotifications;
  }

  /**
   * Notify student when application is accepted
   */
  public async notifyApplicationAccepted(
    studentId: string | mongoose.Types.ObjectId,
    employerId: string | mongoose.Types.ObjectId,
    applicationId: string | mongoose.Types.ObjectId,
    jobTitle: string,
    companyName: string
  ): Promise<INotification> {
    return this.createNotification({
      receiverId: studentId,
      senderId: employerId,
      message: `Your application for ${jobTitle} at ${companyName} has been accepted. 🎉`,
      type: 'application',
      metadata: {
        applicationId,
        jobTitle,
        companyName
      }
    });
  }

  /**
   * Notify student when application is rejected
   */
  public async notifyApplicationRejected(
    studentId: string | mongoose.Types.ObjectId,
    employerId: string | mongoose.Types.ObjectId,
    applicationId: string | mongoose.Types.ObjectId,
    jobTitle: string,
    companyName: string,
    reason?: string
  ): Promise<INotification> {
    return this.createNotification({
      receiverId: studentId,
      senderId: employerId,
      message: `Your application for ${jobTitle} at ${companyName} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'application',
      metadata: {
        applicationId,
        jobTitle,
        companyName,
        reason
      }
    });
  }

  /**
   * Notify employer when student applies for a job
   */
  public async notifyNewApplication(
    employerId: string | mongoose.Types.ObjectId,
    studentId: string | mongoose.Types.ObjectId,
    applicationId: string | mongoose.Types.ObjectId,
    jobTitle: string,
    studentName: string
  ): Promise<INotification> {
    return this.createNotification({
      receiverId: employerId,
      senderId: studentId,
      message: `${studentName} applied for your job: ${jobTitle}`,
      type: 'application',
      metadata: {
        applicationId,
        studentId,
        jobTitle,
        studentName
      }
    });
  }

  /**
   * Notify employer about suspicious activity
   */
  public async notifySuspiciousActivityToEmployer(
    employerId: string | mongoose.Types.ObjectId,
    activityType: string,
    details: string,
    metadata?: any
  ): Promise<INotification> {
    return this.createNotification({
      receiverId: employerId,
      message: `⚠️ Suspicious activity detected: ${activityType}. ${details}`,
      type: 'alert',
      metadata: {
        activityType,
        details,
        ...metadata
      }
    });
  }

  /**
   * Notify admin about system-level or suspicious activity
   */
  public async notifyAdmin(
    activityType: string,
    details: string,
    metadata?: any
  ): Promise<INotification[]> {
    // Get all admin users
    const { User } = await import('../models/User');
    const admins = await User.find({ userType: 'admin' }).select('_id');

    if (admins.length === 0) {
      console.warn('⚠️ No admin users found for notification');
      return [];
    }

    // Create notifications for all admins
    const notifications = admins.map(admin => {
      const receiverId = admin._id as mongoose.Types.ObjectId | string;
      return {
        receiverId,
      message: `🔔 System Alert: ${activityType}. ${details}`,
      type: 'system' as const,
      metadata: {
        activityType,
        details,
        ...metadata
      }
      };
    });

    return this.createBulkNotifications(notifications);
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(
    notificationId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ): Promise<INotification | null> {
    const id = typeof notificationId === 'string' 
      ? new mongoose.Types.ObjectId(notificationId) 
      : notificationId;
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    // Verify the user owns this notification
    if (notification.receiverId.toString() !== userId.toString()) {
      throw new Error('Access denied: Not your notification');
    }

    notification.isRead = true;
    notification.read = true; // Sync legacy field
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  public async markAllAsRead(userId: string | mongoose.Types.ObjectId): Promise<number> {
    const receiverId = typeof userId === 'string' 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;

    const result = await Notification.updateMany(
      { receiverId, isRead: false },
      { 
        isRead: true,
        read: true, // Sync legacy field
        readAt: new Date()
      }
    );

    return result.modifiedCount || 0;
  }

  /**
   * Get notifications for a user
   */
  public async getUserNotifications(
    userId: string | mongoose.Types.ObjectId,
    options: {
      unreadOnly?: boolean;
      type?: 'application' | 'system' | 'alert';
      limit?: number;
      page?: number;
    } = {}
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    const receiverId = typeof userId === 'string' 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;

    const { unreadOnly = false, type, limit = 20, page = 1 } = options;

    const query: any = { receiverId };
    
    if (unreadOnly) {
      query.isRead = false;
    }
    
    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('senderId', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ receiverId, isRead: false })
    ]);

    return {
      notifications: notifications as any,
      total,
      unreadCount
    };
  }

  /**
   * Detect suspicious activity for applications
   */
  public async detectSuspiciousApplicationActivity(
    studentId: string | mongoose.Types.ObjectId,
    employerId: string | mongoose.Types.ObjectId,
    jobId: string | mongoose.Types.ObjectId
  ): Promise<void> {
    const { Application } = await import('../models/Application');
    
    // Check for multiple applications from same student in short time
    const recentApplications = await Application.find({
      studentId,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    // Threshold: more than 5 applications in 1 hour
    if (recentApplications.length > 5) {
      await this.notifySuspiciousActivityToEmployer(
        employerId,
        'Multiple Rapid Applications',
        `Student ${studentId} has submitted ${recentApplications.length} applications in the last hour. This may indicate spam or automated activity.`,
        { studentId, jobId, count: recentApplications.length }
      );

      // Also notify admin
      await this.notifyAdmin(
        'Suspicious Application Activity',
        `Student ${studentId} has submitted ${recentApplications.length} applications in the last hour. Potential spam detected.`,
        { studentId, jobId, count: recentApplications.length, employerId }
      );
    }

    // Check for duplicate applications (same student applying to same job multiple times)
    const duplicateApplications = await Application.find({
      studentId,
      jobId
    });

    if (duplicateApplications.length > 1) {
      await this.notifySuspiciousActivityToEmployer(
        employerId,
        'Duplicate Applications',
        `Student ${studentId} has submitted ${duplicateApplications.length} applications for the same job.`,
        { studentId, jobId, count: duplicateApplications.length }
      );
    }
  }
}

export default NotificationService;
