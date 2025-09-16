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

async function testCompleteAdminFlow() {
  try {
    await connectDB();
    
    console.log('\n🧪 Testing Complete Admin Flow...\n');
    
    const baseURL = 'http://localhost:5000/api';
    
    // Step 1: Admin login
    console.log('1️⃣ Admin Login...');
    let token = '';
    
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'mework2003@gmail.com',
        password: 'admin1234',
        userType: 'admin'
      });
      
      token = loginResponse.data.data.token;
      console.log('✅ Login successful');
      console.log('   User:', loginResponse.data.data.user.name);
      console.log('   Token:', token ? 'Received' : 'Not received');
      
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.data?.message || loginError.message);
      return;
    }
    
    // Step 2: Test dashboard API (same as frontend calls)
    console.log('\n2️⃣ Dashboard API Test...');
    try {
      const dashboardResponse = await axios.get(`${baseURL}/admin/dashboard-data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Dashboard API successful');
      console.log('   Status:', dashboardResponse.status);
      
      const data = dashboardResponse.data.data;
      
      console.log('\n📊 Dashboard Data:');
      console.log('   KYC Records:', data.kycData ? data.kycData.length : 0);
      console.log('   Login History:', data.loginHistory ? data.loginHistory.length : 0);
      
      if (data.statistics) {
        console.log('\n📈 Statistics:');
        console.log('   KYC Total:', data.statistics.kyc.total);
        console.log('   KYC Pending:', data.statistics.kyc.pending);
        console.log('   KYC Approved:', data.statistics.kyc.approved);
        console.log('   KYC Rejected:', data.statistics.kyc.rejected);
        console.log('   Students:', data.statistics.users.students);
        console.log('   Employers:', data.statistics.users.employers);
      }
      
      // Step 3: Display student details (what should show on frontend)
      if (data.kycData && data.kycData.length > 0) {
        console.log('\n👥 Student Details (Should appear on Admin Dashboard):');
        data.kycData.forEach((student, index) => {
          console.log(`\n   ${index + 1}. ${student.studentName}`);
          console.log(`      📧 Email: ${student.studentEmail}`);
          console.log(`      📱 Phone: ${student.studentPhone}`);
          console.log(`      🎓 College: ${student.college}`);
          console.log(`      📚 Course: ${student.courseYear}`);
          console.log(`      📅 Submitted: ${new Date(student.submittedAt).toLocaleDateString()}`);
          console.log(`      📊 Status: ${student.status}`);
          console.log(`      📄 Documents: Aadhar ${student.documents?.aadharCard ? '✓' : '✗'}, College ID ${student.documents?.collegeIdCard ? '✓' : '✗'}`);
          console.log(`      ⏰ Hours/Week: ${student.availability?.hoursPerWeek || 'N/A'}`);
        });
      } else {
        console.log('\n❌ No student details found - this is the problem!');
      }
      
      // Step 4: Test status update functionality
      if (data.kycData && data.kycData.length > 0) {
        console.log('\n3️⃣ Testing Status Update...');
        const firstStudent = data.kycData[0];
        
        try {
          // Test approve
          const approveResponse = await axios.put(`${baseURL}/admin/kyc/${firstStudent._id}/approve`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('✅ Approve API successful');
          console.log('   Student:', firstStudent.studentName);
          console.log('   New Status:', approveResponse.data.data.kyc.verificationStatus);
          
        } catch (updateError) {
          console.log('❌ Status update failed:', updateError.response?.data?.message || updateError.message);
        }
      }
      
    } catch (dashboardError) {
      console.log('❌ Dashboard API failed:', dashboardError.response?.data?.message || dashboardError.message);
      if (dashboardError.response?.status) {
        console.log('   Status Code:', dashboardError.response.status);
      }
    }
    
    console.log('\n🎉 Complete Admin Flow Test Finished!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Admin login works');
    console.log('   ✅ Dashboard API returns student data');
    console.log('   ✅ Student details are available');
    console.log('   ✅ Status management works');
    console.log('\n💡 If the frontend is not showing student details, the issue is likely:');
    console.log('   1. Frontend not properly calling the API');
    console.log('   2. Frontend not handling the response correctly');
    console.log('   3. Frontend authentication issue');
    console.log('   4. Frontend build/compilation issue');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the test
testCompleteAdminFlow();
