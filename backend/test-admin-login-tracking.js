const mongoose = require('mongoose');
const axios = require('axios');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function testAdminLoginTracking() {
  try {
    await connectDB();
    
    console.log('\n🧪 Testing Admin Login Tracking...\n');
    
    const baseURL = 'http://localhost:5000/api';
    
    // Test 1: Successful admin login
    console.log('1️⃣ Testing successful admin login...');
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'admin@studentjobs.com',
        password: 'admin123456',
        userType: 'admin'
      });
      
      console.log('✅ Admin login successful');
      console.log('   Token received:', loginResponse.data.token ? 'Yes' : 'No');
      console.log('   User data:', {
        name: loginResponse.data.user.name,
        email: loginResponse.data.user.email,
        userType: loginResponse.data.user.userType
      });
      
      // Store token for API calls
      const token = loginResponse.data.token;
      
      // Test 2: Get admin login history
      console.log('\n2️⃣ Testing admin login history API...');
      try {
        const historyResponse = await axios.get(`${baseURL}/admin/login-history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Login history retrieved');
        console.log('   Total records:', historyResponse.data.data.loginHistory.length);
        console.log('   Recent login:', historyResponse.data.data.loginHistory[0] ? {
          adminName: historyResponse.data.data.loginHistory[0].adminName,
          loginTime: historyResponse.data.data.loginHistory[0].loginTime,
          loginStatus: historyResponse.data.data.loginHistory[0].loginStatus,
          ipAddress: historyResponse.data.data.loginHistory[0].ipAddress
        } : 'No records');
        
      } catch (historyError) {
        console.log('❌ Failed to get login history:', historyError.response?.data?.message || historyError.message);
      }
      
      // Test 3: Get admin login statistics
      console.log('\n3️⃣ Testing admin login statistics API...');
      try {
        const statsResponse = await axios.get(`${baseURL}/admin/login-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Login statistics retrieved');
        console.log('   Statistics:', {
          totalLogins: statsResponse.data.data.totalLogins,
          successfulLogins: statsResponse.data.data.successfulLogins,
          failedLogins: statsResponse.data.data.failedLogins,
          successRate: statsResponse.data.data.successRate + '%',
          uniqueAdmins: statsResponse.data.data.uniqueAdmins
        });
        
      } catch (statsError) {
        console.log('❌ Failed to get login statistics:', statsError.response?.data?.message || statsError.message);
      }
      
    } catch (loginError) {
      console.log('❌ Admin login failed:', loginError.response?.data?.message || loginError.message);
    }
    
    // Test 4: Failed admin login (wrong password)
    console.log('\n4️⃣ Testing failed admin login (wrong password)...');
    try {
      await axios.post(`${baseURL}/auth/login`, {
        email: 'admin@studentjobs.com',
        password: 'wrongpassword',
        userType: 'admin'
      });
      console.log('❌ Unexpected: Login should have failed');
    } catch (failedLoginError) {
      console.log('✅ Failed login correctly handled:', failedLoginError.response?.data?.message);
    }
    
    // Test 5: Failed admin login (non-existent admin)
    console.log('\n5️⃣ Testing failed admin login (non-existent admin)...');
    try {
      await axios.post(`${baseURL}/auth/login`, {
        email: 'nonexistent@admin.com',
        password: 'anypassword',
        userType: 'admin'
      });
      console.log('❌ Unexpected: Login should have failed');
    } catch (failedLoginError) {
      console.log('✅ Failed login correctly handled:', failedLoginError.response?.data?.message);
    }
    
    console.log('\n🎉 Admin login tracking test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the test
testAdminLoginTracking();
