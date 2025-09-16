const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
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

async function createWorkingAdmin() {
  try {
    await connectDB();
    
    // Delete existing admin users
    await User.deleteMany({ userType: 'admin' });
    console.log('🗑️ Removed existing admin users');
    
    // Create working admin with correct password hash
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@studentjobs.com',
      password: hashedPassword,
      phone: '1234567890',
      userType: 'admin',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      approvalStatus: 'approved'
    });

    await admin.save();
    console.log('✅ Created working admin account');
    
    console.log('\n🎯 LOGIN CREDENTIALS:');
    console.log('Email: admin@studentjobs.com');
    console.log('Password: admin123');
    console.log('User Type: admin');
    console.log('\n🔗 Login URL: http://localhost:3000/login (use admin credentials)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createWorkingAdmin();