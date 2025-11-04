import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedJob extends Document {
  studentId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  savedAt: Date;
}

const savedJobSchema = new Schema<ISavedJob>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required']
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate saves
savedJobSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

const SavedJob = mongoose.model<ISavedJob>('SavedJob', savedJobSchema);

export default SavedJob;

