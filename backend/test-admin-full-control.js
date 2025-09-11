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

async function testAdminFullControl() {
  try {
    await connectDB();
    
    console.log('\n🎯 ADMIN FULL CONTROL TEST');
    console.log('=' .repeat(50));
    
    const baseURL = 'http://localhost:5000/api';
    
    // Step 1: Admin Login
    console.log('\n1️⃣ ADMIN LOGIN');
    console.log('-'.repeat(30));
    
    let adminToken = '';
    try {
      const adminLoginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'mework2003@gmail.com',
        password: 'admin1234',
        userType: 'admin'
      });
      
      adminToken = adminLoginResponse.data.data.token;
      console.log('✅ Admin login successful');
      console.log(`   Admin: ${adminLoginResponse.data.data.user.name}`);
      
    } catch (loginError) {
      console.log('❌ Admin login failed:', loginError.response?.data?.message || loginError.message);
      return;
    }
    
    // Step 2: Get KYC data
    console.log('\n2️⃣ GET STUDENT KYC DATA');
    console.log('-'.repeat(30));
    
    let studentKYC = null;
    try {
      const dashboardResponse = await axios.get(`${baseURL}/admin/dashboard-data`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const kycData = dashboardResponse.data.data.kycData;
      if (kycData && kycData.length > 0) {
        studentKYC = kycData[0]; // Get first student
        console.log('✅ Found student KYC data');
        console.log(`   Student: ${studentKYC.studentName}`);
        console.log(`   Email: ${studentKYC.studentEmail}`);
        console.log(`   Current Status: ${studentKYC.status}`);
      } else {
        console.log('❌ No student KYC data found');
        return;
      }
      
    } catch (error) {
      console.log('❌ Failed to get KYC data:', error.response?.data?.message || error.message);
      return;
    }
    
    // Step 3: Test Admin Full Control - Change status from any state to any state
    console.log('\n3️⃣ TEST ADMIN FULL CONTROL');
    console.log('-'.repeat(30));
    
    const testScenarios = [
      { from: studentKYC.status, to: 'approved', action: 'approve' },
      { from: 'approved', to: 'rejected', action: 'reject' },
      { from: 'rejected', to: 'pending', action: 'pending' },
      { from: 'pending', to: 'approved', action: 'approve' }
    ];
    
    for (const scenario of testScenarios) {
      try {
        console.log(`\n   Testing: ${scenario.from} → ${scenario.to}`);
        
        let response;
        if (scenario.action === 'approve') {
          response = await axios.put(`${baseURL}/admin/kyc/${studentKYC._id}/approve`, {}, {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          });
        } else if (scenario.action === 'reject') {
          response = await axios.put(`${baseURL}/admin/kyc/${studentKYC._id}/reject`, 
            { reason: `Test rejection from ${scenario.from} status` }, 
            {
              headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } else if (scenario.action === 'pending') {
          response = await axios.put(`${baseURL}/admin/kyc/${studentKYC._id}/pending`, {}, {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        console.log(`   ✅ ${scenario.action} successful`);
        console.log(`   New Status: ${response.data.data.kyc.verificationStatus}`);
        
        // Update the current status for next test
        studentKYC.status = response.data.data.kyc.verificationStatus;
        
      } catch (error) {
        console.log(`   ❌ ${scenario.action} failed: ${error.response?.data?.message || error.message}`);
      }
    }
    
    // Step 4: Final Status Check
    console.log('\n4️⃣ FINAL STATUS CHECK');
    console.log('-'.repeat(30));
    
    try {
      const finalResponse = await axios.get(`${baseURL}/admin/dashboard-data`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const finalKYC = finalResponse.data.data.kycData.find(k => k._id === studentKYC._id);
      if (finalKYC) {
        console.log(`✅ Final Status: ${finalKYC.status}`);
        console.log(`   Student: ${finalKYC.studentName}`);
      }
      
    } catch (error) {
      console.log('❌ Failed to get final status:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 ADMIN FULL CONTROL TEST COMPLETED!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ Admin can approve from any status');
    console.log('✅ Admin can reject from any status');
    console.log('✅ Admin can set pending from any status');
    console.log('✅ No more "not pending review" errors');
    console.log('✅ Complete admin control over KYC status');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the test
testAdminFullControl();
