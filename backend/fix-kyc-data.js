const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// KYC Schema
const kycSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  dob: { type: Date, required: true },
  college: { type: String, required: true },
  aadharCard: { type: String },
  collegeIdCard: { type: String },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  isActive: { type: Boolean, default: true }
});

const KYC = mongoose.model('KYC', kycSchema);

async function fixKYCData() {
  try {
    await connectDB();
    
    console.log('🔧 Fixing KYC data...');
    
    // Update all KYC documents to have isActive: true
    const result = await KYC.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} KYC documents with isActive field`);
    
    // Check all KYC documents
    const allKYC = await KYC.find({}).populate('userId', 'name email phone userType');
    
    console.log('\n📋 All KYC Submissions:');
    allKYC.forEach((kyc, i) => {
      console.log(`${i + 1}. ${kyc.fullName} (${kyc.userId?.email})`);
      console.log(`   Status: ${kyc.verificationStatus}`);
      console.log(`   College: ${kyc.college}`);
      console.log(`   Is Active: ${kyc.isActive}`);
      console.log(`   Submitted: ${kyc.submittedAt}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Error fixing KYC data:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixKYCData();
