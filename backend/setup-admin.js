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

async function setupAdmin() {
  try {
    await connectDB();
    
    console.log('🔍 Checking for existing admin user...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: 'admin@studentjobs.com',
      userType: 'admin'
    });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Name:', existingAdmin.name);
      console.log('   User Type:', existingAdmin.userType);
      console.log('   Created:', existingAdmin.createdAt);
      console.log('   Is Active:', existingAdmin.isActive);
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('admin123456', 12);
      existingAdmin.password = hashedPassword;
      existingAdmin.isActive = true;
      existingAdmin.emailVerified = true;
      existingAdmin.approvalStatus = 'approved';
      await existingAdmin.save();
      
      console.log('✅ Admin user updated with correct password');
    } else {
      console.log('📝 Creating new admin user...');
      
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123456', 12);
      const admin = new User({
        name: 'Admin User',
        email: 'admin@studentjobs.com',
        password: hashedPassword,
        phone: '+91 98765 43210',
        userType: 'admin',
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        approvalStatus: 'approved',
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await admin.save();
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n🎯 Admin Login Credentials:');
    console.log('   Email: admin@studentjobs.com');
    console.log('   Password: admin123456');
    console.log('   User Type: admin');
    
    console.log('\n🔗 Login URL: http://localhost:3000/admin-login');
    
    // Test the login
    console.log('\n🧪 Testing admin login...');
    const testAdmin = await User.findOne({ email: 'admin@studentjobs.com' });
    if (testAdmin) {
      const passwordMatch = await bcrypt.compare('admin123456', testAdmin.password);
      if (passwordMatch) {
        console.log('✅ Password verification successful!');
      } else {
        console.log('❌ Password verification failed!');
      }
    }

  } catch (error) {
    console.error('❌ Error setting up admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

setupAdmin();
