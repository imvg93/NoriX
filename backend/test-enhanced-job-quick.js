// Quick test for the enhanced job posting system
const API_BASE_URL = 'http://localhost:5000/api';

// Test data matching the new simplified form
const testJobData = {
  title: 'Test Warehouse Worker',
  description: 'Looking for hardworking individuals to join our warehouse team. Responsibilities include package sorting, inventory management, and maintaining warehouse cleanliness.',
  location: 'Hyderabad, Telangana',
  salary: '₹18,000/month',
  company: 'Test Company',
  businessType: 'Other',
  jobType: 'Other',
  pay: 18000,
  payType: 'monthly',
  timing: 'Flexible',
  positions: 1,
  requirements: 'Team Collaboration, Physical Fitness, Reliability',
  benefits: '',
  contactEmail: 'test@company.com',
  contactPhone: '+91 98765 43210',
  skills: ['Team Collaboration', 'Physical Fitness', 'Reliability'],
  workHours: 'Full-time',
  shiftType: 'Day',
  experience: 'Entry Level',
  education: 'Any',
  schedule: 'Full-time',
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};

async function testJobPosting() {
  try {
    console.log('🧪 Testing enhanced job posting...');
    console.log('📦 Test data:', testJobData);
    
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
    } else {
      console.log('❌ Job posting failed');
      console.log('📋 Error:', result);
    }
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testJobPosting();