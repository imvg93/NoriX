import mongoose, { Document, Schema } from 'mongoose';

export interface ILocalBusinessKYCDocument extends Document {
  employerId: mongoose.Types.ObjectId;
  
  // Business Information
  businessName: string;
  businessType?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  
  // Business Location
  address: string;
  city?: string;
  pinCode?: string;
  locationPin?: string; // For future map integration
  latitude?: string;
  longitude?: string;
  
  // Basic Proof Documents
  documents: {
    tradeLicenseUrl?: string;
      tradeLicensePublicId?: string;
      shopLicenseUrl?: string;
      shopLicensePublicId?: string;
      shopPhotoUrl?: string; // Shop photo with signage
      shopPhotoPublicId?: string;
      businessLicenseUrl?: string; // Business license
      businessLicensePublicId?: string;
      addressProofUrl?: string;
      addressProofPublicId?: string;
      ownerIdProofUrl?: string;
      ownerIdProofPublicId?: string;
    additionalDocs?: Array<{
      url: string;
      publicId?: string;
      docType: string;
    }>;
  };
  
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

const localBusinessKYCSchema = new Schema<ILocalBusinessKYCDocument>(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      unique: true
    },
    
    // Business Information
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters']
    },
    businessType: {
      type: String,
      trim: true,
      maxlength: [100, 'Business type cannot exceed 100 characters']
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [150, 'Owner name cannot exceed 150 characters']
    },
    ownerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 255,
      validate: {
        validator: function(v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address'
      }
    },
    ownerPhone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^[\+]?[0-9\s\-\(\)]{10,}$/.test(v);
        },
        message: 'Please provide a valid phone number'
      }
    },
    
    // Business Location
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters']
    },
    pinCode: {
      type: String,
      trim: true,
      maxlength: 10
    },
    locationPin: {
      type: String,
      trim: true,
      maxlength: 200
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
    
    // Basic Proof Documents
    documents: {
      tradeLicenseUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function(v: string) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Please provide a valid URL'
        }
      },
      tradeLicensePublicId: {
        type: String,
        trim: true
      },
      shopLicenseUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function(v: string) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Please provide a valid URL'
        }
      },
      shopLicensePublicId: {
        type: String,
        trim: true
      },
      shopPhotoUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function(v: string) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Please provide a valid URL'
        }
      },
      shopPhotoPublicId: {
        type: String,
        trim: true
      },
      businessLicenseUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function(v: string) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Please provide a valid URL'
        }
      },
      businessLicensePublicId: {
        type: String,
        trim: true
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
      addressProofPublicId: {
        type: String,
        trim: true
      },
      ownerIdProofUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function(v: string) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Please provide a valid URL'
        }
      },
      ownerIdProofPublicId: {
        type: String,
        trim: true
      },
      additionalDocs: [{
        url: {
          type: String,
          required: true,
          trim: true,
          validate: {
            validator: function(v: string) {
              return /^https?:\/\/.+/.test(v);
            },
            message: 'Please provide a valid URL'
          }
        },
        publicId: {
          type: String,
          trim: true
        },
        docType: {
          type: String,
          trim: true,
          maxlength: [50, 'Document type cannot exceed 50 characters']
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
    collection: 'local_business_kyc',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
localBusinessKYCSchema.index({ employerId: 1, status: 1 });
localBusinessKYCSchema.index({ businessName: 1 });
localBusinessKYCSchema.index({ city: 1 });
localBusinessKYCSchema.index({ status: 1, createdAt: -1 });
localBusinessKYCSchema.index({ submittedAt: -1 });

// Virtual for full address
localBusinessKYCSchema.virtual('fullAddress').get(function() {
  const parts = [this.address, this.city].filter(Boolean);
  return parts.join(', ');
});

// Pre-save middleware to update submittedAt when status changes
localBusinessKYCSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'pending' && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  next();
});

// Static method to find by employer ID
localBusinessKYCSchema.statics.findByEmployerId = function(employerId: string) {
  return this.findOne({ employerId });
};

// Static method to find pending KYC
localBusinessKYCSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ submittedAt: -1 });
};

// Static method to find approved KYC
localBusinessKYCSchema.statics.findApproved = function() {
  return this.find({ status: 'approved' }).sort({ reviewedAt: -1 });
};

const LocalBusinessKYC = mongoose.model<ILocalBusinessKYCDocument>('LocalBusinessKYC', localBusinessKYCSchema);

export { LocalBusinessKYC };
export default LocalBusinessKYC;



