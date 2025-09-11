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

async function testAdminDashboardAPI() {
  try {
    await connectDB();
    
    console.log('\n🧪 Testing Admin Dashboard API...\n');
    
    const baseURL = 'http://localhost:5000/api';
    
    // Test 1: Admin login to get token
    console.log('1️⃣ Testing admin login...');
    let token = '';
    
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'admin@studentjobs.com',
        password: 'admin123456',
        userType: 'admin'
      });
      
      token = loginResponse.data.token;
      console.log('✅ Admin login successful');
      console.log('   Token received:', token ? 'Yes' : 'No');
      
    } catch (loginError) {
      console.log('❌ Admin login failed:', loginError.response?.data?.message || loginError.message);
      console.log('   Trying with test admin...');
      
      try {
        const testLoginResponse = await axios.post(`${baseURL}/auth/login`, {
          email: 'test-admin@studentjobs.com',
          password: 'admin123456',
          userType: 'admin'
        });
        
        token = testLoginResponse.data.token;
        console.log('✅ Test admin login successful');
        
      } catch (testLoginError) {
        console.log('❌ Test admin login also failed:', testLoginError.response?.data?.message || testLoginError.message);
        return;
      }
    }
    
    if (!token) {
      console.log('❌ No token available, cannot test dashboard API');
      return;
    }
    
    // Test 2: Get dashboard data
    console.log('\n2️⃣ Testing admin dashboard API...');
    try {
      const dashboardResponse = await axios.get(`${baseURL}/admin/dashboard-data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Dashboard API successful');
      console.log('   Response status:', dashboardResponse.status);
      
      const data = dashboardResponse.data.data;
      
      console.log('\n📊 Dashboard Data Summary:');
      console.log('   KYC Data:', data.kycData ? data.kycData.length : 0, 'records');
      console.log('   Login History:', data.loginHistory ? data.loginHistory.length : 0, 'records');
      
      if (data.statistics) {
        console.log('\n📈 Statistics:');
        console.log('   KYC Total:', data.statistics.kyc.total);
        console.log('   KYC Pending:', data.statistics.kyc.pending);
        console.log('   KYC Approved:', data.statistics.kyc.approved);
        console.log('   KYC Rejected:', data.statistics.kyc.rejected);
        console.log('   KYC Approval Rate:', data.statistics.kyc.approvalRate + '%');
        console.log('   Login Total:', data.statistics.logins.total);
        console.log('   Login Success Rate:', data.statistics.logins.successRate + '%');
        console.log('   Students:', data.statistics.users.students);
        console.log('   Employers:', data.statistics.users.employers);
      }
      
      if (data.kycData && data.kycData.length > 0) {
        console.log('\n👥 KYC Data Sample:');
        const firstKYC = data.kycData[0];
        console.log('   Student Name:', firstKYC.studentName);
        console.log('   Email:', firstKYC.studentEmail);
        console.log('   College:', firstKYC.college);
        console.log('   Status:', firstKYC.status);
        console.log('   Submitted:', firstKYC.submittedAt);
      }
      
      if (data.loginHistory && data.loginHistory.length > 0) {
        console.log('\n🔐 Login History Sample:');
        const firstLogin = data.loginHistory[0];
        console.log('   Admin Name:', firstLogin.adminName);
        console.log('   Email:', firstLogin.adminEmail);
        console.log('   Status:', firstLogin.loginStatus);
        console.log('   Login Time:', firstLogin.loginTime);
        console.log('   IP Address:', firstLogin.ipAddress);
      }
      
    } catch (dashboardError) {
      console.log('❌ Dashboard API failed:', dashboardError.response?.data?.message || dashboardError.message);
      if (dashboardError.response?.status) {
        console.log('   Status Code:', dashboardError.response.status);
      }
    }
    
    // Test 3: Test individual endpoints
    console.log('\n3️⃣ Testing individual admin endpoints...');
    
    const endpoints = [
      '/admin/stats',
      '/admin/login-history',
      '/admin/login-stats'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${baseURL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        
      } catch (endpointError) {
        console.log(`❌ ${endpoint} - Error: ${endpointError.response?.data?.message || endpointError.message}`);
      }
    }
    
    console.log('\n🎉 Admin dashboard API test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the test
testAdminDashboardAPI();
