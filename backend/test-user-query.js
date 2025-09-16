const mongoose = require('mongoose');
const User = require('./dist/models/User').default;

async function testUserQuery() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');
    console.log('✅ Connected to MongoDB successfully!');

    console.log('🔍 Searching for user: john.student@university.edu');
    const user = await User.findOne({ email: 'john.student@university.edu' });
    
    if (user) {
      console.log('✅ User found:', {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        approvalStatus: user.approvalStatus,
        isActive: user.isActive
      });
    } else {
      console.log('❌ User not found');
      
      // List all users
      const allUsers = await User.find({});
      console.log('📊 All users in database:');
      allUsers.forEach((u, index) => {
        console.log(`${index + 1}. ${u.name} (${u.email}) - ${u.userType} - ${u.approvalStatus}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testUserQuery();
