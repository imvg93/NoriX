const mongoose = require('mongoose');
const User = require('./dist/models/User').default;

async function testServerConnection() {
  try {
    console.log('🔌 Testing server database connection...');
    
    // Use the same connection string as the server
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';
    console.log('📡 Connecting to:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Test the exact same query as the login route
    console.log('🔍 Testing User.findOne({ email: "john.student@university.edu" })');
    const user = await User.findOne({ email: 'john.student@university.edu' });
    
    if (user) {
      console.log('✅ User found by server query:', {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        approvalStatus: user.approvalStatus,
        isActive: user.isActive
      });
      
      // Test password comparison
      console.log('🔐 Testing password comparison...');
      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare('password123', user.password);
      console.log('🔑 Password valid:', isPasswordValid);
      
    } else {
      console.log('❌ User not found by server query');
      
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

testServerConnection();
