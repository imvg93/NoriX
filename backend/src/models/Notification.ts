import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  // Legacy fields for backward compatibility
  userId: mongoose.Types.ObjectId;
  title?: string;
  
  // New required fields matching user specification
  receiverId: mongoose.Types.ObjectId; // The user who receives the notification
  senderId?: mongoose.Types.ObjectId; // The user/system who sent the notification (optional)
  message: string;
  type: 'application' | 'system' | 'alert'; // Updated type enum as per requirements
  isRead: boolean;
  createdAt: Date;
  
  // Additional fields for enhanced functionality
  read: boolean; // Alias for isRead for backward compatibility
  metadata?: {
    jobId?: mongoose.Types.ObjectId;
    applicationId?: mongoose.Types.ObjectId;
    kycId?: mongoose.Types.ObjectId;
    link?: string;
    [key: string]: any; // Allow additional metadata
  };
  createdBy?: mongoose.Types.ObjectId; // Admin who created the notification
  readAt?: Date;
}

const notificationSchema = new Schema<INotification>({
  // Legacy field - auto-populated from receiverId if not provided
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  // New required fields
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['application', 'system', 'alert'],
    required: true,
    default: 'system',
    index: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  // Legacy title field (optional)
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  // Legacy read field (synced with isRead)
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job'
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application'
    },
    kycId: {
      type: Schema.Types.ObjectId,
      ref: 'KYC'
    },
    link: {
      type: String,
      trim: true
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  readAt: Date
}, {
  timestamps: true, // This ensures createdAt and updatedAt are automatically managed
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware to sync fields
notificationSchema.pre('save', function(next) {
  // Auto-populate userId from receiverId if not set (for backward compatibility)
  if (!this.userId && this.receiverId) {
    this.userId = this.receiverId;
  }
  // Sync read with isRead
  if (this.isRead !== undefined) {
    this.read = this.isRead;
  } else if (this.read !== undefined) {
    this.isRead = this.read;
  }
  
  // Auto-generate title from message if not provided
  if (!this.title && this.message) {
    this.title = this.message.substring(0, 100);
  }
  
  next();
});

// Indexes for better query performance
// Note: type and senderId indexes are already defined in schema fields above
notificationSchema.index({ receiverId: 1, isRead: 1 });
notificationSchema.index({ receiverId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 }); // Legacy index
notificationSchema.index({ userId: 1, createdAt: -1 }); // Legacy index

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;

