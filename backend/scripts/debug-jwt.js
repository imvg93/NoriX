// Debug script to test JWT and user lookup
const mongoose = require('mongoose');
const User = require('../dist/models/User').default;
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');

async function debugJWT() {
  try {
    console.log('🔍 Debugging JWT and user lookup...');

    // Find admin user
    const admin = await User.findOne({ userType: 'admin' });
    console.log('📊 Admin user found:', {
      id: admin._id,
      idString: admin._id.toString(),
      email: admin.email,
      userType: admin.userType
    });

    // Test JWT secret
    const JWT_SECRET = 'kjh98sd7f98sd7f98sd7f98sd7f98sd7f';
    console.log('🔑 JWT Secret length:', JWT_SECRET.length);

    // Generate token
    const token = jwt.sign(
      { 
        userId: admin._id.toString(), 
        email: admin.email, 
        userType: admin.userType 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('🔑 Generated token:', token.substring(0, 50) + '...');

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔍 Decoded token:', decoded);

    // Test user lookup
    const user = await User.findById(decoded.userId).select('-password');
    console.log('👤 User lookup result:', user ? 'Found' : 'Not found');
    
    if (user) {
      console.log('👤 User details:', {
        id: user._id,
        email: user.email,
        userType: user.userType
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugJWT();
