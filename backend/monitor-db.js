const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

async function monitorDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    console.log('📡 Monitoring database for new users...\n');

    // Define User schema
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      phone: String,
      userType: String,
      createdAt: Date,
      college: String,
      companyName: String,
      isActive: Boolean,
      emailVerified: Boolean
    });

    const User = mongoose.model('User', userSchema);

    // Get initial count
    const initialCount = await User.countDocuments();
    console.log(`📊 Initial user count: ${initialCount}`);

    // Show existing users
    const existingUsers = await User.find({}).select('name email phone userType createdAt -_id');
    if (existingUsers.length > 0) {
      console.log('\n📋 Existing users:');
      existingUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.userType}) - ${user.createdAt.toLocaleString()}`);
      });
    }

    console.log('\n🔄 Monitoring for new registrations...');
    console.log('💡 Try registering a new user now!');
    console.log('⏰ Press Ctrl+C to stop monitoring\n');

    // Monitor for changes every 2 seconds
    let lastCount = initialCount;
    const interval = setInterval(async () => {
      try {
        const currentCount = await User.countDocuments();
        
        if (currentCount > lastCount) {
          console.log(`\n🎉 NEW USER DETECTED! Total users: ${currentCount}`);
          
          // Get the newest user
          const newUser = await User.findOne().sort({ createdAt: -1 });
          console.log('📝 New user details:');
          console.log(`   Name: ${newUser.name}`);
          console.log(`   Email: ${newUser.email}`);
          console.log(`   Phone: ${newUser.phone}`);
          console.log(`   Type: ${newUser.userType}`);
          console.log(`   Created: ${newUser.createdAt.toLocaleString()}`);
          console.log(`   Active: ${newUser.isActive ? 'Yes' : 'No'}`);
          console.log(`   Email Verified: ${newUser.emailVerified ? 'Yes' : 'No'}`);
          
          if (newUser.userType === 'student' && newUser.college) {
            console.log(`   College: ${newUser.college}`);
          }
          if (newUser.userType === 'employer' && newUser.companyName) {
            console.log(`   Company: ${newUser.companyName}`);
          }
          
          console.log('-'.repeat(50));
          lastCount = currentCount;
        }
      } catch (error) {
        console.error('❌ Error monitoring:', error.message);
      }
    }, 2000);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      clearInterval(interval);
      console.log('\n🛑 Monitoring stopped');
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

monitorDatabase();
