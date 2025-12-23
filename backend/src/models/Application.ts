import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  applicationId: mongoose.Types.ObjectId; // Auto-generated ID
  jobId: mongoose.Types.ObjectId; // Reference to job
  studentId: mongoose.Types.ObjectId; // Reference to student
  status: 'applied' | 'accepted' | 'rejected' | 'pending' | 'approved' | 'closed' | 'shortlisted' | 'hired'; // Enhanced status options
  appliedAt: Date; // When student applied
  
  // Additional fields for enhanced functionality
  job?: mongoose.Types.ObjectId;
  student?: mongoose.Types.ObjectId;
  employer?: mongoose.Types.ObjectId;
  
  // Application details
  coverLetter?: string;
  resume?: string;
  expectedPay?: number;
  availability?: string;
  
  // Communication
  studentNotes?: string;
  employerNotes?: string;
  
  // Timestamps
  shortlistedDate?: Date;
  interviewedDate?: Date;
  hiredDate?: Date;
  rejectedDate?: Date;
  withdrawnDate?: Date;
  
  // Rating and feedback
  studentRating?: number;
  employerRating?: number;
  studentFeedback?: string;
  employerFeedback?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  updateStatus(newStatus: string, notes?: string): Promise<void>;
  addRating(rater: 'student' | 'employer', rating: number, feedback?: string): Promise<void>;
}

// Static methods interface
export interface IApplicationModel extends mongoose.Model<IApplication> {
  getStats(userId: mongoose.Types.ObjectId, userType: 'student' | 'employer'): Promise<Record<string, number>>;
}

const applicationSchema = new Schema<IApplication>({
  applicationId: {
    type: Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    unique: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required']
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  status: {
    type: String,
    enum: ['applied', 'accepted', 'rejected', 'pending', 'approved', 'closed', 'shortlisted', 'hired'],
    default: 'applied'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  
  // Additional fields for enhanced functionality
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    default: function(this: any) { return this.jobId; },
    set: (v: any) => (v === null || v === undefined || v === '' ? undefined : v)
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: function(this: any) { return this.studentId; },
    set: (v: any) => (v === null || v === undefined || v === '' ? undefined : v)
  },
  employer: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Application details
  coverLetter: {
    type: String,
    trim: true,
    maxlength: [1000, 'Cover letter cannot exceed 1000 characters']
  },
  resume: {
    type: String,
    default: ''
  },
  expectedPay: {
    type: Number,
    min: [0, 'Expected pay cannot be negative']
  },
  availability: {
    type: String,
    enum: ['weekdays', 'weekends', 'both', 'flexible'],
    default: 'flexible'
  },
  
  // Communication
  studentNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Student notes cannot exceed 500 characters']
  },
  employerNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Employer notes cannot exceed 500 characters']
  },
  
  // Timestamps
  shortlistedDate: Date,
  interviewedDate: Date,
  hiredDate: Date,
  rejectedDate: Date,
  withdrawnDate: Date,
  
  // Rating and feedback
  studentRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  employerRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  studentFeedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'Student feedback cannot exceed 1000 characters']
  },
  employerFeedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'Employer feedback cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance and duplicate prevention
applicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });
// Ensure compatibility with legacy fields used in some collections; only enforce when both are valid
applicationSchema.index(
  { job: 1, student: 1 },
  {
    unique: true,
    partialFilterExpression: {
      job: { $exists: true, $type: 'objectId' },
      student: { $exists: true, $type: 'objectId' }
    }
  }
);
applicationSchema.index({ studentId: 1, status: 1 });
applicationSchema.index({ employer: 1, status: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ appliedAt: -1 });

// Virtual for application duration
applicationSchema.virtual('duration').get(function() {
  if (!this.appliedAt) return 'Unknown';
  
  const now = new Date();
  const applied = this.appliedAt;
  const diffInMs = now.getTime() - applied.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
});

// Virtual for status color (for frontend)
applicationSchema.virtual('statusColor').get(function() {
  const statusColors: Record<string, string> = {
    applied: 'blue',
    pending: 'yellow',
    approved: 'green',
    accepted: 'green',
    shortlisted: 'green',
    hired: 'green',
    rejected: 'red',
    closed: 'gray'
  };
  return statusColors[this.status] || 'gray';
});

// Method to update status with timestamp
applicationSchema.methods.updateStatus = function(newStatus: string, notes?: string): Promise<void> {
  this.status = newStatus;
  
  // Set timestamp based on status
  switch (newStatus) {
    case 'approved':
    case 'accepted':
      this.shortlistedDate = new Date();
      break;
    case 'rejected':
      this.rejectedDate = new Date();
      break;
    case 'closed':
      this.withdrawnDate = new Date();
      break;
  }
  
  if (notes) {
    if (newStatus === 'approved' || newStatus === 'accepted' || newStatus === 'rejected' || newStatus === 'closed') {
      this.employerNotes = notes;
    } else {
      this.studentNotes = notes;
    }
  }
  
  return this.save();
};

// Method to add rating and feedback
applicationSchema.methods.addRating = function(
  rater: 'student' | 'employer',
  rating: number,
  feedback?: string
): Promise<void> {
  if (rater === 'student') {
    this.studentRating = rating;
    if (feedback) this.studentFeedback = feedback;
  } else {
    this.employerRating = rating;
    if (feedback) this.employerFeedback = feedback;
  }
  
  return this.save();
};

// Ensure job/student legacy fields are kept in sync before validation (both directions)
applicationSchema.pre('validate', function(next) {
  const doc: any = this;
  if (doc.jobId && !doc.job) {
    doc.job = doc.jobId;
  }
  if (doc.job && !doc.jobId) {
    doc.jobId = doc.job;
  }
  if (doc.studentId && !doc.student) {
    doc.student = doc.studentId;
  }
  if (doc.student && !doc.studentId) {
    doc.studentId = doc.student;
  }
  next();
});

// Pre-save middleware to validate application
applicationSchema.pre('save', function(next) {
  // Prevent multiple applications from same student for same job
  if (this.isNew) {
    // This will be handled by the unique index
  }
  
  // Validate status transitions
  const validTransitions = {
    applied: ['pending', 'approved', 'rejected', 'closed'],
    pending: ['approved', 'rejected', 'closed'],
    approved: ['closed'],
    accepted: ['closed'],
    rejected: [],
    closed: []
  };
  
  if (this.isModified('status') && this.status !== 'applied') {
    const previousStatus = this.status;
    // This validation can be enhanced based on business logic
  }
  
  next();
});

// Static method to get application statistics
applicationSchema.statics.getStats = async function(userId: mongoose.Types.ObjectId, userType: 'student' | 'employer') {
  const matchField = userType === 'student' ? 'studentId' : 'employer';
  
  const stats = await this.aggregate([
    { $match: { [matchField]: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result: Record<string, number> = {};
  stats.forEach(stat => {
    result[stat._id] = stat.count;
  });
  
  return result;
};

const Application = mongoose.model<IApplication, IApplicationModel>('Application', applicationSchema);
export { Application };
export default Application;
