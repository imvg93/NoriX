import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  title: string;
  company: string;
  employer: mongoose.Types.ObjectId;
  businessType: string;
  location: string;
  jobType: string;
  pay: number;
  payType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'per_task';
  timing: string;
  positions: number;
  description: string;
  requirements?: string | string[];
  benefits?: string;
  contactEmail: string;
  contactPhone?: string;
  
  // Image fields
  posterImage?: string;
  posterImagePublicId?: string;
  galleryImages?: string[];
  galleryImagePublicIds?: string[];
  
  // New fields for enhanced job postings
  type?: string; // Full-time, Part-time, Daily Labor, etc.
  category?: string; // non-it, it, general
  salary?: string; // For display (e.g., "₹15,000/month")
  skills?: string[];
  workHours?: string;
  shiftType?: string;
  experience?: string;
  education?: string;
  schedule?: string;
  startDate?: Date;
  
  // Status and verification
  status: 'active' | 'paused' | 'closed' | 'expired' | 'pending';
  isVerified: boolean;
  isPremium: boolean;
  
  // Admin approval fields
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  submittedAt: Date;
  
  // Analytics
  views: number;
  applications: number;
  shortlisted: number;
  hired: number;
  
  // Timestamps
  postedDate: Date;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  isExpired(): boolean;
  incrementViews(): Promise<void>;
  incrementApplications(): Promise<void>;
}

const jobSchema = new Schema<IJob>({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  employer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employer is required']
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    enum: [
      'Cafe & Restaurant',
      'Retail Store',
      'Tuition Center',
      'Events & Entertainment',
      'Delivery Service',
      'Office & Corporate',
      'Tech Company',
      'Creative Agency',
      'Healthcare',
      'Other'
    ]
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [300, 'Location cannot exceed 300 characters']
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: [
      'Cafe & Restaurant',
      'Tuition & Teaching',
      'Events & Entertainment',
      'Retail',
      'Delivery',
      'Office Work',
      'Tech Support',
      'Creative',
      'Customer Service',
      'Administrative',
      'Other'
    ]
  },
  pay: {
    type: Number,
    required: [true, 'Pay rate is required'],
    min: [0, 'Pay rate cannot be negative']
  },
  payType: {
    type: String,
    required: [true, 'Pay type is required'],
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'per_task'],
    default: 'hourly'
  },
  timing: {
    type: String,
    required: [true, 'Timing is required'],
    enum: [
      'Weekdays',
      'Weekends',
      'Both',
      'Flexible',
      'Morning (6 AM - 12 PM)',
      'Afternoon (12 PM - 6 PM)',
      'Evening (6 PM - 12 AM)',
      'Night (12 AM - 6 AM)'
    ]
  },
  positions: {
    type: Number,
    required: [true, 'Number of positions is required'],
    min: [1, 'At least 1 position is required'],
    max: [100, 'Cannot exceed 100 positions']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxlength: [2000, 'Job description cannot exceed 2000 characters']
  },
  requirements: {
    type: String,
    trim: true,
    maxlength: [1000, 'Requirements cannot exceed 1000 characters']
  },
  benefits: {
    type: String,
    trim: true,
    maxlength: [1000, 'Benefits cannot exceed 1000 characters']
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactPhone: {
    type: String,
    trim: true,
    match: [/^(\+91|0)?[789]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  
  // Image fields
  posterImage: {
    type: String,
    default: ''
  },
  posterImagePublicId: {
    type: String,
    default: ''
  },
  galleryImages: [{
    type: String
  }],
  galleryImagePublicIds: [{
    type: String
  }],
  
  // New fields for enhanced job postings
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Daily Labor', 'Contract', 'Internship', 'Temporary', 'Freelance'],
    default: 'Full-time'
  },
  category: {
    type: String,
    enum: ['non-it', 'it', 'general'],
    default: 'general'
  },
  salary: {
    type: String,
    trim: true,
    maxlength: [50, 'Salary cannot exceed 50 characters']
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: [100, 'Skill cannot exceed 100 characters']
  }],
  workHours: {
    type: String,
    trim: true,
    maxlength: [50, 'Work hours cannot exceed 50 characters']
  },
  shiftType: {
    type: String,
    trim: true,
    maxlength: [50, 'Shift type cannot exceed 50 characters']
  },
  experience: {
    type: String,
    trim: true,
    maxlength: [200, 'Experience cannot exceed 200 characters']
  },
  education: {
    type: String,
    trim: true,
    maxlength: [200, 'Education cannot exceed 200 characters']
  },
  schedule: {
    type: String,
    trim: true,
    maxlength: [200, 'Schedule cannot exceed 200 characters']
  },
  startDate: {
    type: Date,
    validate: {
      validator: function(this: IJob, value: Date) {
        return value >= new Date();
      },
      message: 'Start date must be in the future'
    }
  },
  
  // Status and verification
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'expired', 'pending'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  
  // Admin approval fields
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  applications: {
    type: Number,
    default: 0,
    min: [0, 'Applications cannot be negative']
  },
  shortlisted: {
    type: Number,
    default: 0,
    min: [0, 'Shortlisted count cannot be negative']
  },
  hired: {
    type: Number,
    default: 0,
    min: [0, 'Hired count cannot be negative']
  },
  
  // Timestamps
  postedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(this: IJob, value: Date) {
        return value > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
jobSchema.index({ status: 1, isVerified: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ timing: 1 });
jobSchema.index({ pay: 1 });
jobSchema.index({ employer: 1 });
jobSchema.index({ postedDate: -1 });
jobSchema.index({ expiryDate: 1 });
jobSchema.index({ isPremium: 1 });

// Virtual for formatted pay display
jobSchema.virtual('payDisplay').get(function() {
  const payTypeLabels = {
    hourly: '/hour',
    daily: '/day',
    weekly: '/week',
    monthly: '/month',
    per_task: '/task'
  };
  
  return `₹${this.pay}${payTypeLabels[this.payType]}`;
});

// Virtual for time since posted
jobSchema.virtual('timeSincePosted').get(function() {
  const now = new Date();
  const posted = this.postedDate;
  const diffInMs = now.getTime() - posted.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
});

// Virtual for application rate
jobSchema.virtual('applicationRate').get(function() {
  if (this.views === 0) return 0;
  return ((this.applications / this.views) * 100).toFixed(1);
});

// Method to check if job is expired
jobSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiryDate;
};

// Method to increment views
jobSchema.methods.incrementViews = function(): Promise<void> {
  this.views += 1;
  return this.save();
};

// Method to increment applications
jobSchema.methods.incrementApplications = function(): Promise<void> {
  this.applications += 1;
  return this.save();
};

// Pre-save middleware to set expiry date if not provided
jobSchema.pre('save', function(next) {
  if (!this.expiryDate) {
    // Default expiry: 30 days from posted date
    this.expiryDate = new Date(this.postedDate.getTime() + (30 * 24 * 60 * 60 * 1000));
  }
  next();
});

const Job = mongoose.model<IJob>('Job', jobSchema);
export { Job };
export default Job;
