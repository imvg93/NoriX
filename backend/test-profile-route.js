// Quick test script to verify profile route is working
// Run this after restarting the backend: node backend/test-profile-route.js

const http = require('http');

const userId = process.argv[2] || '68c404496f51493759f43aac';
const token = process.argv[3] || '';

console.log('🧪 Testing Profile Route...');
console.log('📋 User ID:', userId);
console.log('📋 Token:', token ? 'Provided' : 'Not provided (will fail auth)');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: `/api/profile/${userId}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
};

const req = http.request(options, (res) => {
  console.log(`\n📡 Status Code: ${res.statusCode}`);
  console.log(`📡 Headers:`, res.headers);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\n✅ Response:', JSON.stringify(json, null, 2));
      
      if (res.statusCode === 404) {
        console.log('\n❌ Route not found! Backend server needs to be restarted.');
        console.log('💡 Stop the server (Ctrl+C) and restart with: npm run dev or npm start');
      } else if (res.statusCode === 401) {
        console.log('\n⚠️ Authentication required. Provide token as second argument.');
        console.log('💡 Usage: node test-profile-route.js <userId> <token>');
      } else if (res.statusCode === 200) {
        console.log('\n✅ Profile route is working correctly!');
      }
    } catch (e) {
      console.log('\n📄 Raw Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Error:', error.message);
  console.log('\n💡 Make sure backend server is running on port 5000');
});

req.end();

