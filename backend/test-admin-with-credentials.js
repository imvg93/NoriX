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

async function testAdminWithCredentials() {
  try {
    await connectDB();
    
    console.log('\n🧪 Testing Admin Dashboard with provided credentials...\n');
    
    const baseURL = 'http://localhost:5000/api';
    
    // Test admin login with provided credentials
    console.log('1️⃣ Testing admin login with mework2003@gmail.com...');
    let token = '';
    
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'mework2003@gmail.com',
        password: 'admin1234',
        userType: 'admin'
      });
      
      console.log('✅ Admin login successful');
      console.log('   Response data:', JSON.stringify(loginResponse.data, null, 2));
      
      // Try different possible token locations
      token = loginResponse.data.token || loginResponse.data.data?.token || loginResponse.data.accessToken;
      console.log('   Token received:', token ? 'Yes' : 'No');
      
    } catch (loginError) {
      console.log('❌ Admin login failed:', loginError.response?.data?.message || loginError.message);
      console.log('   Status:', loginError.response?.status);
      return;
    }
    
    if (!token) {
      console.log('❌ No token available, cannot test dashboard API');
      return;
    }
    
    // Test dashboard data
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
        console.log('   Students:', data.statistics.users.students);
        console.log('   Employers:', data.statistics.users.employers);
      }
      
      if (data.kycData && data.kycData.length > 0) {
        console.log('\n👥 Student Details Found:');
        data.kycData.forEach((kyc, index) => {
          console.log(`   ${index + 1}. ${kyc.studentName}`);
          console.log(`      Email: ${kyc.studentEmail}`);
          console.log(`      Phone: ${kyc.studentPhone}`);
          console.log(`      College: ${kyc.college}`);
          console.log(`      Status: ${kyc.status}`);
          console.log(`      Submitted: ${new Date(kyc.submittedAt).toLocaleDateString()}`);
          console.log('');
        });
      } else {
        console.log('\n❌ No student details found in KYC data');
      }
      
    } catch (dashboardError) {
      console.log('❌ Dashboard API failed:', dashboardError.response?.data?.message || dashboardError.message);
      if (dashboardError.response?.status) {
        console.log('   Status Code:', dashboardError.response.status);
      }
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the test
testAdminWithCredentials();
