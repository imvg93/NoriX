const fetch = require('node-fetch');

async function testLogin() {
  console.log('🔐 Testing login...\n');

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'sarah@techcorp.com',
        password: 'password123',
        userType: 'employer'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const data = await response.text();
    console.log('Response body:', data);

    if (response.ok) {
      const jsonData = JSON.parse(data);
      console.log('✅ Login successful:', jsonData);
    } else {
      console.log('❌ Login failed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLogin();