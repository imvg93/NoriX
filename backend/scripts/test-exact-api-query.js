// Test the exact same query as the API
const mongoose = require('mongoose');
const Job = require('../dist/models/Job').default;
const User = require('../dist/models/User').default;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');

async function testExactAPIQuery() {
  try {
    console.log('🔍 Testing exact API query...');
    
    const filter = { 
      status: 'active',
      approvalStatus: 'approved'
    };
    
    console.log('Filter:', JSON.stringify(filter, null, 2));
    
    // Test the exact same query as the API
    const jobs = await Job.find(filter)
      .populate('employerId', 'name companyName businessType')
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(10);
    
    console.log(`📊 Jobs found: ${jobs.length}`);
    
    jobs.forEach((job, index) => {
      console.log(`\nJob ${index + 1}:`);
      console.log(`- _id: ${job._id}`);
      console.log(`- jobTitle: ${job.jobTitle}`);
      console.log(`- status: ${job.status}`);
      console.log(`- approvalStatus: ${job.approvalStatus}`);
      console.log(`- companyName: ${job.companyName}`);
      console.log(`- employerId: ${job.employerId}`);
      console.log(`- createdAt: ${job.createdAt}`);
    });
    
    // Test count
    const total = await Job.countDocuments(filter);
    console.log(`\n📊 Total count: ${total}`);
    
  } catch (error) {
    console.error('❌ Error testing API query:', error);
  } finally {
    mongoose.connection.close();
  }
}

testExactAPIQuery();
