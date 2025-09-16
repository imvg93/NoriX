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

async function checkAdminUsers() {
  try {
    await connectDB();
    
    console.log('🔍 Checking all admin users in database...\n');
    
    // Find all admin users
    const adminUsers = await User.find({ userType: 'admin' });
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in database!');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
      
      adminUsers.forEach((admin, index) => {
        console.log(`${index + 1}. Admin User:`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Phone: ${admin.phone}`);
        console.log(`   User Type: ${admin.userType}`);
        console.log(`   Is Active: ${admin.isActive}`);
        console.log(`   Email Verified: ${admin.emailVerified}`);
        console.log(`   Approval Status: ${admin.approvalStatus}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log('   ---');
      });
    }
    
    // Check specifically for your email
    console.log('\n🔍 Checking for your specific email...');
    const yourAdmin = await User.findOne({ email: 'mework2003@gmail.com' });
    
    if (yourAdmin) {
      console.log('✅ Your admin user found:');
      console.log(`   Name: ${yourAdmin.name}`);
      console.log(`   Email: ${yourAdmin.email}`);
      console.log(`   User Type: ${yourAdmin.userType}`);
      console.log(`   Is Active: ${yourAdmin.isActive}`);
      console.log(`   Email Verified: ${yourAdmin.emailVerified}`);
    } else {
      console.log('❌ Your admin user NOT found!');
      console.log('   Email: mework2003@gmail.com');
    }

  } catch (error) {
    console.error('❌ Error checking admin users:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAdminUsers();
