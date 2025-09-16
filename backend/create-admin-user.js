const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./dist/models/User').default;

async function createAdminUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');
    console.log('✅ Connected to MongoDB successfully!');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: 'admin@studentjobs.com',
      userType: 'admin'
    });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:', existingAdmin.email);
      console.log('   Name:', existingAdmin.name);
      console.log('   User Type:', existingAdmin.userType);
      console.log('   Created:', existingAdmin.createdAt);
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123456', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@studentjobs.com',
      password: adminPassword,
      phone: '+91 98765 43210',
      userType: 'admin',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      approvalStatus: 'approved',
      approvedAt: new Date(),
      submittedAt: new Date()
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email:', admin.email);
    console.log('   Password: admin123456');
    console.log('   User Type:', admin.userType);
    console.log('   ID:', admin._id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createAdminUser();
