import mongoose, { Document, Schema } from 'mongoose';

export interface IKYCAudit extends Document {
  userId: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  action: 'submitted' | 'approved' | 'rejected' | 'resubmitted';
  reason?: string; // Required for rejections
  prevStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  newStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const KYCAuditSchema = new Schema<IKYCAudit>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['submitted', 'approved', 'rejected', 'resubmitted'],
    required: true
  },
  reason: {
    type: String,
    required: function(this: IKYCAudit) {
      return this.action === 'rejected';
    }
  },
  prevStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'approved', 'rejected'],
    required: true
  },
  newStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'approved', 'rejected'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Compound indexes for efficient queries
KYCAuditSchema.index({ userId: 1, timestamp: -1 });
KYCAuditSchema.index({ adminId: 1, timestamp: -1 });
KYCAuditSchema.index({ action: 1, timestamp: -1 });

export const KYCAudit = mongoose.model<IKYCAudit>('KYCAudit', KYCAuditSchema);
