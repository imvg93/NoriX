const http = require('http');

function testAdminLogin() {
  console.log('🧪 Testing admin login...');
  
  const postData = JSON.stringify({
    email: 'admin@studentjobs.com',
    password: 'admin123',
    userType: 'admin'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
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
          console.log('✅ Admin login successful!');
          console.log('🎯 Token:', response.token ? 'Present' : 'Missing');
          console.log('👤 User:', response.user ? response.user.name : 'Missing');
        } else {
          console.log('❌ Admin login failed!');
          console.log('❌ Error:', response.message || 'Unknown error');
        }
      } catch (error) {
        console.log('❌ Failed to parse response:', error.message);
        console.log('📊 Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
  });

  req.write(postData);
  req.end();
}

testAdminLogin();