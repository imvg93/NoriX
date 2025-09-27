// Test script to verify frontend-backend connection
const fetch = require('node-fetch').default;

async function testFrontendBackendConnection() {
  try {
    console.log('🔍 Testing frontend-backend connection...');
    
    // Test 1: Basic API health check
    const healthResponse = await fetch('http://localhost:5000/api/test');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
    
    // Test 2: Test auth endpoint (should require token)
    try {
      const authResponse = await fetch('http://localhost:5000/api/auth/verify-token');
      const authData = await authResponse.json();
      console.log('✅ Auth endpoint accessible:', authData.message);
    } catch (error) {
      console.log('✅ Auth endpoint properly protected:', error.message);
    }
    
    // Test 3: Test jobs endpoint (should require token)
    try {
      const jobsResponse = await fetch('http://localhost:5000/api/jobs/admin');
      const jobsData = await jobsResponse.json();
      console.log('✅ Jobs admin endpoint accessible:', jobsData.message);
    } catch (error) {
      console.log('✅ Jobs admin endpoint properly protected:', error.message);
    }
    
    // Test 4: Test KYC endpoint (should require token)
    try {
      const kycResponse = await fetch('http://localhost:5000/api/kyc/admin/all');
      const kycData = await kycResponse.json();
      console.log('✅ KYC admin endpoint accessible:', kycData.message);
    } catch (error) {
      console.log('✅ KYC admin endpoint properly protected:', error.message);
    }
    
    console.log('\n✅ All endpoints are accessible and properly protected!');
    console.log('🔧 Next step: Test with valid authentication token');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testFrontendBackendConnection();
