const mongoose = require('mongoose');

// MongoDB connection - using default local connection
const MONGODB_URI = 'mongodb://localhost:27017/studentjobs';

async function checkRegisteredEmails() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📡 Connection string:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Define User schema (simplified version)
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      phone: String,
      userType: String,
      createdAt: Date
    });

    const User = mongoose.model('User', userSchema);

    // Get all users
    const users = await User.find({}).select('name email phone userType createdAt -_id');
    
    console.log('\n📊 REGISTERED USERS:');
    console.log('='.repeat(80));
    
    if (users.length === 0) {
      console.log('❌ No users found in the database!');
      console.log('💡 The database is empty. You need to register some users first.');
      console.log('\n🔧 To add test users, run: node backend/seed-data.js');
    } else {
      console.log(`✅ Found ${users.length} registered user(s):\n`);
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.name || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Phone: ${user.phone || 'N/A'}`);
        console.log(`   Type: ${user.userType || 'N/A'}`);
        console.log(`   Created: ${user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A'}`);
        console.log('-'.repeat(40));
      });
    }

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ userType: 'student' });
    const employers = await User.countDocuments({ userType: 'employer' });
    const admins = await User.countDocuments({ userType: 'admin' });

    console.log('\n📈 USER STATISTICS:');
    console.log('='.repeat(30));
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Students: ${students}`);
    console.log(`Employers: ${employers}`);
    console.log(`Admins: ${admins}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure MongoDB is running on localhost:27017');
    console.log('2. Install MongoDB if not installed');
    console.log('3. Start MongoDB service');
    console.log('\n🔧 To install MongoDB:');
    console.log('   - Download from: https://www.mongodb.com/try/download/community');
    console.log('   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
  } finally {
    try {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    } catch (e) {
      console.log('\n⚠️ Error disconnecting:', e.message);
    }
  }
}

// Run the function
checkRegisteredEmails();
