import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  userType: 'student' | 'employer' | 'admin';
  
  // Student specific fields
  college?: string;
  skills?: string[];
  availability?: 'weekdays' | 'weekends' | 'both' | 'flexible';
  rating?: number;
  completedJobs?: number;
  totalEarnings?: number;
  
  // Employer specific fields
  companyName?: string;
  businessType?: string;
  address?: string;
  isVerified?: boolean;
  
  // Common fields
  profilePicture?: string;
  cloudinaryPublicId?: string; // Store Cloudinary public ID for easy deletion
  companyLogo?: string; // For employers
  companyLogoPublicId?: string; // For employers
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  
  // Admin status control
  status?: 'pending' | 'approved' | 'suspended' | 'rejected';
  
  // KYC Status fields
  kycStatus?: 'not-submitted' | 'pending' | 'approved' | 'rejected' | 'suspended';
  kycVerifiedAt?: Date;
  kycRejectedAt?: Date;
  kycPendingAt?: Date;
  
  // Signup tracking
  submittedAt: Date;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
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
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        // Accept any phone number - just need at least 6 characters
        return !!(v && v.length >= 6);
      },
      message: 'Phone number must be at least 6 characters'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: ['student', 'employer', 'admin'],
    default: 'student'
  },
  
  // Student specific fields
  college: {
    type: String,
    required: function(this: IUser) {
      return this.userType === 'student';
    },
    trim: true,
    maxlength: [200, 'College name cannot exceed 200 characters']
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  }],
  availability: {
    type: String,
    enum: ['weekdays', 'weekends', 'both', 'flexible'],
    default: 'flexible'
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  completedJobs: {
    type: Number,
    min: [0, 'Completed jobs cannot be negative'],
    default: 0
  },
  totalEarnings: {
    type: Number,
    min: [0, 'Total earnings cannot be negative'],
    default: 0
  },
  
  // Employer specific fields (optional - collected during KYC)
  companyName: {
    type: String,
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  businessType: {
    type: String,
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
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Common fields
  profilePicture: {
    type: String,
    default: ''
  },
  cloudinaryPublicId: {
    type: String,
    default: ''
  },
  companyLogo: {
    type: String,
    default: ''
  },
  companyLogoPublicId: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  
  // Admin status control
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'rejected'],
    default: 'pending'
  },
  
  // KYC Status fields
  kycStatus: {
    type: String,
    enum: ['not-submitted', 'pending', 'approved', 'rejected', 'suspended'],
    default: 'not-submitted'
  },
  kycVerifiedAt: Date,
  kycRejectedAt: Date,
  kycPendingAt: Date,
  
  // Signup tracking
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      const obj = ret.toObject ? ret.toObject() : ret;
      if (obj.password) {
        delete obj.password;
      }
      return obj;
    }
  }
});

// Indexes for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ userType: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ availability: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Virtual for full profile URL
userSchema.virtual('profilePictureUrl').get(function() {
  if (this.profilePicture) {
    return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${this.profilePicture}`;
  }
  return null;
});

const User = mongoose.model<IUser>('User', userSchema);
export { User };
export default User;
