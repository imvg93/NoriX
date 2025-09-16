const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

// User schema (simplified for checking)
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

async function checkCurrentAdminDetails() {
  try {
    await connectDB();
    
    console.log('\n🔍 Checking Current Admin Details in MongoDB...\n');
    
    // 1. Check all admin users
    console.log('1️⃣ Current Admin Users:');
    const adminUsers = await User.find({ userType: 'admin' }).select('-password');
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in the database');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.name} (${admin.email})`);
        console.log(`      - ID: ${admin._id}`);
        console.log(`      - Phone: ${admin.phone}`);
        console.log(`      - Active: ${admin.isActive}`);
        console.log(`      - Email Verified: ${admin.emailVerified}`);
        console.log(`      - Phone Verified: ${admin.phoneVerified}`);
        console.log(`      - Approval Status: ${admin.approvalStatus}`);
        console.log(`      - Created: ${admin.createdAt}`);
        console.log('');
      });
    }
    
    // 2. Check admin login records
    console.log('2️⃣ Admin Login Records:');
    const loginRecords = await AdminLogin.find().populate('adminId', 'name email').sort({ loginTime: -1 });
    
    if (loginRecords.length === 0) {
      console.log('❌ No admin login records found');
    } else {
      console.log(`✅ Found ${loginRecords.length} login record(s):`);
      loginRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.adminName} (${record.adminEmail})`);
        console.log(`      - Login Time: ${record.loginTime}`);
        console.log(`      - Status: ${record.loginStatus.toUpperCase()}`);
        console.log(`      - IP: ${record.ipAddress || 'N/A'}`);
        console.log(`      - User Agent: ${record.userAgent ? record.userAgent.substring(0, 50) + '...' : 'N/A'}`);
        if (record.failureReason) {
          console.log(`      - Failure Reason: ${record.failureReason}`);
        }
        console.log('');
      });
    }
    
    // 3. Check if we need to create login records for existing admins
    console.log('3️⃣ Checking if existing admins have login records...');
    for (const admin of adminUsers) {
      const hasLoginRecords = await AdminLogin.findOne({ adminId: admin._id });
      if (!hasLoginRecords) {
        console.log(`⚠️  Admin ${admin.name} (${admin.email}) has no login records`);
        console.log('   This admin has never logged in or login tracking was not active');
      } else {
        const loginCount = await AdminLogin.countDocuments({ adminId: admin._id });
        console.log(`✅ Admin ${admin.name} has ${loginCount} login record(s)`);
      }
    }
    
    // 4. Show summary statistics
    console.log('\n4️⃣ Summary Statistics:');
    const totalAdmins = adminUsers.length;
    const activeAdmins = adminUsers.filter(admin => admin.isActive).length;
    const verifiedAdmins = adminUsers.filter(admin => admin.emailVerified && admin.phoneVerified).length;
    
    const totalLogins = await AdminLogin.countDocuments();
    const successfulLogins = await AdminLogin.countDocuments({ loginStatus: 'success' });
    const failedLogins = await AdminLogin.countDocuments({ loginStatus: 'failed' });
    
    console.log(`   Total Admin Users: ${totalAdmins}`);
    console.log(`   Active Admins: ${activeAdmins}`);
    console.log(`   Verified Admins: ${verifiedAdmins}`);
    console.log(`   Total Login Records: ${totalLogins}`);
    console.log(`   Successful Logins: ${successfulLogins}`);
    console.log(`   Failed Logins: ${failedLogins}`);
    console.log(`   Success Rate: ${totalLogins > 0 ? ((successfulLogins / totalLogins) * 100).toFixed(2) : 0}%`);
    
    console.log('\n🎉 Admin details check completed!');
    
  } catch (error) {
    console.error('❌ Error checking admin details:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the check
checkCurrentAdminDetails();
