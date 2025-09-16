/**
 * Test Script for KYC Document Upload
 * 
 * This script tests the complete KYC document upload flow:
 * 1. Test Cloudinary configuration
 * 2. Test direct Cloudinary upload
 * 3. Test KYC document upload with authentication
 * 
 * Usage: node test-kyc-upload.js
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
  // You'll need to provide these for testing
  authToken: 'YOUR_JWT_TOKEN_HERE', // Get this from login
  testImagePath: './test-image.jpg', // Path to a test image file
};

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🌐 Making request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.message || 'Request failed'}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
    throw error;
  }
}

async function testCloudinaryConfig() {
  console.log('\n🔍 Testing Cloudinary Configuration...');
  
  try {
    const response = await makeRequest('/test-upload/status');
    console.log('✅ Cloudinary Config Response:', response.data);
    
    if (response.data.is_configured) {
      console.log('✅ Cloudinary is properly configured');
      return true;
    } else {
      console.log('❌ Cloudinary configuration is incomplete');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to check Cloudinary config:', error.message);
    return false;
  }
}

async function testDirectCloudinaryUpload() {
  console.log('\n🔍 Testing Direct Cloudinary Upload...');
  
  // Check if test image exists
  if (!fs.existsSync(TEST_CONFIG.testImagePath)) {
    console.log('⚠️  Test image not found. Creating a simple test file...');
    // Create a simple test file (you can replace this with an actual image)
    fs.writeFileSync(TEST_CONFIG.testImagePath, 'test image content');
  }
  
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(TEST_CONFIG.testImagePath));
    
    const response = await makeRequest('/test-upload/cloudinary', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });
    
    console.log('✅ Direct Upload Response:', response.data);
    
    if (response.data.secure_url) {
      console.log('✅ Direct Cloudinary upload successful');
      console.log('📷 Image URL:', response.data.secure_url);
      return true;
    } else {
      console.log('❌ No secure_url in response');
      return false;
    }
  } catch (error) {
    console.error('❌ Direct upload failed:', error.message);
    return false;
  }
}

async function testKYCDocumentUpload() {
  console.log('\n🔍 Testing KYC Document Upload...');
  
  if (!fs.existsSync(TEST_CONFIG.testImagePath)) {
    console.log('⚠️  Test image not found. Skipping KYC upload test.');
    return false;
  }
  
  try {
    // Test Aadhaar upload
    console.log('📄 Testing Aadhaar card upload...');
    const aadharFormData = new FormData();
    aadharFormData.append('document', fs.createReadStream(TEST_CONFIG.testImagePath));
    aadharFormData.append('documentType', 'aadhar');
    
    const aadharResponse = await makeRequest('/kyc/upload-document', {
      method: 'POST',
      body: aadharFormData,
      headers: aadharFormData.getHeaders(),
    });
    
    console.log('✅ Aadhaar Upload Response:', aadharResponse.data);
    
    if (aadharResponse.data.data.documentUrl) {
      console.log('✅ Aadhaar card uploaded successfully');
      console.log('📷 Aadhaar URL:', aadharResponse.data.data.documentUrl);
    } else {
      console.log('❌ No documentUrl in Aadhaar response');
      return false;
    }
    
    // Test College ID upload
    console.log('📄 Testing College ID upload...');
    const collegeFormData = new FormData();
    collegeFormData.append('document', fs.createReadStream(TEST_CONFIG.testImagePath));
    collegeFormData.append('documentType', 'college-id');
    
    const collegeResponse = await makeRequest('/kyc/upload-document', {
      method: 'POST',
      body: collegeFormData,
      headers: collegeFormData.getHeaders(),
    });
    
    console.log('✅ College ID Upload Response:', collegeResponse.data);
    
    if (collegeResponse.data.data.documentUrl) {
      console.log('✅ College ID uploaded successfully');
      console.log('📷 College ID URL:', collegeResponse.data.data.documentUrl);
    } else {
      console.log('❌ No documentUrl in College ID response');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ KYC upload failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting KYC Document Upload Tests...\n');
  
  const results = {
    cloudinaryConfig: false,
    directUpload: false,
    kycUpload: false,
  };
  
  // Test 1: Cloudinary Configuration
  results.cloudinaryConfig = await testCloudinaryConfig();
  
  // Test 2: Direct Cloudinary Upload
  if (results.cloudinaryConfig) {
    results.directUpload = await testDirectCloudinaryUpload();
  }
  
  // Test 3: KYC Document Upload
  if (results.directUpload) {
    results.kycUpload = await testKYCDocumentUpload();
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Cloudinary Config: ${results.cloudinaryConfig ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Direct Upload: ${results.directUpload ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`KYC Upload: ${results.kycUpload ? '✅ PASS' : '❌ FAIL'}`);
  
  if (results.cloudinaryConfig && results.directUpload && results.kycUpload) {
    console.log('\n🎉 All tests passed! KYC document upload is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration and try again.');
  }
  
  // Cleanup
  if (fs.existsSync(TEST_CONFIG.testImagePath)) {
    fs.unlinkSync(TEST_CONFIG.testImagePath);
    console.log('🧹 Cleaned up test files.');
  }
}

// Instructions for running the test
console.log(`
📋 KYC Upload Test Instructions:
===============================

1. Make sure your backend server is running on http://localhost:5000
2. Set up your Cloudinary environment variables:
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY  
   - CLOUDINARY_API_SECRET

3. Get a JWT token by logging in through your frontend or API
4. Update the TEST_CONFIG.authToken in this file
5. Run: node test-kyc-upload.js

Or run individual tests:
- node -e "require('./test-kyc-upload.js').testCloudinaryConfig()"
- node -e "require('./test-kyc-upload.js').testDirectCloudinaryUpload()"
- node -e "require('./test-kyc-upload.js').testKYCDocumentUpload()"
`);

// Export functions for individual testing
module.exports = {
  testCloudinaryConfig,
  testDirectCloudinaryUpload,
  testKYCDocumentUpload,
  runAllTests,
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
