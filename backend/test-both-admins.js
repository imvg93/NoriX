const http = require('http');

function testLogin(email, password, userType) {
  console.log(`🧪 Testing login for: ${email}`);
  
  const postData = JSON.stringify({
    email: email,
    password: password,
    userType: userType
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
    console.log(`📊 Response Status for ${email}:`, res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`📊 Response for ${email}:`, JSON.stringify(response, null, 2));
        
        if (res.statusCode === 200) {
          console.log(`✅ ${email} login successful!`);
          console.log('🎯 Token:', response.token ? 'Present' : 'Missing');
          console.log('👤 User:', response.user ? response.user.name : 'Missing');
        } else {
          console.log(`❌ ${email} login failed!`);
          console.log('❌ Error:', response.message || 'Unknown error');
        }
      } catch (error) {
        console.log(`❌ Failed to parse response for ${email}:`, error.message);
        console.log('📊 Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`❌ Request failed for ${email}:`, error.message);
  });

  req.write(postData);
  req.end();
}

// Test both admin accounts
console.log('🔍 Testing both admin accounts...\n');

// Test 1: Default admin account
testLogin('admin@studentjobs.com', 'admin123456', 'admin');

// Wait a bit then test the second account
setTimeout(() => {
  console.log('\n' + '='.repeat(50) + '\n');
  testLogin('mework2003@gmail.com', 'admin1234', 'admin');
}, 2000);
