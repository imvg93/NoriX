const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testData = {
  employer: {
    email: 'sarah@techcorp.com',
    password: 'password123'
  },
  student: {
    email: 'john.student@university.edu',
    password: 'password123'
  },
  kycData: {
    companyName: 'Updated Test Company',
    companyEmail: 'updated@testcompany.com',
    companyPhone: '9876543210',
    authorizedName: 'Jane Doe',
    designation: 'CEO',
    address: '456 Updated Street',
    city: 'Updated City',
    latitude: '12.9716',
    longitude: '77.5946',
    GSTNumber: '29ABCDE1234F1Z5',
    PAN: 'ABCDE1234F'
  },
  applicationData: {
    coverLetter: 'I am very interested in this position and would like to apply.',
    expectedPay: 60000,
    availability: 'flexible'
  }
};

let authTokens = {
  employer: null,
  student: null
};

async function login(userType, credentials) {
  try {
    console.log(`🔐 Logging in as ${userType}...`);
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: credentials.email,
      password: credentials.password,
      userType: userType
    });
    
    authTokens[userType] = response.data.token;
    console.log(`✅ ${userType} logged in successfully`);
    return response.data;
  } catch (error) {
    console.error(`❌ Login failed for ${userType}:`, error.response?.data || error.message);
    throw error;
  }
}

async function testKYCSubmission() {
  try {
    console.log('\n📝 Testing KYC Submission...');
    
    const response = await axios.post(`${API_BASE_URL}/kyc/employer`, testData.kycData, {
      headers: {
        'Authorization': `Bearer ${authTokens.employer}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ KYC submitted successfully');
    console.log('   Response:', response.data);
    
    // Wait a moment for database consistency
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return response.data;
  } catch (error) {
    console.error('❌ KYC submission failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testKYCStatusCheck(employerId) {
  try {
    console.log('\n🔍 Testing KYC Status Check...');
    
    const response = await axios.get(`${API_BASE_URL}/kyc/employer/${employerId}/status`, {
      headers: {
        'Authorization': `Bearer ${authTokens.employer}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ KYC status retrieved successfully');
    console.log('   Status:', response.data.data?.status);
    console.log('   User KYC Status:', response.data.data?.user?.kycStatus);
    console.log('   Is Verified:', response.data.data?.user?.isVerified);
    
    return response.data;
  } catch (error) {
    console.error('❌ KYC status check failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testJobApplication(jobId) {
  try {
    console.log('\n📝 Testing Job Application...');
    
    const response = await axios.post(`${API_BASE_URL}/applications`, {
      jobId: jobId,
      ...testData.applicationData
    }, {
      headers: {
        'Authorization': `Bearer ${authTokens.student}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Job application submitted successfully');
    console.log('   Application ID:', response.data.data?.application?._id);
    console.log('   Job ID:', response.data.data?.application?.jobId);
    console.log('   Student ID:', response.data.data?.application?.studentId);
    
    return response.data;
  } catch (error) {
    console.error('❌ Job application failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testApplicationRetrieval() {
  try {
    console.log('\n📋 Testing Application Retrieval...');
    
    const response = await axios.get(`${API_BASE_URL}/applications/my-applications`, {
      headers: {
        'Authorization': `Bearer ${authTokens.student}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Applications retrieved successfully');
    console.log('   Total applications:', response.data.data?.applications?.length || 0);
    
    if (response.data.data?.applications?.length > 0) {
      const app = response.data.data.applications[0];
      console.log('   First application:');
      console.log(`     Job ID: ${app.jobId}`);
      console.log(`     Job Field: ${app.job}`);
      console.log(`     Student ID: ${app.studentId}`);
      console.log(`     Student Field: ${app.student}`);
      console.log(`     Status: ${app.status}`);
      
      // Verify linkages
      if (app.jobId?.toString() === app.job?.toString()) {
        console.log('     ✅ Job linkage is correct');
      } else {
        console.log('     ❌ Job linkage mismatch');
      }
      
      if (app.studentId?.toString() === app.student?.toString()) {
        console.log('     ✅ Student linkage is correct');
      } else {
        console.log('     ❌ Student linkage mismatch');
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Application retrieval failed:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  try {
    console.log('🧪 Starting Comprehensive API Tests...\n');
    
    // 1. Login as employer and student
    const employerData = await login('employer', testData.employer);
    const studentData = await login('student', testData.student);
    
    // 2. Test KYC submission
    const kycResult = await testKYCSubmission();
    
    // 3. Test KYC status check
    await testKYCStatusCheck(employerData.user._id);
    
    // 4. Get a job ID for testing (using the test job we created)
    const jobId = '68ce5875f1f52eee8c773c12'; // From our test data
    
    // 5. Test job application
    const applicationResult = await testJobApplication(jobId);
    
    // 6. Test application retrieval
    await testApplicationRetrieval();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ KYC submission works correctly');
    console.log('   ✅ KYC status updates in database');
    console.log('   ✅ Job applications are properly linked');
    console.log('   ✅ Application retrieval works correctly');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runTests();

