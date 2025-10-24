// Test script to verify admin dashboard functionality
const fetch = require('node-fetch');

async function testAdminDashboard() {
  const baseUrl = 'http://localhost:5001/api';
  
  console.log('🧪 Testing Admin Dashboard Functionality...\n');
  
  try {
    // Step 1: Login as admin
    console.log('1️⃣ Logging in as super admin...');
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'mework2003@gmail.com',
        password: 'admin1234',
        userType: 'admin'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Test dashboard summary
    console.log('\n2️⃣ Testing dashboard summary...');
    const summaryResponse = await fetch(`${baseUrl}/admin/dashboard-summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      console.log('✅ Dashboard summary working');
      console.log('📊 Summary data:', JSON.stringify(summaryData.data, null, 2));
    } else {
      console.log(`❌ Dashboard summary failed: ${summaryResponse.status}`);
      const errorText = await summaryResponse.text();
      console.log('Error details:', errorText);
    }
    
    // Step 3: Test comprehensive data
    console.log('\n3️⃣ Testing comprehensive data...');
    const comprehensiveResponse = await fetch(`${baseUrl}/admin/comprehensive-data`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (comprehensiveResponse.ok) {
      const comprehensiveData = await comprehensiveResponse.json();
      console.log('✅ Comprehensive data working');
      console.log('📊 Data structure:', Object.keys(comprehensiveData.data));
    } else {
      console.log(`❌ Comprehensive data failed: ${comprehensiveResponse.status}`);
      const errorText = await comprehensiveResponse.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🏁 Testing complete!');
}

testAdminDashboard();

