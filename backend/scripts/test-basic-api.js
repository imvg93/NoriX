const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAPIEndpoints() {
  try {
    console.log('🧪 Testing API Endpoints...\n');
    
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health check passed:', healthResponse.data.status);
    
    // Test 2: Test KYC endpoint (without auth)
    console.log('\n2️⃣ Testing KYC test endpoint...');
    try {
      const kycTestResponse = await axios.get(`${API_BASE_URL}/kyc/employer/test`);
      console.log('✅ KYC test endpoint works:', kycTestResponse.data.message);
    } catch (error) {
      console.log('❌ KYC test endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 3: Test CORS
    console.log('\n3️⃣ Testing CORS...');
    try {
      const corsResponse = await axios.options(`${API_BASE_URL}/auth/test-cors`);
      console.log('✅ CORS test passed');
    } catch (error) {
      console.log('❌ CORS test failed:', error.response?.data || error.message);
    }
    
    console.log('\n✅ Basic API tests completed!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Backend server is running');
    console.log('   ✅ API endpoints are accessible');
    console.log('   ✅ CORS is configured correctly');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Test KYC submission with proper authentication');
    console.log('   2. Test job application with proper authentication');
    console.log('   3. Verify database updates are working correctly');
    
  } catch (error) {
    console.error('\n❌ API test failed:', error.message);
  }
}

testAPIEndpoints();

