const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  userType: String,
  isActive: Boolean,
  emailVerified: Boolean,
  phoneVerified: Boolean,
  approvalStatus: String,
  submittedAt: Date,
  createdAt: Date,
  updatedAt: Date
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

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

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function showCompleteAdminDetails() {
  try {
    await connectDB();
    
    console.log('\n🔍 COMPLETE ADMIN DETAILS IN MONGODB\n');
    console.log('=' .repeat(60));
    
    // 1. Get all admin users
    const adminUsers = await User.find({ userType: 'admin' }).select('-password');
    console.log(`\n👥 ADMIN USERS (${adminUsers.length}):`);
    console.log('-'.repeat(40));
    
    adminUsers.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.name}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   📱 Phone: ${admin.phone}`);
      console.log(`   🆔 ID: ${admin._id}`);
      console.log(`   ✅ Active: ${admin.isActive}`);
      console.log(`   📧 Email Verified: ${admin.emailVerified}`);
      console.log(`   📱 Phone Verified: ${admin.phoneVerified}`);
      console.log(`   📋 Approval Status: ${admin.approvalStatus}`);
      console.log(`   📅 Created: ${admin.createdAt.toLocaleString()}`);
      console.log(`   🔄 Updated: ${admin.updatedAt.toLocaleString()}`);
    });
    
    // 2. Get all login records
    const loginRecords = await AdminLogin.find()
      .populate('adminId', 'name email')
      .sort({ loginTime: -1 });
    
    console.log(`\n📊 LOGIN RECORDS (${loginRecords.length}):`);
    console.log('-'.repeat(40));
    
    if (loginRecords.length === 0) {
      console.log('❌ No login records found');
    } else {
      loginRecords.forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.adminName} (${record.adminEmail})`);
        console.log(`   🕒 Login Time: ${record.loginTime.toLocaleString()}`);
        console.log(`   📊 Status: ${record.loginStatus.toUpperCase()}`);
        console.log(`   🌐 IP Address: ${record.ipAddress || 'N/A'}`);
        console.log(`   💻 User Agent: ${record.userAgent ? record.userAgent.substring(0, 60) + '...' : 'N/A'}`);
        if (record.failureReason) {
          console.log(`   ❌ Failure Reason: ${record.failureReason}`);
        }
        console.log(`   📅 Record Created: ${record.createdAt.toLocaleString()}`);
      });
    }
    
    // 3. Show login statistics by admin
    console.log(`\n📈 LOGIN STATISTICS BY ADMIN:`);
    console.log('-'.repeat(40));
    
    for (const admin of adminUsers) {
      const adminLogins = loginRecords.filter(login => 
        login.adminId && login.adminId._id.toString() === admin._id.toString()
      );
      
      const successfulLogins = adminLogins.filter(login => login.loginStatus === 'success').length;
      const failedLogins = adminLogins.filter(login => login.loginStatus === 'failed').length;
      const successRate = adminLogins.length > 0 ? ((successfulLogins / adminLogins.length) * 100).toFixed(2) : 0;
      
      console.log(`\n👤 ${admin.name} (${admin.email}):`);
      console.log(`   📊 Total Logins: ${adminLogins.length}`);
      console.log(`   ✅ Successful: ${successfulLogins}`);
      console.log(`   ❌ Failed: ${failedLogins}`);
      console.log(`   📈 Success Rate: ${successRate}%`);
      
      if (adminLogins.length > 0) {
        const lastLogin = adminLogins[0];
        console.log(`   🕒 Last Login: ${lastLogin.loginTime.toLocaleString()}`);
        console.log(`   🌐 Last IP: ${lastLogin.ipAddress || 'N/A'}`);
      }
    }
    
    // 4. Overall statistics
    console.log(`\n📊 OVERALL STATISTICS:`);
    console.log('-'.repeat(40));
    
    const totalLogins = loginRecords.length;
    const successfulLogins = loginRecords.filter(login => login.loginStatus === 'success').length;
    const failedLogins = loginRecords.filter(login => login.loginStatus === 'failed').length;
    const overallSuccessRate = totalLogins > 0 ? ((successfulLogins / totalLogins) * 100).toFixed(2) : 0;
    
    const uniqueAdmins = [...new Set(loginRecords.map(login => login.adminEmail))].length;
    const activeAdmins = adminUsers.filter(admin => admin.isActive).length;
    const verifiedAdmins = adminUsers.filter(admin => admin.emailVerified && admin.phoneVerified).length;
    
    console.log(`   👥 Total Admin Users: ${adminUsers.length}`);
    console.log(`   ✅ Active Admins: ${activeAdmins}`);
    console.log(`   📧 Verified Admins: ${verifiedAdmins}`);
    console.log(`   📊 Total Login Records: ${totalLogins}`);
    console.log(`   ✅ Successful Logins: ${successfulLogins}`);
    console.log(`   ❌ Failed Logins: ${failedLogins}`);
    console.log(`   📈 Overall Success Rate: ${overallSuccessRate}%`);
    console.log(`   🔐 Admins with Login Records: ${uniqueAdmins}`);
    
    // 5. Recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogins = loginRecords.filter(login => login.loginTime >= oneDayAgo);
    
    console.log(`\n🕒 RECENT ACTIVITY (Last 24 Hours):`);
    console.log('-'.repeat(40));
    console.log(`   📊 Recent Logins: ${recentLogins.length}`);
    
    if (recentLogins.length > 0) {
      const recentSuccessful = recentLogins.filter(login => login.loginStatus === 'success').length;
      const recentFailed = recentLogins.filter(login => login.loginStatus === 'failed').length;
      console.log(`   ✅ Recent Successful: ${recentSuccessful}`);
      console.log(`   ❌ Recent Failed: ${recentFailed}`);
      
      console.log(`\n   🕒 Recent Login Details:`);
      recentLogins.slice(0, 5).forEach((login, index) => {
        console.log(`      ${index + 1}. ${login.adminName} - ${login.loginTime.toLocaleString()} - ${login.loginStatus.toUpperCase()}`);
      });
    }
    
    // 6. Admin credentials summary
    console.log(`\n🔑 ADMIN CREDENTIALS SUMMARY:`);
    console.log('-'.repeat(40));
    
    adminUsers.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.name}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🔑 Password: admin123456 (standardized)`);
      console.log(`   👤 User Type: admin`);
      console.log(`   ✅ Status: ${admin.isActive ? 'Active' : 'Inactive'}`);
    });
    
    console.log(`\n🎉 COMPLETE ADMIN DETAILS RETRIEVED SUCCESSFULLY!`);
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the complete details check
showCompleteAdminDetails();
