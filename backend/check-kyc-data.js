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
  rejectionReason: { type: String }
});

const KYC = mongoose.model('KYC', kycSchema);

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  userType: { type: String, enum: ['student', 'employer', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
  phoneVerified: { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  submittedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function checkKYCData() {
  try {
    await connectDB();
    
    console.log('🔍 Checking KYC data...');
    
    // Check total KYC submissions
    const totalKYC = await KYC.countDocuments();
    console.log(`📊 Total KYC submissions: ${totalKYC}`);
    
    // Check KYC by status
    const pendingKYC = await KYC.countDocuments({ verificationStatus: 'pending' });
    const approvedKYC = await KYC.countDocuments({ verificationStatus: 'approved' });
    const rejectedKYC = await KYC.countDocuments({ verificationStatus: 'rejected' });
    
    console.log(`📋 Pending KYC: ${pendingKYC}`);
    console.log(`✅ Approved KYC: ${approvedKYC}`);
    console.log(`❌ Rejected KYC: ${rejectedKYC}`);
    
    // Get all KYC submissions with user details
    const kycSubmissions = await KYC.find({})
      .populate('userId', 'name email phone userType')
      .sort({ submittedAt: -1 });
    
    console.log('\n📋 All KYC Submissions:');
    kycSubmissions.forEach((kyc, i) => {
      console.log(`${i + 1}. ${kyc.fullName} (${kyc.userId?.email})`);
      console.log(`   Status: ${kyc.verificationStatus}`);
      console.log(`   College: ${kyc.college}`);
      console.log(`   Submitted: ${kyc.submittedAt}`);
      console.log('   ---');
    });
    
    // Check total users
    const totalUsers = await User.countDocuments();
    const studentUsers = await User.countDocuments({ userType: 'student' });
    console.log(`\n👥 Total Users: ${totalUsers}`);
    console.log(`🎓 Student Users: ${studentUsers}`);
    
    if (totalKYC === 0) {
      console.log('\n❌ No KYC submissions found!');
      console.log('💡 Students need to submit KYC documents to appear in admin dashboard');
    }

  } catch (error) {
    console.error('❌ Error checking KYC data:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkKYCData();
