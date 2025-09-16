const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

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

async function simulateAdminLoginAndCreateRecords() {
  try {
    await connectDB();
    
    console.log('\n🔧 Simulating Admin Login and Creating Records...\n');
    
    // 1. Find the main admin user
    const mainAdmin = await User.findOne({ 
      email: 'admin@studentjobs.com', 
      userType: 'admin' 
    });
    
    if (!mainAdmin) {
      console.log('❌ Main admin user not found');
      return;
    }
    
    console.log('✅ Found main admin:', {
      name: mainAdmin.name,
      email: mainAdmin.email,
      id: mainAdmin._id
    });
    
    // 2. Test password comparison
    console.log('\n🔍 Testing admin password...');
    const testPassword = 'admin123456'; // Common admin password
    const isPasswordValid = await mainAdmin.comparePassword(testPassword);
    console.log(`Password test result: ${isPasswordValid ? 'VALID' : 'INVALID'}`);
    
    // 3. Create login records for the main admin (simulate past logins)
    console.log('\n📝 Creating historical login records for main admin...');
    
    const historicalLogins = [
      {
        adminId: mainAdmin._id,
        adminEmail: mainAdmin.email,
        adminName: mainAdmin.name,
        loginTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        loginStatus: 'success'
      },
      {
        adminId: mainAdmin._id,
        adminEmail: mainAdmin.email,
        adminName: mainAdmin.name,
        loginTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        ipAddress: '192.168.1.51',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        loginStatus: 'success'
      },
      {
        adminId: mainAdmin._id,
        adminEmail: mainAdmin.email,
        adminName: mainAdmin.name,
        loginTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        ipAddress: '192.168.1.52',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1',
        loginStatus: 'success'
      },
      {
        adminId: mainAdmin._id,
        adminEmail: mainAdmin.email,
        adminName: mainAdmin.name,
        loginTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        ipAddress: '192.168.1.53',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        loginStatus: 'failed',
        failureReason: 'Incorrect password'
      },
      {
        adminId: mainAdmin._id,
        adminEmail: mainAdmin.email,
        adminName: mainAdmin.name,
        loginTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        ipAddress: '192.168.1.54',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        loginStatus: 'success'
      },
      {
        adminId: mainAdmin._id,
        adminEmail: mainAdmin.email,
        adminName: mainAdmin.name,
        loginTime: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        ipAddress: '192.168.1.55',
        userAgent: 'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/109.0 Firefox/120.0',
        loginStatus: 'success'
      }
    ];
    
    // Check if records already exist to avoid duplicates
    const existingRecords = await AdminLogin.find({ adminId: mainAdmin._id });
    if (existingRecords.length > 0) {
      console.log(`⚠️  Main admin already has ${existingRecords.length} login record(s)`);
      console.log('   Skipping creation to avoid duplicates');
    } else {
      const createdLogins = await AdminLogin.insertMany(historicalLogins);
      console.log(`✅ Created ${createdLogins.length} historical login records for main admin`);
    }
    
    // 4. Create a comprehensive admin management record
    console.log('\n📊 Creating comprehensive admin management data...');
    
    // Create additional admin users for testing
    const additionalAdmins = [
      {
        name: 'Super Admin',
        email: 'superadmin@studentjobs.com',
        password: await bcrypt.hash('superadmin123', 12),
        phone: '+91 98765 43211',
        userType: 'admin',
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        approvalStatus: 'approved'
      },
      {
        name: 'System Admin',
        email: 'systemadmin@studentjobs.com',
        password: await bcrypt.hash('systemadmin123', 12),
        phone: '+91 98765 43212',
        userType: 'admin',
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        approvalStatus: 'approved'
      }
    ];
    
    for (const adminData of additionalAdmins) {
      const existingAdmin = await User.findOne({ email: adminData.email });
      if (!existingAdmin) {
        const newAdmin = await User.create(adminData);
        console.log(`✅ Created admin: ${newAdmin.name} (${newAdmin.email})`);
        
        // Create some login records for this admin
        const adminLogins = [
          {
            adminId: newAdmin._id,
            adminEmail: newAdmin.email,
            adminName: newAdmin.name,
            loginTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            ipAddress: `192.168.1.${Math.floor(Math.random() * 100) + 100}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            loginStatus: Math.random() > 0.2 ? 'success' : 'failed',
            failureReason: Math.random() > 0.2 ? null : 'Incorrect password'
          },
          {
            adminId: newAdmin._id,
            adminEmail: newAdmin.email,
            adminName: newAdmin.name,
            loginTime: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
            ipAddress: `192.168.1.${Math.floor(Math.random() * 100) + 200}`,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            loginStatus: 'success'
          }
        ];
        
        await AdminLogin.insertMany(adminLogins);
        console.log(`   📝 Created ${adminLogins.length} login records`);
      } else {
        console.log(`⚠️  Admin already exists: ${existingAdmin.name} (${existingAdmin.email})`);
      }
    }
    
    // 5. Show final summary
    console.log('\n📈 Final Admin Database Summary:');
    const allAdmins = await User.find({ userType: 'admin' }).select('-password');
    const allLogins = await AdminLogin.find().populate('adminId', 'name email');
    
    console.log(`\n👥 Admin Users (${allAdmins.length}):`);
    allAdmins.forEach((admin, index) => {
      const loginCount = allLogins.filter(login => login.adminId && login.adminId._id.toString() === admin._id.toString()).length;
      console.log(`   ${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`      - ID: ${admin._id}`);
      console.log(`      - Active: ${admin.isActive}`);
      console.log(`      - Login Records: ${loginCount}`);
      console.log(`      - Created: ${admin.createdAt.toLocaleDateString()}`);
    });
    
    console.log(`\n📊 Login Statistics:`);
    const totalLogins = allLogins.length;
    const successfulLogins = allLogins.filter(login => login.loginStatus === 'success').length;
    const failedLogins = allLogins.filter(login => login.loginStatus === 'failed').length;
    
    console.log(`   Total Login Records: ${totalLogins}`);
    console.log(`   Successful Logins: ${successfulLogins}`);
    console.log(`   Failed Logins: ${failedLogins}`);
    console.log(`   Success Rate: ${totalLogins > 0 ? ((successfulLogins / totalLogins) * 100).toFixed(2) : 0}%`);
    
    console.log('\n🎉 Admin database setup completed!');
    console.log('\n📝 Available Admin Credentials:');
    console.log('   1. admin@studentjobs.com / admin123456');
    console.log('   2. superadmin@studentjobs.com / superadmin123');
    console.log('   3. systemadmin@studentjobs.com / systemadmin123');
    console.log('   4. test-admin@studentjobs.com / admin123456');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the setup
simulateAdminLoginAndCreateRecords();
