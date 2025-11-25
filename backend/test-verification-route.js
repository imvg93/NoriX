// Simple test script to verify the verification route works
const http = require('http');

const testRoute = (path, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
};

// Test the routes
(async () => {
  console.log('🧪 Testing verification routes...\n');

  try {
    // Test 1: Test route (no auth)
    console.log('Test 1: GET /api/verification/test (no auth)');
    const test1 = await testRoute('/api/verification/test');
    console.log('Status:', test1.statusCode);
    console.log('Response:', test1.body);
    console.log('');

    // Test 2: Status route (no auth - should fail with 401)
    console.log('Test 2: GET /api/verification/status (no auth)');
    const test2 = await testRoute('/api/verification/status');
    console.log('Status:', test2.statusCode);
    console.log('Response:', test2.body);
    console.log('');

    console.log('✅ Tests completed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();



