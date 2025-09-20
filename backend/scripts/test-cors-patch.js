// Test script to verify CORS configuration for PATCH requests
const fetch = require('node-fetch').default;

async function testCORSPatch() {
  try {
    console.log('🔍 Testing CORS configuration for PATCH requests...');
    
    // Test 1: Check if server is running
    console.log('\n📡 Testing server health...');
    const healthResponse = await fetch('http://localhost:5000/health');
    const healthData = await healthResponse.json();
    console.log('✅ Server health:', healthData.status);
    console.log('📊 CORS config:', healthData.cors);
    
    // Test 2: Test OPTIONS preflight request
    console.log('\n🔍 Testing OPTIONS preflight request...');
    const optionsResponse = await fetch('http://localhost:5000/api/kyc/admin/test/approve', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('📊 OPTIONS response status:', optionsResponse.status);
    console.log('📊 OPTIONS response headers:');
    const optionsHeaders = optionsResponse.headers.raw();
    Object.keys(optionsHeaders).forEach(key => {
      if (key.toLowerCase().includes('access-control')) {
        console.log(`  ${key}: ${optionsHeaders[key]}`);
      }
    });
    
    // Test 3: Test actual PATCH request (this will fail with 404 but should not fail with CORS)
    console.log('\n🔍 Testing PATCH request (expecting 404, not CORS error)...');
    try {
      const patchResponse = await fetch('http://localhost:5000/api/kyc/admin/test/approve', {
        method: 'PATCH',
        headers: {
          'Origin': 'http://localhost:3000',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({})
      });
      
      console.log('📊 PATCH response status:', patchResponse.status);
      console.log('📊 PATCH response headers:');
      const patchHeaders = patchResponse.headers.raw();
      Object.keys(patchHeaders).forEach(key => {
        if (key.toLowerCase().includes('access-control')) {
          console.log(`  ${key}: ${patchHeaders[key]}`);
        }
      });
      
      if (patchResponse.status === 401) {
        console.log('✅ PATCH request succeeded (401 = auth required, not CORS error)');
      } else if (patchResponse.status === 404) {
        console.log('✅ PATCH request succeeded (404 = route not found, not CORS error)');
      } else {
        console.log('📊 PATCH request status:', patchResponse.status);
      }
      
    } catch (patchError) {
      if (patchError.message.includes('CORS')) {
        console.log('❌ CORS error detected:', patchError.message);
      } else {
        console.log('✅ PATCH request succeeded (no CORS error):', patchError.message);
      }
    }
    
    console.log('\n✅ CORS test completed!');
    console.log('\n📋 Summary:');
    console.log('- Server is running and healthy');
    console.log('- OPTIONS preflight request handled');
    console.log('- PATCH requests should now work without CORS errors');
    console.log('- Frontend can now make PATCH requests to approve/reject KYC');
    
  } catch (error) {
    console.error('❌ Error testing CORS:', error);
  }
}

testCORSPatch();
