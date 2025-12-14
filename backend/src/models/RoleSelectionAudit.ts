import mongoose, { Document, Schema } from 'mongoose';

export interface IRoleSelectionAudit extends Document {
  userId: mongoose.Types.ObjectId;
  intent: string;
  employerType: 'corporate' | 'local' | 'individual';
  clientIp?: string;
  userAgent?: string;
  timestamp: Date;
}

const RoleSelectionAuditSchema = new Schema<IRoleSelectionAudit>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  intent: {
    type: String,
    required: true
  },
  employerType: {
    type: String,
    enum: ['corporate', 'local', 'individual'],
    required: true
  },
  clientIp: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
RoleSelectionAuditSchema.index({ userId: 1, timestamp: -1 });
RoleSelectionAuditSchema.index({ employerType: 1, timestamp: -1 });

export const RoleSelectionAudit = mongoose.model<IRoleSelectionAudit>('RoleSelectionAudit', RoleSelectionAuditSchema);

