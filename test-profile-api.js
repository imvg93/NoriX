const fetch = require('node-fetch');

// Test the profile API endpoint
async function testProfileAPI() {
  try {
    // You need to replace this with a valid token from your browser
    const token = 'YOUR_TOKEN_HERE';
    
    console.log('🔍 Testing /api/users/profile endpoint...');
    console.log('Token:', token ? 'Present' : 'Missing');
    
    const response = await fetch('http://localhost:5000/api/users/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📊 Response data:', JSON.stringify(data, null, 2));
    
    if (data.user) {
      console.log('✅ User found in response.user');
      console.log('User ID:', data.user._id);
      console.log('User email:', data.user.email);
      console.log('User KYC status:', data.user.kycStatus);
      console.log('User isVerified:', data.user.isVerified);
    } else if (data._id) {
      console.log('✅ User is the response itself');
      console.log('User ID:', data._id);
      console.log('User email:', data.email);
    } else {
      console.log('❌ Unexpected response structure');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error details:', error);
  }
}

console.log('');
console.log('='.repeat(60));
console.log('INSTRUCTIONS:');
console.log('1. Open your browser');
console.log('2. Login to the app');
console.log('3. Open DevTools (F12)');
console.log('4. Go to Application > Local Storage');
console.log('5. Copy the "token" value');
console.log('6. Replace YOUR_TOKEN_HERE in this file with your token');
console.log('7. Run: node test-profile-api.js');
console.log('='.repeat(60));
console.log('');

// Uncomment this line after adding your token
// testProfileAPI();

