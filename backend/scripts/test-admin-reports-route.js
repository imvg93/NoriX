// Test script to verify admin reports route with authentication
const fetch = require('node-fetch').default;
const mongoose = require('mongoose');
const User = require('../dist/models/User').default;
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');

async function testAdminReportsRoute() {
  try {
    console.log('🔍 Testing admin reports route with authentication...');

    // Find an admin user
    const adminUser = await User.findOne({ userType: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found. Creating test admin...');
      
      const testAdmin = new User({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        userType: 'admin',
        isActive: true,
        isVerified: true,
        emailVerified: true
      });
      
      await testAdmin.save();
      console.log('✅ Test admin created');
    }

    const admin = adminUser || await User.findOne({ userType: 'admin' });
    console.log('📊 Found admin user:', admin.email);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: admin._id.toString(), 
        email: admin.email, 
        userType: admin.userType 
      },
      'kjh98sd7f98sd7f98sd7f98sd7f98sd7f',
      { expiresIn: '1h' }
    );

    console.log('🔑 Generated JWT token');

    // Test the route with authentication
    const response = await fetch('http://localhost:5000/api/admin/reports/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Route working! Data received:');
      console.log('📊 Total users:', data.data?.totalUsers || 'N/A');
      console.log('📊 Students:', data.data?.userTypes?.students || 'N/A');
      console.log('📊 Employers:', data.data?.userTypes?.employers || 'N/A');
      console.log('📊 Admins:', data.data?.userTypes?.admins || 'N/A');
      console.log('📊 Recent users (30 days):', data.data?.recentActivity?.newUsersLast30Days || 'N/A');
    } else {
      const error = await response.text();
      console.log('❌ Error response:', error);
    }

  } catch (error) {
    console.error('❌ Error testing route:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAdminReportsRoute();
