import mongoose, { Document, Schema } from 'mongoose';

export interface IKYCDocument extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Basic Information
  fullName: string;
  dob: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  phone: string;
  email: string;
  address: string;
  
  // Academic Information
  college: string;
  courseYear: string;
  studentId?: string; // Made optional
  
  // Stay & Availability
  stayType: 'home' | 'pg';
  pgDetails?: {
    name: string;
    address: string;
    contact: string;
  };
  hoursPerWeek: number;
  availableDays: string[];
  
  // Verification Documents (Removed)
  // govtIdType: 'aadhaar' | 'passport' | 'voter-id' | 'driving-license';
  // govtIdFiles: string[]; // Array of file URLs
  // photoFile: string; // Passport photo URL
  
  // Emergency Contact
  emergencyContact: {
    name: string;
    phone: string;
  };
  bloodGroup?: string;
  
  // Work Preferences
  preferredJobTypes: string[];
  experienceSkills?: string;
  
  // Payroll Information
  payroll?: {
    consent: boolean;
    bankAccount?: string;
    ifsc?: string;
    beneficiaryName?: string;
  };
  
  // Verification Status
  verificationStatus: 'pending' | 'in-review' | 'approved' | 'rejected';
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  
  // Metadata
  submittedAt: Date;
  lastUpdated: Date;
  isActive: boolean;
}

const kycSchema = new Schema<IKYCDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Basic Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(this: IKYCDocument, value: Date) {
        const age = new Date().getFullYear() - value.getFullYear();
        return age >= 16;
      },
      message: 'You must be at least 16 years old'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: undefined
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^(\+91|0)?[789]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  
  // Academic Information
  college: {
    type: String,
    required: [true, 'College name is required'],
    trim: true,
    maxlength: [200, 'College name cannot exceed 200 characters']
  },
  courseYear: {
    type: String,
    required: [true, 'Course and year is required'],
    trim: true,
    maxlength: [100, 'Course and year cannot exceed 100 characters']
  },
  studentId: {
    type: String,
    trim: true,
    maxlength: [50, 'Student ID cannot exceed 50 characters']
  },
  
  // Stay & Availability
  stayType: {
    type: String,
    required: [true, 'Stay type is required'],
    enum: ['home', 'pg']
  },
  pgDetails: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'PG name cannot exceed 100 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'PG address cannot exceed 500 characters']
    },
    contact: {
      type: String,
      trim: true,
      match: [/^(\+91|0)?[789]\d{9}$/, 'Please enter a valid Indian phone number']
    }
  },
  hoursPerWeek: {
    type: Number,
    required: [true, 'Hours per week is required'],
    min: [5, 'Minimum 5 hours per week'],
    max: [40, 'Maximum 40 hours per week'],
    default: 20
  },
  availableDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  
  // Verification Documents (Removed)
  // govtIdType: {
  //   type: String,
  //   required: [true, 'Government ID type is required'],
  //   enum: ['aadhaar', 'passport', 'voter-id', 'driving-license']
  // },
  // govtIdFiles: [{
  //   type: String,
  //   required: [true, 'Government ID files are required']
  // }],
  // photoFile: {
  //   type: String,
  //   required: [true, 'Passport photo is required']
  // },
  
  // Emergency Contact
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true,
      maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      trim: true,
      match: [/^(\+91|0)?[789]\d{9}$/, 'Please enter a valid Indian phone number']
    }
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: undefined
  },
  
  // Work Preferences
  preferredJobTypes: [{
    type: String,
    enum: ['warehouse', 'delivery', 'housekeeping', 'construction', 'kitchen', 'retail', 'security', 'data-entry']
  }],
  experienceSkills: {
    type: String,
    trim: true,
    maxlength: [500, 'Experience and skills cannot exceed 500 characters']
  },
  
  // Payroll Information
  payroll: {
    consent: {
      type: Boolean,
      default: false
    },
    bankAccount: {
      type: String,
      trim: true,
      validate: {
        validator: function(this: IKYCDocument, value: string) {
          if (this.payroll?.consent && !value) return false;
          return !value || /^\d+$/.test(value);
        },
        message: 'Bank account number should contain only digits'
      }
    },
    ifsc: {
      type: String,
      trim: true,
      uppercase: true,
      validate: {
        validator: function(this: IKYCDocument, value: string) {
          if (this.payroll?.consent && !value) return false;
          return !value || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value);
        },
        message: 'Invalid IFSC code format'
      }
    },
    beneficiaryName: {
      type: String,
      trim: true,
      maxlength: [100, 'Beneficiary name cannot exceed 100 characters']
    }
  },
  
  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'in-review', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Verification notes cannot exceed 500 characters']
  },
  verifiedAt: Date,
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Metadata
  submittedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      const obj = ret.toObject ? ret.toObject() : ret;
      // Remove sensitive information
      if (obj.payroll?.bankAccount) {
        obj.payroll.bankAccount = obj.payroll.bankAccount.replace(/\d(?=\d{4})/g, '*');
      }
      return obj;
    }
  }
});

// Indexes for better query performance
kycSchema.index({ userId: 1 });
kycSchema.index({ verificationStatus: 1 });
kycSchema.index({ submittedAt: -1 });
kycSchema.index({ preferredJobTypes: 1 });
kycSchema.index({ availableDays: 1 });

// Update lastUpdated before saving
kycSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const KYC = mongoose.model<IKYCDocument>('KYC', kycSchema);
export { KYC };
export default KYC;
