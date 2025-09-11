import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminLogin extends Document {
  adminId: mongoose.Types.ObjectId;
  adminEmail: string;
  adminName: string;
  loginTime: Date;
  ipAddress?: string;
  userAgent?: string;
  loginStatus: 'success' | 'failed';
  failureReason?: string;
  sessionDuration?: number; // in minutes
  logoutTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminLoginSchema = new Schema<IAdminLogin>({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  adminName: {
    type: String,
    required: true,
    trim: true
  },
  loginTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  loginStatus: {
    type: String,
    enum: ['success', 'failed'],
    required: true,
    default: 'success'
  },
  failureReason: {
    type: String,
    trim: true
  },
  sessionDuration: {
    type: Number,
    min: 0
  },
  logoutTime: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
adminLoginSchema.index({ adminId: 1, loginTime: -1 });
adminLoginSchema.index({ adminEmail: 1, loginTime: -1 });
adminLoginSchema.index({ loginStatus: 1, loginTime: -1 });

export const AdminLogin = mongoose.model<IAdminLogin>('AdminLogin', adminLoginSchema);
