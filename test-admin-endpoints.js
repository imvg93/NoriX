// Test script for admin endpoints
const https = require('https');
const http = require('http');

async function testAdminEndpoints() {
  const baseUrl = 'http://localhost:5000/api';
  
  console.log('🧪 Testing Admin Endpoints...\n');
  
  // Test endpoints that don't require authentication first
  const endpoints = [
    '/admin/dashboard-summary',
    '/admin/comprehensive-data',
    '/admin/users/all',
    '/admin/jobs/all',
    '/admin/applications/all',
    '/admin/kyc/all'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Note: These endpoints require admin authentication
          // We expect 401 Unauthorized without proper token
        }
      });
      
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        console.log('  ✅ Endpoint exists (requires authentication)');
      } else if (response.status === 200) {
        console.log('  ✅ Endpoint working');
        const data = await response.json();
        console.log(`  Data keys: ${Object.keys(data).join(', ')}`);
      } else {
        console.log(`  ❌ Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🏁 Testing complete!');
}

testAdminEndpoints().catch(console.error);

