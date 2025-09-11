const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
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

async function fixAdminUser() {
  try {
    await connectDB();
    
    console.log('🔧 Fixing admin user...');
    
    // Find your admin user
    const adminUser = await User.findOne({ email: 'mework2003@gmail.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('📋 Current admin user:');
    console.log('   Name:', adminUser.name);
    console.log('   Email:', adminUser.email);
    console.log('   User Type:', adminUser.userType);
    console.log('   Is Active:', adminUser.isActive);
    console.log('   Email Verified:', adminUser.emailVerified);
    
    // Update the user to ensure it's properly configured
    adminUser.name = 'gireesh';
    adminUser.email = 'mework2003@gmail.com';
    adminUser.password = await bcrypt.hash('admin1234', 12);
    adminUser.phone = '7032255415';
    adminUser.userType = 'admin';
    adminUser.isActive = true;
    adminUser.emailVerified = true;
    adminUser.phoneVerified = true;
    adminUser.approvalStatus = 'approved';
    adminUser.updatedAt = new Date();
    
    await adminUser.save();
    
    console.log('✅ Admin user updated successfully!');
    
    // Test password verification
    const passwordMatch = await bcrypt.compare('admin1234', adminUser.password);
    console.log('🧪 Password verification:', passwordMatch ? '✅ Success' : '❌ Failed');
    
    console.log('\n🎯 Final Admin Credentials:');
    console.log('   Email: mework2003@gmail.com');
    console.log('   Password: admin1234');
    console.log('   User Type: admin');
    
    console.log('\n🔗 Login URL: http://localhost:3001/admin-login');
    console.log('   (Note: Frontend is running on port 3001)');

  } catch (error) {
    console.error('❌ Error fixing admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixAdminUser();
