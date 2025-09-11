/**
 * Simple Cloudinary Debug Script
 * 
 * This script helps debug Cloudinary upload issues step by step.
 * 
 * Usage: node debug-cloudinary.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Cloudinary Debug Script');
console.log('========================\n');

// Step 1: Check if .env file exists
console.log('1. Checking .env file...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');
  
  // Read .env file and check for Cloudinary variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  const cloudinaryVars = {
    CLOUDINARY_CLOUD_NAME: false,
    CLOUDINARY_API_KEY: false,
    CLOUDINARY_API_SECRET: false
  };
  
  lines.forEach(line => {
    if (line.includes('CLOUDINARY_CLOUD_NAME=')) cloudinaryVars.CLOUDINARY_CLOUD_NAME = true;
    if (line.includes('CLOUDINARY_API_KEY=')) cloudinaryVars.CLOUDINARY_API_KEY = true;
    if (line.includes('CLOUDINARY_API_SECRET=')) cloudinaryVars.CLOUDINARY_API_SECRET = true;
  });
  
  console.log('   CLOUDINARY_CLOUD_NAME:', cloudinaryVars.CLOUDINARY_CLOUD_NAME ? '✅ Found' : '❌ Missing');
  console.log('   CLOUDINARY_API_KEY:', cloudinaryVars.CLOUDINARY_API_KEY ? '✅ Found' : '❌ Missing');
  console.log('   CLOUDINARY_API_SECRET:', cloudinaryVars.CLOUDINARY_API_SECRET ? '✅ Found' : '❌ Missing');
  
  if (!cloudinaryVars.CLOUDINARY_CLOUD_NAME || !cloudinaryVars.CLOUDINARY_API_KEY || !cloudinaryVars.CLOUDINARY_API_SECRET) {
    console.log('\n❌ Missing Cloudinary variables in .env file');
    console.log('   Add these lines to your .env file:');
    console.log('   CLOUDINARY_CLOUD_NAME=your-cloud-name');
    console.log('   CLOUDINARY_API_KEY=your-api-key');
    console.log('   CLOUDINARY_API_SECRET=your-api-secret');
  }
} else {
  console.log('❌ .env file not found');
  console.log('   Create a .env file in the backend directory with:');
  console.log('   CLOUDINARY_CLOUD_NAME=your-cloud-name');
  console.log('   CLOUDINARY_API_KEY=your-api-key');
  console.log('   CLOUDINARY_API_SECRET=your-api-secret');
}

// Step 2: Check uploads directory
console.log('\n2. Checking uploads directory...');
const uploadsPath = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsPath)) {
  console.log('✅ uploads directory exists');
} else {
  console.log('❌ uploads directory not found');
  console.log('   Creating uploads directory...');
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('✅ uploads directory created');
}

// Step 3: Check if server is running
console.log('\n3. Testing server connection...');
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/debug-upload/check',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.success) {
        console.log('✅ Server is running and responding');
        console.log('   Cloudinary configured:', response.data.is_configured ? '✅ Yes' : '❌ No');
      } else {
        console.log('❌ Server responded with error:', response.message);
      }
    } catch (error) {
      console.log('❌ Invalid response from server:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Cannot connect to server on localhost:5000');
  console.log('   Make sure your backend server is running');
  console.log('   Run: npm run dev or npm start');
});

req.end();

// Step 4: Instructions
console.log('\n4. Next Steps:');
console.log('   a) Make sure your backend server is running');
console.log('   b) Check the server console for Cloudinary credential logs');
console.log('   c) Test upload with: curl -X POST -F "image=@test-image.jpg" http://localhost:5000/api/debug-upload/test');
console.log('   d) Check server logs for detailed debugging information');

console.log('\n📋 Debug Checklist:');
console.log('   □ .env file exists with Cloudinary credentials');
console.log('   □ Server is running on localhost:5000');
console.log('   □ uploads directory exists');
console.log('   □ Cloudinary credentials are loaded (check server logs)');
console.log('   □ Test upload works with debug endpoint');
console.log('   □ KYC upload works with authentication');

console.log('\n🔍 Important Notes:');
console.log('   • Private uploads (type: "private") will NOT show in Cloudinary Media Library');
console.log('   • This is expected behavior for security');
console.log('   • Images are accessible via secure URLs only');
console.log('   • Check server console logs for detailed debugging info');
