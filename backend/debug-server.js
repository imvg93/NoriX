const express = require('express');
const mongoose = require('mongoose');
const User = require('./dist/models/User').default;

const app = express();
app.use(express.json());

// Test endpoint to debug the issue
app.post('/api/debug-login', async (req, res) => {
  try {
    console.log('🔍 Debug login request:', req.body);
    
    const { email } = req.body;
    
    // Test database connection
    console.log('📡 MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');
    
    // Test user query
    console.log('🔍 Searching for user:', email);
    const user = await User.findOne({ email });
    
    if (user) {
      console.log('✅ User found:', {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        approvalStatus: user.approvalStatus,
        isActive: user.isActive
      });
      
      res.json({
        success: true,
        message: 'User found',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          approvalStatus: user.approvalStatus,
          isActive: user.isActive
        }
      });
    } else {
      console.log('❌ User not found');
      
      // List all users
      const allUsers = await User.find({});
      console.log('📊 All users in database:');
      allUsers.forEach((u, index) => {
        console.log(`${index + 1}. ${u.name} (${u.email}) - ${u.userType} - ${u.approvalStatus}`);
      });
      
      res.json({
        success: false,
        message: 'User not found',
        allUsers: allUsers.map(u => ({
          name: u.name,
          email: u.email,
          userType: u.userType,
          approvalStatus: u.approvalStatus
        }))
      });
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Debug error',
      error: error.message
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🔧 Debug server running on port ${PORT}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/debug-login`);
});
