import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  purpose: 'verification' | 'password-reset';
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    length: [6, 'OTP must be 6 digits']
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    enum: ['verification', 'password-reset']
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration time is required'],
    default: function() {
      // OTP expires in 5 minutes
      return new Date(Date.now() + 5 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 });

// Pre-save middleware to ensure OTP is 6 digits
otpSchema.pre('save', function(next) {
  if (this.otp.length !== 6) {
    next(new Error('OTP must be exactly 6 digits'));
  }
  next();
});

// Method to check if OTP is expired
otpSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

const OTP = mongoose.model<IOTP>('OTP', otpSchema);
export { OTP };
export default OTP;

