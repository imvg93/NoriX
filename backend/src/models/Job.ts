import mongoose, { Document, Schema } from 'mongoose';

// Job Interface - Essential fields only
export interface IJob extends Document {
  jobId: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  jobTitle: string;
  description: string;
  location: string;
  salaryRange: string;
  workType: 'Part-time' | 'Full-time' | 'Remote' | 'On-site';
  skillsRequired: string[];
  applicationDeadline: Date;
  
  // Auto-filled employer info
  companyName: string;
  email: string;
  phone: string;
  companyLogo?: string;
  businessType?: string;
  employerName?: string;
  
  // System fields
  status: 'active' | 'paused' | 'closed' | 'expired';
  approvalStatus: 'pending' | 'approved' | 'rejected';

  rejectionReason?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;

  highlighted: boolean;
  createdAt: Date;
  
  // Virtual fields
  duration: string;
  isExpired: boolean;
  
  // Methods
  updateStatus(newStatus: string): Promise<void>;
}

// Job Schema - Essential fields only
const jobSchema = new Schema<IJob>({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    unique: true
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employer ID is required']
  },
  jobTitle: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxlength: [2000, 'Job description cannot exceed 2000 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  salaryRange: {
    type: String,
    required: [true, 'Salary range is required'],
    trim: true,
    maxlength: [100, 'Salary range cannot exceed 100 characters']
  },
  workType: {
    type: String,
    required: [true, 'Work type is required'],
    enum: ['Part-time', 'Full-time', 'Remote', 'On-site'],
    default: 'Full-time'
  },
  skillsRequired: [{
    type: String,
    trim: true,
    maxlength: [100, 'Skill cannot exceed 100 characters']
  }],
  applicationDeadline: {
    type: Date,
    required: [true, 'Application deadline is required'],
    validate: {
      validator: function(this: IJob, value: Date) {
        return value >= new Date();
      },
      message: 'Application deadline must be in the future'
    }
  },
  
  // Auto-filled employer info
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Phone is optional in Job model
        // Accept any phone number - just need at least 6 characters
        return !!(v && v.length >= 6);
      },
      message: 'Phone number must be at least 6 characters'
    }
  },
  companyLogo: {
    type: String,
    trim: true
  },
  businessType: {
    type: String,
    trim: true,
    maxlength: [100, 'Business type cannot exceed 100 characters']
  },
  employerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Employer name cannot exceed 100 characters']
  },
  
  // System fields
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'expired'],
    default: 'active'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],

    default: 'approved' // Auto-approve jobs for now
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date

  },
  highlighted: {
    type: Boolean,
    default: true // New jobs are highlighted by default
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
jobSchema.index({ employerId: 1, status: 1 });
jobSchema.index({ status: 1, highlighted: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ workType: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ approvalStatus: 1 });

// Virtual for job duration
jobSchema.virtual('duration').get(function(this: IJob) {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return `${Math.ceil(diffDays / 30)} months ago`;
});

// Virtual to check if job is expired
jobSchema.virtual('isExpired').get(function(this: IJob) {
  return new Date() > this.applicationDeadline;
});

// Method to update job status
jobSchema.methods.updateStatus = async function(this: IJob, newStatus: 'active' | 'paused' | 'closed' | 'expired') {
  this.status = newStatus;
  await this.save();
};

// Pre-save middleware to handle status updates
jobSchema.pre('save', function(this: IJob) {
  // Auto-expire jobs past their deadline
  if (this.isExpired && this.status === 'active') {
    this.status = 'expired';
  }
});

// Static method to get job statistics
jobSchema.statics.getStats = async function(employerId?: string) {
  const matchField = employerId ? { employerId: new mongoose.Types.ObjectId(employerId) } : {};
  
  const stats = await this.aggregate([
    { $match: matchField },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats.reduce((acc: any, stat: any) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
};

// Export the model
export const Job = mongoose.model<IJob>('Job', jobSchema);
export default Job;