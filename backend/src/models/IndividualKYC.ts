import mongoose, { Document, Schema } from 'mongoose';

export interface IIndividualKYCDocument extends Document {
  employerId: mongoose.Types.ObjectId;
  
  // Individual Information
  fullName: string;
  aadhaarNumber: string;
  address?: string;
  city?: string;
  locationPin?: string; // For future map integration
  pinCode?: string;
  
  // Verification Documents
  aadhaarFrontUrl?: string;
  aadhaarFrontPublicId?: string;
  aadhaarBackUrl?: string;
  aadhaarBackPublicId?: string;
  selfieUrl?: string;
  selfiePublicId?: string;
  
  // Verification Status
  aadhaarVerified: boolean;
  selfieVerified: boolean;
  
  // KYC Status and Management
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  submittedAt: Date;
  isArchived?: boolean; // For archiving when employer type changes
  archivedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const individualKYCSchema = new Schema<IIndividualKYCDocument>(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      unique: true
    },
    
    // Individual Information
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [150, 'Full name cannot exceed 150 characters']
    },
    aadhaarNumber: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          // Aadhaar number validation: 12 digits
          return /^[0-9]{12}$/.test(v);
        },
        message: 'Aadhaar number must be exactly 12 digits'
      },
      index: true
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters']
    },
    locationPin: {
      type: String,
      trim: true,
      maxlength: 200
    },
    pinCode: {
      type: String,
      trim: true,
      maxlength: 10
    },
    
    // Verification Documents
    aadhaarFrontUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Please provide a valid URL'
      }
    },
    aadhaarFrontPublicId: {
      type: String,
      trim: true
    },
    aadhaarBackUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Please provide a valid URL'
      }
    },
    aadhaarBackPublicId: {
      type: String,
      trim: true
    },
    selfieUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Please provide a valid URL'
      }
    },
    selfiePublicId: {
      type: String,
      trim: true
    },
    
    // Verification Status
    aadhaarVerified: {
      type: Boolean,
      default: false
    },
    selfieVerified: {
      type: Boolean,
      default: false
    },
    
    // KYC Status and Management
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Rejection reason cannot exceed 1000 characters']
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    archivedAt: {
      type: Date
    }
  },
  { 
    timestamps: true, 
    collection: 'individual_kyc',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
individualKYCSchema.index({ employerId: 1, status: 1 });
individualKYCSchema.index({ aadhaarNumber: 1 });
individualKYCSchema.index({ status: 1, createdAt: -1 });
individualKYCSchema.index({ submittedAt: -1 });

// Pre-save middleware to update submittedAt when status changes
individualKYCSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'pending' && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  next();
});

// Static method to find by employer ID
individualKYCSchema.statics.findByEmployerId = function(employerId: string) {
  return this.findOne({ employerId });
};

// Static method to find pending KYC
individualKYCSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ submittedAt: -1 });
};

// Static method to find approved KYC
individualKYCSchema.statics.findApproved = function() {
  return this.find({ status: 'approved' }).sort({ reviewedAt: -1 });
};

const IndividualKYC = mongoose.model<IIndividualKYCDocument>('IndividualKYC', individualKYCSchema);

export { IndividualKYC };
export default IndividualKYC;



