const http = require('http');

function testAdminKYCAPI() {
  console.log('🧪 Testing Admin KYC API...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/kyc',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token' // We'll need a real token
    }
  };

  const req = http.request(options, (res) => {
    console.log('📊 Response Status:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('📊 Response Data:', JSON.stringify(response, null, 2));
      } catch (error) {
        console.log('📊 Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
  });

  req.end();
}

testAdminKYCAPI();