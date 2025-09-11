const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

// AdminLogin schema
const adminLoginSchema = new mongoose.Schema({
  adminId: mongoose.Schema.Types.ObjectId,
  adminEmail: String,
  adminName: String,
  loginTime: Date,
  ipAddress: String,
  userAgent: String,
  loginStatus: String,
  failureReason: String,
  sessionDuration: Number,
  logoutTime: Date,
  createdAt: Date,
  updatedAt: Date
}, {
  timestamps: true
});

const AdminLogin = mongoose.model('AdminLogin', adminLoginSchema);

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  userType: String,
  college: String,
  skills: [String],
  isActive: Boolean,
  emailVerified: Boolean,
  phoneVerified: Boolean,
  approvalStatus: String,
  createdAt: Date,
  updatedAt: Date
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// KYC schema
const kycSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  fullName: String,
  email: String,
  phone: String,
  college: String,
  courseYear: String,
  verificationStatus: String,
  submittedAt: Date,
  approvedAt: Date,
  approvedBy: mongoose.Schema.Types.ObjectId,
  rejectedAt: Date,
  rejectedBy: mongoose.Schema.Types.ObjectId,
  rejectionReason: String,
  aadharCard: String,
  collegeIdCard: String,
  hoursPerWeek: Number,
  availableDays: [String],
  stayType: String,
  preferredJobTypes: [String],
  experienceSkills: String,
  emergencyContact: mongoose.Schema.Types.Mixed,
  payroll: mongoose.Schema.Types.Mixed,
  createdAt: Date,
  updatedAt: Date
}, {
  timestamps: true
});

const KYC = mongoose.model('KYC', kycSchema);

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function testDashboardData() {
  try {
    await connectDB();
    
    console.log('\n🧪 Testing Admin Dashboard Data...\n');
    
    // Test 1: Get KYC data with student details
    console.log('1️⃣ Testing KYC data retrieval...');
    const kycData = await KYC.find({})
      .populate('userId', 'name email phone college skills isActive emailVerified phoneVerified approvalStatus')
      .sort({ submittedAt: -1 });
    
    console.log(`✅ Found ${kycData.length} KYC records`);
    
    if (kycData.length > 0) {
      const firstKYC = kycData[0];
      console.log('   Sample KYC:');
      console.log('     Student:', firstKYC.fullName);
      console.log('     Email:', firstKYC.email);
      console.log('     College:', firstKYC.college);
      console.log('     Status:', firstKYC.verificationStatus);
      console.log('     Submitted:', firstKYC.submittedAt);
    }
    
    // Test 2: Get admin login history
    console.log('\n2️⃣ Testing admin login history...');
    const loginHistory = await AdminLogin.find({})
      .populate('adminId', 'name email')
      .sort({ loginTime: -1 })
      .limit(20);
    
    console.log(`✅ Found ${loginHistory.length} login records`);
    
    if (loginHistory.length > 0) {
      const firstLogin = loginHistory[0];
      console.log('   Sample Login:');
      console.log('     Admin:', firstLogin.adminName);
      console.log('     Email:', firstLogin.adminEmail);
      console.log('     Status:', firstLogin.loginStatus);
      console.log('     Time:', firstLogin.loginTime);
      console.log('     IP:', firstLogin.ipAddress);
    }
    
    // Test 3: Get statistics
    console.log('\n3️⃣ Testing statistics calculation...');
    const [
      totalKYC,
      pendingKYC,
      approvedKYC,
      rejectedKYC,
      totalLogins,
      successfulLogins,
      failedLogins,
      totalStudents,
      totalEmployers
    ] = await Promise.all([
      KYC.countDocuments(),
      KYC.countDocuments({ verificationStatus: 'pending' }),
      KYC.countDocuments({ verificationStatus: 'approved' }),
      KYC.countDocuments({ verificationStatus: 'rejected' }),
      AdminLogin.countDocuments(),
      AdminLogin.countDocuments({ loginStatus: 'success' }),
      AdminLogin.countDocuments({ loginStatus: 'failed' }),
      User.countDocuments({ userType: 'student' }),
      User.countDocuments({ userType: 'employer' })
    ]);
    
    console.log('✅ Statistics calculated:');
    console.log('   KYC Total:', totalKYC);
    console.log('   KYC Pending:', pendingKYC);
    console.log('   KYC Approved:', approvedKYC);
    console.log('   KYC Rejected:', rejectedKYC);
    console.log('   Login Total:', totalLogins);
    console.log('   Login Success:', successfulLogins);
    console.log('   Login Failed:', failedLogins);
    console.log('   Students:', totalStudents);
    console.log('   Employers:', totalEmployers);
    
    // Test 4: Format data like the API would
    console.log('\n4️⃣ Testing data formatting...');
    
    const formattedKYC = kycData.map(kyc => ({
      _id: kyc._id,
      studentId: kyc.userId._id,
      studentName: kyc.fullName,
      studentEmail: kyc.email,
      studentPhone: kyc.phone,
      college: kyc.college,
      courseYear: kyc.courseYear,
      status: kyc.verificationStatus,
      submittedAt: kyc.submittedAt,
      approvedAt: kyc.approvedAt,
      approvedBy: kyc.approvedBy,
      rejectedAt: kyc.rejectedAt,
      rejectedBy: kyc.rejectedBy,
      rejectionReason: kyc.rejectionReason,
      documents: {
        aadharCard: kyc.aadharCard,
        collegeIdCard: kyc.collegeIdCard
      },
      availability: {
        hoursPerWeek: kyc.hoursPerWeek,
        availableDays: kyc.availableDays,
        stayType: kyc.stayType
      },
      jobPreferences: {
        preferredJobTypes: kyc.preferredJobTypes,
        experienceSkills: kyc.experienceSkills
      },
      emergencyContact: kyc.emergencyContact,
      payroll: kyc.payroll,
      userDetails: kyc.userId ? {
        name: kyc.userId.name,
        email: kyc.userId.email,
        phone: kyc.userId.phone,
        college: kyc.userId.college,
        skills: kyc.userId.skills,
        isActive: kyc.userId.isActive,
        emailVerified: kyc.userId.emailVerified,
        phoneVerified: kyc.userId.phoneVerified,
        approvalStatus: kyc.userId.approvalStatus
      } : null
    }));
    
    const formattedLogins = loginHistory.map(login => ({
      _id: login._id,
      adminId: login.adminId._id,
      adminName: login.adminName,
      adminEmail: login.adminEmail,
      loginTime: login.loginTime,
      loginStatus: login.loginStatus,
      ipAddress: login.ipAddress,
      userAgent: login.userAgent,
      failureReason: login.failureReason,
      sessionDuration: login.sessionDuration,
      logoutTime: login.logoutTime
    }));
    
    console.log('✅ Data formatted successfully');
    console.log('   Formatted KYC records:', formattedKYC.length);
    console.log('   Formatted login records:', formattedLogins.length);
    
    // Test 5: Calculate rates
    const loginSuccessRate = totalLogins > 0 ? ((successfulLogins / totalLogins) * 100).toFixed(2) : 0;
    const kycApprovalRate = totalKYC > 0 ? ((approvedKYC / totalKYC) * 100).toFixed(2) : 0;
    
    console.log('\n5️⃣ Testing rate calculations...');
    console.log('✅ Rates calculated:');
    console.log('   Login Success Rate:', loginSuccessRate + '%');
    console.log('   KYC Approval Rate:', kycApprovalRate + '%');
    
    // Test 6: Simulate API response structure
    console.log('\n6️⃣ Testing API response structure...');
    const apiResponse = {
      kycData: formattedKYC,
      loginHistory: formattedLogins,
      statistics: {
        kyc: {
          total: totalKYC,
          pending: pendingKYC,
          approved: approvedKYC,
          rejected: rejectedKYC,
          approvalRate: kycApprovalRate
        },
        logins: {
          total: totalLogins,
          successful: successfulLogins,
          failed: failedLogins,
          successRate: loginSuccessRate
        },
        users: {
          students: totalStudents,
          employers: totalEmployers,
          total: totalStudents + totalEmployers
        }
      }
    };
    
    console.log('✅ API response structure created');
    console.log('   Response keys:', Object.keys(apiResponse));
    console.log('   KYC data length:', apiResponse.kycData.length);
    console.log('   Login history length:', apiResponse.loginHistory.length);
    console.log('   Statistics available:', Object.keys(apiResponse.statistics));
    
    console.log('\n🎉 Admin dashboard data test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ KYC Records: ${totalKYC} (${pendingKYC} pending, ${approvedKYC} approved, ${rejectedKYC} rejected)`);
    console.log(`   ✅ Login Records: ${totalLogins} (${successfulLogins} successful, ${failedLogins} failed)`);
    console.log(`   ✅ Users: ${totalStudents} students, ${totalEmployers} employers`);
    console.log(`   ✅ Success Rates: Login ${loginSuccessRate}%, KYC ${kycApprovalRate}%`);
    
    console.log('\n🌐 Frontend Dashboard URL: http://localhost:3000/admin-dashboard');
    console.log('🔑 Admin Login URL: http://localhost:3000/login');
    console.log('📧 Admin Credentials: admin@studentjobs.com / admin123456');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the test
testDashboardData();
