import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'system' | 'job' | 'application' | 'kyc' | 'announcement' | 'warning';
  title: string;
  message: string;
  read: boolean;
  metadata?: {
    jobId?: mongoose.Types.ObjectId;
    applicationId?: mongoose.Types.ObjectId;
    kycId?: mongoose.Types.ObjectId;
    link?: string;
  };
  createdBy?: mongoose.Types.ObjectId; // Admin who created the notification
  createdAt: Date;
  readAt?: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['system', 'job', 'application', 'kyc', 'announcement', 'warning'],
    default: 'system',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
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
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;

