const mongoose = require('mongoose');

// Connect to MongoDB using the same method as backend
async function connectDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';
    console.log('🔍 Connecting to:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// User Schema (exact match with backend)
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

async function checkBackendDatabase() {
  try {
    await connectDB();
    
    console.log('🔍 Checking what the backend actually sees...');
    
    // Check total users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in backend database: ${totalUsers}`);
    
    // Check admin users
    const adminUsers = await User.find({ userType: 'admin' });
    console.log(`👑 Admin users found: ${adminUsers.length}`);
    
    adminUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email} (${user.name})`);
    });
    
    // Test the exact query the backend uses
    const testUser1 = await User.findOne({ email: 'admin@studentjobs.com' });
    const testUser2 = await User.findOne({ email: 'mework2003@gmail.com' });
    
    console.log('\n🔍 Backend query results:');
    console.log('admin@studentjobs.com:', testUser1 ? '✅ Found' : '❌ Not found');
    console.log('mework2003@gmail.com:', testUser2 ? '✅ Found' : '❌ Not found');
    
    if (!testUser1 && !testUser2) {
      console.log('\n❌ No admin users found! Creating them now...');
      
      // Create admin@studentjobs.com
      const admin1 = new User({
        name: 'Mike Admin',
        email: 'admin@studentjobs.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4/LewdBPj4', // admin123456
        phone: '+1555555555',
        userType: 'admin',
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        approvalStatus: 'approved'
      });
      await admin1.save();
      console.log('✅ Created admin@studentjobs.com');
      
      // Create mework2003@gmail.com
      const admin2 = new User({
        name: 'gireesh',
        email: 'mework2003@gmail.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4/LewdBPj4', // admin1234
        phone: '7032255415',
        userType: 'admin',
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        approvalStatus: 'approved'
      });
      await admin2.save();
      console.log('✅ Created mework2003@gmail.com');
    }

  } catch (error) {
    console.error('❌ Error checking backend database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkBackendDatabase();
