import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployerKYCDocument extends Document {
  employerId: mongoose.Types.ObjectId;
  
  // Company Information
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  
  // Authorized Person Details
  authorizedName?: string;
  designation?: string;
  
  // Company Location
  address?: string;
  city?: string;
  latitude?: string;
  longitude?: string;
  
  // Business Identifiers
  GSTNumber?: string;
  PAN?: string;
  
  // Document URLs (for future file uploads)
  documents: {
    gstCertificateUrl?: string;
    panCardUrl?: string;
    registrationCertificateUrl?: string;
    addressProofUrl?: string;
    companyRegistrationUrl?: string;
    additionalDocs?: string[];
  };
  
  // KYC Status and Management
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId; // Admin who reviewed
  reviewedAt?: Date;
  submittedAt: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const employerKYCSchema = new Schema<IEmployerKYCDocument>(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      unique: true
    },
    
    // Company Information
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    companyEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 255,
      validate: {
        validator: function(v: string) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address'
      }
    },
    companyPhone: {
      type: String,
      trim: true,
      maxlength: 20,
      validate: {
        validator: function(v: string) {
          return !v || /^[\+]?[0-9\s\-\(\)]{10,}$/.test(v);
        },
        message: 'Please provide a valid phone number'
      }
    },
    
    // Authorized Person Details
    authorizedName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    designation: {
      type: String,
      trim: true,
      maxlength: 50,
      enum: ['Owner', 'HR Manager', 'Recruiter', 'Director', 'Manager', 'Other']
    },
    
    // Company Location
    address: {
      type: String,
      trim: true,
      maxlength: 500
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    latitude: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^-?([1-8]?[0-9](\.[0-9]+)?|90(\.0+)?)$/.test(v);
        },
        message: 'Please provide a valid latitude'
      }
    },
    longitude: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^-?((1[0-7][0-9])|([1-9]?[0-9]))(\.[0-9]+)?$/.test(v);
        },
        message: 'Please provide a valid longitude'
      }
    },
    
    // Business Identifiers
    GSTNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 15,
      validate: {
        validator: function(v: string) {
          return !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: 'Please provide a valid GST number'
      }
    },
    PAN: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
      validate: {
        validator: function(v: string) {
          return !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: 'Please provide a valid PAN number'
      }
    },
    
    // Document URLs
    documents: {
      gstCertificateUrl: { 
        type: String, 
        trim: true,
        validate: {
          validator: function(v: string) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Please provide a valid URL'
        }
      },
      panCardUrl: { 
        type: String, 
        trim: true,
        validate: {
          validator: function(v: string) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Please provide a valid URL'
        }
      },
      registrationCertificateUrl: { 
        type: String, 
        trim: true,
        validate: {
          validator: function(v: string) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Please provide a valid URL'
        }
      },
      addressProofUrl: { 
        type: String, 
        trim: true,
        validate: {
          validator: function(v: string) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Please provide a valid URL'
        }
      },
      companyRegistrationUrl: { 
        type: String, 
        trim: true,
        validate: {
          validator: function(v: string) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Please provide a valid URL'
        }
      },
      additionalDocs: [{ 
        type: String, 
        trim: true,
        validate: {
          validator: function(v: string) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Please provide a valid URL'
        }
      }]
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
      maxlength: 1000
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
    }
  },
  { 
    timestamps: true, 
    collection: 'employer_kyc',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
employerKYCSchema.index({ employerId: 1, status: 1 });
employerKYCSchema.index({ companyName: 1 });
employerKYCSchema.index({ city: 1 });
employerKYCSchema.index({ status: 1, createdAt: -1 });
employerKYCSchema.index({ submittedAt: -1 });

// Virtual for full address
employerKYCSchema.virtual('fullAddress').get(function() {
  const parts = [this.address, this.city].filter(Boolean);
  return parts.join(', ');
});

// Virtual for completion percentage
employerKYCSchema.virtual('completionPercentage').get(function() {
  const fields = [
    'companyName', 'companyEmail', 'companyPhone', 'authorizedName', 
    'designation', 'address', 'city', 'GSTNumber', 'PAN'
  ];
  const filledFields = fields.filter(field => {
    const value = (this as any)[field];
    return value && value.toString().trim();
  });
  return Math.round((filledFields.length / fields.length) * 100);
});

// Pre-save middleware to update submittedAt when status changes
employerKYCSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'pending' && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  next();
});

// Static method to find by employer ID
employerKYCSchema.statics.findByEmployerId = function(employerId: string) {
  return this.findOne({ employerId });
};

// Static method to find pending KYC
employerKYCSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ submittedAt: -1 });
};

// Static method to find approved KYC
employerKYCSchema.statics.findApproved = function() {
  return this.find({ status: 'approved' }).sort({ reviewedAt: -1 });
};

const EmployerKYC = mongoose.model<IEmployerKYCDocument>('EmployerKYC', employerKYCSchema);

export { EmployerKYC };
export default EmployerKYC;