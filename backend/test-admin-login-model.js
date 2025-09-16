const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

// AdminLogin schema (simplified for testing)
const adminLoginSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  adminName: {
    type: String,
    required: true,
    trim: true
  },
  loginTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  loginStatus: {
    type: String,
    enum: ['success', 'failed'],
    required: true,
    default: 'success'
  },
  failureReason: {
    type: String,
    trim: true
  },
  sessionDuration: {
    type: Number,
    min: 0
  },
  logoutTime: {
    type: Date
  }
}, {
  timestamps: true
});

const AdminLogin = mongoose.model('AdminLogin', adminLoginSchema);

// User schema (simplified for testing)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['student', 'employer', 'admin'],
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestAdminAndLogins() {
  try {
    await connectDB();
    
    console.log('\n🧪 Creating Test Admin and Login Records...\n');
    
    // Clear existing test data
    await User.deleteMany({ email: 'test-admin@studentjobs.com' });
    await AdminLogin.deleteMany({ adminEmail: 'test-admin@studentjobs.com' });
    console.log('🗑️ Cleared existing test data');
    
    // Create test admin user
    const adminPassword = await bcrypt.hash('admin123456', 12);
    const admin = await User.create({
      name: 'Test Admin User',
      email: 'test-admin@studentjobs.com',
      password: adminPassword,
      phone: '+91 98765 43210',
      userType: 'admin',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      approvalStatus: 'approved'
    });
    
    console.log('✅ Test admin user created:', {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      userType: admin.userType
    });
    
    // Create some test login records
    const testLogins = [
      {
        adminId: admin._id,
        adminEmail: admin.email,
        adminName: admin.name,
        loginTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        loginStatus: 'success'
      },
      {
        adminId: admin._id,
        adminEmail: admin.email,
        adminName: admin.name,
        loginTime: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        loginStatus: 'success'
      },
      {
        adminId: admin._id,
        adminEmail: admin.email,
        adminName: admin.name,
        loginTime: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
        loginStatus: 'failed',
        failureReason: 'Incorrect password'
      },
      {
        adminId: admin._id,
        adminEmail: admin.email,
        adminName: admin.name,
        loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0',
        loginStatus: 'success'
      }
    ];
    
    const createdLogins = await AdminLogin.insertMany(testLogins);
    console.log('✅ Test login records created:', createdLogins.length);
    
    // Test password comparison
    console.log('\n🔍 Testing password comparison...');
    const isPasswordValid = await admin.comparePassword('admin123456');
    console.log('✅ Password comparison test:', isPasswordValid ? 'PASSED' : 'FAILED');
    
    // Query login history
    console.log('\n📊 Querying login history...');
    const loginHistory = await AdminLogin.find({ adminId: admin._id })
      .sort({ loginTime: -1 });
    
    console.log('📋 Login History:');
    loginHistory.forEach((login, index) => {
      console.log(`   ${index + 1}. ${login.loginTime.toISOString()} - ${login.loginStatus.toUpperCase()} - ${login.ipAddress} - ${login.failureReason || 'N/A'}`);
    });
    
    // Get statistics
    const totalLogins = await AdminLogin.countDocuments({ adminId: admin._id });
    const successfulLogins = await AdminLogin.countDocuments({ 
      adminId: admin._id, 
      loginStatus: 'success' 
    });
    const failedLogins = await AdminLogin.countDocuments({ 
      adminId: admin._id, 
      loginStatus: 'failed' 
    });
    
    console.log('\n📈 Login Statistics:');
    console.log(`   Total Logins: ${totalLogins}`);
    console.log(`   Successful: ${successfulLogins}`);
    console.log(`   Failed: ${failedLogins}`);
    console.log(`   Success Rate: ${totalLogins > 0 ? ((successfulLogins / totalLogins) * 100).toFixed(2) : 0}%`);
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n📝 Test Admin Credentials:');
    console.log('   Email: test-admin@studentjobs.com');
    console.log('   Password: admin123456');
    console.log('   User Type: admin');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the test
createTestAdminAndLogins();
