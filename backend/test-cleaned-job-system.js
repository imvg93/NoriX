// Test script for the cleaned up job posting system with only essential fields
const API_BASE_URL = 'http://localhost:5000/api';

// Test data with only essential fields
const testJobData = {
  jobTitle: 'Test Warehouse Worker',
  description: 'Looking for hardworking individuals to join our warehouse team. Responsibilities include package sorting, inventory management, and maintaining warehouse cleanliness.',
  location: 'Hyderabad, Telangana',
  salaryRange: '₹18,000/month',
  workType: 'Full-time',
  skillsRequired: ['Team Collaboration', 'Physical Fitness', 'Reliability'],
  applicationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};

async function testCleanedJobPosting() {
  try {
    console.log('🧪 Testing cleaned up job posting system...');
    console.log('📦 Test data (essential fields only):', testJobData);
    
    const response = await fetch(`${API_BASE_URL}/enhanced-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, this would include Authorization header with JWT token
        // 'Authorization': 'Bearer <jwt-token>'
      },
      body: JSON.stringify(testJobData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Job posting successful!');
      console.log('📋 Response:', result);
      console.log('🎯 Job created with only essential fields');
      console.log('✨ System is cleaned up and working correctly');
    } else {
      console.log('❌ Job posting failed');
      console.log('📋 Error:', result);
    }
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testCleanedJobPosting();
