import mongoose, { Document, Schema } from 'mongoose';

export interface IVerificationLog extends Document {
  studentId: Schema.Types.ObjectId;
  adminId?: Schema.Types.ObjectId | null;
  action: 'approve' | 'reject' | 'require_trial' | 'auto_check' | 'status_change' | 'upload_id' | 'upload_video' | 'request_trial' | 'trial_result';
  code?: string;
  details?: any;
  timestamp: Date;
}

const verificationLogSchema = new Schema<IVerificationLog>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    action: {
      type: String,
      required: true,
      enum: [
        'approve',
        'reject',
        'require_trial',
        'auto_check',
        'status_change',
        'upload_id',
        'upload_video',
        'request_trial',
        'trial_result'
      ],
      index: true
    },
    code: { type: String, default: '' },
    details: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: false
  }
);

verificationLogSchema.index({ studentId: 1, timestamp: -1 }, { name: 'student_time_idx' });

const VerificationLog = mongoose.model<IVerificationLog>('VerificationLog', verificationLogSchema);
export { VerificationLog };
export default VerificationLog;


