// Check job documents in database
const mongoose = require('mongoose');
const Job = require('../dist/models/Job').default;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');

async function checkJobs() {
  try {
    console.log('🔍 Checking jobs in database...');
    
    const jobs = await Job.find({});
    console.log(`📊 Total jobs: ${jobs.length}`);
    
    jobs.forEach((job, index) => {
      console.log(`\nJob ${index + 1}:`);
      console.log(`- _id: ${job._id}`);
      console.log(`- jobTitle: ${job.jobTitle}`);
      console.log(`- status: ${job.status}`);
      console.log(`- approvalStatus: ${job.approvalStatus}`);
      console.log(`- companyName: ${job.companyName}`);
      console.log(`- All fields:`, Object.keys(job.toObject()));
    });
    
  } catch (error) {
    console.error('❌ Error checking jobs:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkJobs();
