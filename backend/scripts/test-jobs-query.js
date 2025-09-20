// Test jobs query
const mongoose = require('mongoose');
const Job = require('../dist/models/Job').default;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');

async function testJobsQuery() {
  try {
    console.log('🔍 Testing jobs query...');
    
    // Test the same query as the API
    const filter = { 
      status: 'active',
      approvalStatus: 'approved'
    };
    
    console.log('Filter:', filter);
    
    const jobs = await Job.find(filter);
    console.log(`📊 Jobs found: ${jobs.length}`);
    
    jobs.forEach((job, index) => {
      console.log(`\nJob ${index + 1}:`);
      console.log(`- jobTitle: ${job.jobTitle}`);
      console.log(`- status: ${job.status}`);
      console.log(`- approvalStatus: ${job.approvalStatus}`);
      console.log(`- companyName: ${job.companyName}`);
    });
    
    // Test without approvalStatus filter
    const allJobs = await Job.find({ status: 'active' });
    console.log(`\n📊 All active jobs: ${allJobs.length}`);
    
  } catch (error) {
    console.error('❌ Error testing jobs query:', error);
  } finally {
    mongoose.connection.close();
  }
}

testJobsQuery();
