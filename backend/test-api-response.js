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

async function testAPIResponse() {
  try {
    await connectDB();
    
    console.log('\n🔍 API RESPONSE STRUCTURE TEST');
    console.log('=' .repeat(50));
    
    const baseURL = 'http://localhost:5000/api';
    
    // Admin Login
    let adminToken = '';
    try {
      const adminLoginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'mework2003@gmail.com',
        password: 'admin1234',
        userType: 'admin'
      });
      
      adminToken = adminLoginResponse.data.data.token;
      console.log('✅ Admin login successful');
      
    } catch (loginError) {
      console.log('❌ Admin login failed:', loginError.response?.data?.message || loginError.message);
      return;
    }
    
    // Get Dashboard Data
    try {
      const dashboardResponse = await axios.get(`${baseURL}/admin/dashboard-data`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('\n📊 DASHBOARD API RESPONSE STRUCTURE:');
      console.log('=' .repeat(40));
      
      const response = dashboardResponse.data;
      console.log('Response structure:', JSON.stringify(response, null, 2));
      
      if (response.data) {
        console.log('\n📈 STATISTICS DATA:');
        console.log('Statistics object:', JSON.stringify(response.data.statistics, null, 2));
        
        console.log('\n👥 KYC DATA:');
        console.log('KYC Data length:', response.data.kycData?.length || 0);
        if (response.data.kycData && response.data.kycData.length > 0) {
          console.log('First KYC record:', JSON.stringify(response.data.kycData[0], null, 2));
        }
        
        console.log('\n📋 LOGIN HISTORY:');
        console.log('Login History length:', response.data.loginHistory?.length || 0);
      }
      
    } catch (error) {
      console.log('❌ Dashboard API failed:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the test
testAPIResponse();
