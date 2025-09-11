const http = require('http');

function testKYCAPI() {
  console.log('🧪 Testing KYC API directly...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/kyc?status=all&page=1&limit=50',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
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
        
        if (res.statusCode === 200) {
          console.log('✅ API is working!');
          console.log('📋 KYC Submissions found:', response.data?.kycSubmissions?.length || 0);
        } else {
          console.log('❌ API Error:', response.message);
        }
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

testKYCAPI();
