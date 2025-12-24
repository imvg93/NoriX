import mongoose, { Document, Schema } from 'mongoose';

export interface IInstantJob extends Document {
  _id: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  jobType: string;
  jobTitle: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  radius: number; // Search radius in km
  pay: string; // Pay amount/range
  duration: number; // Duration in hours
  durationUnit: 'hours' | 'days';
  skillsRequired: string[];
  
  // Dispatch system fields
  status: 'pending' | 'dispatching' | 'locked' | 'in_progress' | 'completed' | 'expired' | 'failed' | 'cancelled';
  currentWave: number; // Current wave number (1, 2, or 3)
  waves: Array<{
    waveNumber: number;
    notifiedStudentIds: mongoose.Types.ObjectId[];
    sentAt: Date;
  }>;
  escrowId?: mongoose.Types.ObjectId;
  startTime?: Date;
  
  // Locking mechanism
  lockedBy?: mongoose.Types.ObjectId; // Student who accepted
  lockExpiresAt?: Date; // 60 seconds after accept
  lockedAt?: Date;
  
  // Final assignment
  acceptedBy?: mongoose.Types.ObjectId;
  acceptedAt?: Date;
  
  // Arrival tracking
  arrivalStatus?: 'en_route' | 'arrived' | 'confirmed';
  arrivalConfirmedAt?: Date;
  arrivalConfirmedBy?: 'student' | 'employer';
  lastLocationUpdate?: Date;
  locationHistory?: Array<{
    latitude: number;
    longitude: number;
    timestamp: Date;
  }>;
  
  // Read receipt tracking (WhatsApp-like marks)
  confirmationViewedByStudent?: boolean;
  confirmationViewedByEmployer?: boolean;
  confirmationViewedAt?: {
    student?: Date;
    employer?: Date;
  };
  
  // Safety limits
  attempts: number; // Total notification attempts (max 3 waves)
  expiresAt: Date; // Job expiry time
  
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  isExpired: boolean;
  isLockExpired: boolean;

  // Completion tracking
  completionRequestedAt?: Date;
  completedAt?: Date;
  completionAutoCompleted?: boolean;
}

const instantJobSchema = new Schema<IInstantJob>({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employer ID is required'],
    index: true
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    trim: true
  },
  jobTitle: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Location address is required'],
      trim: true
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180
    }
  },
  radius: {
    type: Number,
    required: [true, 'Radius is required'],
    default: 5, // Default 5km for urban
    min: 1,
    max: 50
  },
  pay: {
    type: String,
    required: [true, 'Pay is required'],
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: 0.5,
    max: 8 // Max 8 hours for instant jobs
  },
  durationUnit: {
    type: String,
    enum: ['hours', 'days'],
    default: 'hours'
  },
  skillsRequired: [{
    type: String,
    trim: true,
    maxlength: [100, 'Skill cannot exceed 100 characters']
  }],
  
  // Dispatch system fields
  status: {
    type: String,
    enum: ['pending', 'dispatching', 'locked', 'in_progress', 'completed', 'expired', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  currentWave: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  waves: [{
    waveNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 3
    },
    notifiedStudentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    sentAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  }],
  escrowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Escrow',
    index: true
  },
  startTime: {
    type: Date
  },
  
  // Locking mechanism
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  lockExpiresAt: {
    type: Date
  },
  lockedAt: {
    type: Date
  },
  
  // Final assignment
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  acceptedAt: {
    type: Date
  },
  
  // Arrival tracking
  arrivalStatus: {
    type: String,
    enum: ['en_route', 'arrived', 'confirmed'],
    default: 'en_route'
  },
  arrivalConfirmedAt: {
    type: Date
  },
  arrivalConfirmedBy: {
    type: String,
    enum: ['student', 'employer']
  },
  lastLocationUpdate: {
    type: Date
  },
  locationHistory: [{
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Read receipt tracking (WhatsApp-like marks)
  confirmationViewedByStudent: {
    type: Boolean,
    default: false
  },
  confirmationViewedByEmployer: {
    type: Boolean,
    default: false
  },
  confirmationViewedAt: {
    student: Date,
    employer: Date
  },
  
  // Safety limits
  attempts: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry time is required'],
    index: true
  },
  completionRequestedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  completionAutoCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
instantJobSchema.index({ employerId: 1, status: 1 });
instantJobSchema.index({ status: 1, currentWave: 1 });
instantJobSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
// lockExpiresAt and expiresAt indexes are defined inline in schema (index: true)
instantJobSchema.index({ createdAt: -1 });

// Virtual to check if job is expired
instantJobSchema.virtual('isExpired').get(function(this: IInstantJob) {
  return new Date() > this.expiresAt;
});

// Virtual to check if lock is expired
instantJobSchema.virtual('isLockExpired').get(function(this: IInstantJob) {
  if (!this.lockExpiresAt) return false;
  return new Date() > this.lockExpiresAt;
});

// Pre-save middleware
instantJobSchema.pre('save', function(this: IInstantJob) {
  // NEVER change status if it's in_progress or completed - those are final paths
  if (this.status === 'in_progress' || this.status === 'completed') {
    return; // Skip auto-expiry logic once work has started or completed
  }
  
  // Auto-expire if past expiry time - but NOT if job is locked
  // Allow locked jobs to continue even if expired (employer has 60 seconds to confirm/arrive)
  if (this.isExpired && this.status !== 'expired' && this.status !== 'locked') {
    this.status = 'expired';
  }
  
  // Auto-expire lock if past lock expiry - but only if not already in progress
  if (this.lockedBy && this.isLockExpired) {
    // Lock expired - clear it
    this.lockedBy = undefined;
    this.lockedAt = undefined;
    this.lockExpiresAt = undefined;
    if (this.status === 'locked') {
      this.acceptedBy = undefined;
      this.acceptedAt = undefined;
      this.status = 'dispatching';
    }
  }
});

// Export the model
export const InstantJob = mongoose.model<IInstantJob>('InstantJob', instantJobSchema);
export default InstantJob;

