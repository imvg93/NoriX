const mongoose = require('mongoose');

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

async function testBackendConnection() {
  try {
    await connectDB();
    
    console.log('🔍 Testing backend database connection...');
    
    // Test the exact query the backend uses
    const user = await User.findOne({ email: 'mework2003@gmail.com' });
    
    if (user) {
      console.log('✅ Admin user found by backend query:');
      console.log('   ID:', user._id);
      console.log('   Name:', user.name);
      console.log('   Email:', user.email);
      console.log('   User Type:', user.userType);
      console.log('   Is Active:', user.isActive);
      console.log('   Email Verified:', user.emailVerified);
      console.log('   Approval Status:', user.approvalStatus);
    } else {
      console.log('❌ Admin user NOT found by backend query!');
      
      // Let's see what users exist
      const allUsers = await User.find({});
      console.log(`📊 Total users in database: ${allUsers.length}`);
      
      allUsers.forEach((u, i) => {
        console.log(`${i + 1}. ${u.email} (${u.userType})`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing backend connection:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testBackendConnection();
