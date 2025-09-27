const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Secure Admin Creation Script
// Only authorized emails can be made into admins

// 🔒 AUTHORIZED ADMIN EMAILS - Only these emails can be made into admins
const AUTHORIZED_ADMIN_EMAILS = [
  'mework2003@gmail.com'        // Primary admin
];

// 🔒 ADMIN CONFIGURATION
const ADMIN_CONFIG = {
  name: 'Girish Admin',
  email: 'mework2003@gmail.com',
  password: 'GirishAdmin2024!',
  phone: '+91 99999 99999',  // Unique phone number
  userType: 'admin',
  isActive: true,
  emailVerified: true,
  phoneVerified: true,
  approvalStatus: 'approved'
};

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// User Schema (simplified for this script)
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

async function createSecureAdmin() {
  try {
    console.log('🔒 SECURE ADMIN CREATION SCRIPT');
    console.log('================================');
    
    await connectDB();
    
    // Security check: Verify email is authorized
    if (!AUTHORIZED_ADMIN_EMAILS.includes(ADMIN_CONFIG.email)) {
      console.error('❌ SECURITY ERROR: Email not authorized for admin creation!');
      console.error('   Email:', ADMIN_CONFIG.email);
      console.error('   Authorized emails:', AUTHORIZED_ADMIN_EMAILS.join(', '));
      process.exit(1);
    }
    
    console.log('✅ Email authorization verified:', ADMIN_CONFIG.email);
    
    // Check if admin already exists (by email or phone)
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: ADMIN_CONFIG.email.toLowerCase(), userType: 'admin' },
        { phone: ADMIN_CONFIG.phone, userType: 'admin' }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:');
      console.log('   Name:', existingAdmin.name);
      console.log('   Email:', existingAdmin.email);
      console.log('   User Type:', existingAdmin.userType);
      console.log('   Created:', existingAdmin.createdAt);
      console.log('   Active:', existingAdmin.isActive);
      
      // Update existing admin with new password
      console.log('\n🔄 Updating existing admin with new credentials...');
      const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 12);
      
      existingAdmin.name = ADMIN_CONFIG.name;
      existingAdmin.password = hashedPassword;
      existingAdmin.phone = ADMIN_CONFIG.phone;
      existingAdmin.isActive = ADMIN_CONFIG.isActive;
      existingAdmin.emailVerified = ADMIN_CONFIG.emailVerified;
      existingAdmin.phoneVerified = ADMIN_CONFIG.phoneVerified;
      existingAdmin.approvalStatus = ADMIN_CONFIG.approvalStatus;
      existingAdmin.updatedAt = new Date();
      
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully!');
    } else {
      // Create new admin user
      console.log('\n📝 Creating new secure admin user...');
      
      const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 12);
      const admin = new User({
        name: ADMIN_CONFIG.name,
        email: ADMIN_CONFIG.email.toLowerCase(),
        password: hashedPassword,
        phone: ADMIN_CONFIG.phone,
        userType: ADMIN_CONFIG.userType,
        isActive: ADMIN_CONFIG.isActive,
        emailVerified: ADMIN_CONFIG.emailVerified,
        phoneVerified: ADMIN_CONFIG.phoneVerified,
        approvalStatus: ADMIN_CONFIG.approvalStatus,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await admin.save();
      console.log('✅ New secure admin user created successfully!');
    }

    console.log('\n🎯 SECURE ADMIN LOGIN CREDENTIALS:');
    console.log('===================================');
    console.log('   Name:', ADMIN_CONFIG.name);
    console.log('   Email:', ADMIN_CONFIG.email);
    console.log('   Password:', ADMIN_CONFIG.password);
    console.log('   User Type: admin');
    console.log('   Status: Active & Verified');
    
    console.log('\n🔗 Login URL: http://localhost:3000/login');
    console.log('   (Use auto-login - no need to select role)');
    
    console.log('\n🔒 SECURITY NOTES:');
    console.log('   - Only authorized emails can become admins');
    console.log('   - Admin creation is restricted to this script');
    console.log('   - Regular registration cannot create admin accounts');
    
    // Test the login
    console.log('\n🧪 Testing admin login...');
    const testAdmin = await User.findOne({ 
      email: ADMIN_CONFIG.email.toLowerCase(),
      userType: 'admin'
    });
    
    if (testAdmin) {
      const passwordMatch = await bcrypt.compare(ADMIN_CONFIG.password, testAdmin.password);
      if (passwordMatch) {
        console.log('✅ Admin login test successful!');
        console.log('   User ID:', testAdmin._id);
        console.log('   Login ready for use');
      } else {
        console.log('❌ Admin login test failed - password mismatch');
      }
    } else {
      console.log('❌ Admin login test failed - user not found');
    }

  } catch (error) {
    console.error('❌ Error creating secure admin:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    console.log('✅ Secure admin creation completed!');
  }
}

// Run the secure admin creation
createSecureAdmin();

