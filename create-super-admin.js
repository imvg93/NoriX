const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createSuperAdmin() {
  try {
    await connectDB();
    
    // Define User schema inline since we need it
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      phone: String,
      password: String,
      userType: { type: String, enum: ['student', 'employer', 'admin'], default: 'student' },
      isActive: { type: Boolean, default: true },
      emailVerified: { type: Boolean, default: true },
      phoneVerified: { type: Boolean, default: true },
      isVerified: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const User = mongoose.model('User', userSchema);

    // Remove any existing admin with this email
    await User.deleteOne({ email: 'mework2003@gmail.com' });
    console.log('🗑️ Removed existing admin user if any');

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('admin1234', saltRounds);

    // Create super admin user
    const adminUser = new User({
      name: 'Super Admin',
      email: 'mework2003@gmail.com',
      phone: '+1234567890',
      password: hashedPassword,
      userType: 'admin',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();
    console.log('✅ Created super admin account');

    console.log('\n🎯 SUPER ADMIN CREDENTIALS:');
    console.log('Email: mework2003@gmail.com');
    console.log('Password: admin1234');
    console.log('User Type: admin');
    console.log('Status: Active with full access');
    console.log('\n🔗 Login URL: http://localhost:3000/login');
    console.log('🔗 Admin Dashboard: http://localhost:3000/admin/dashboard');

    await mongoose.disconnect();
    console.log('\n✅ Super admin created successfully!');
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();

