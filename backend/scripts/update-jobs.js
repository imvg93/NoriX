// Update existing jobs to have proper approvalStatus
const mongoose = require('mongoose');
const Job = require('../dist/models/Job').default;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');

async function updateJobs() {
  try {
    console.log('🔄 Updating existing jobs...');
    
    // Update jobs that don't have approvalStatus field
    const result = await Job.updateMany(
      { approvalStatus: { $exists: false } },
      { 
        $set: { 
          approvalStatus: 'approved'
        } 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} jobs`);
    
    // Show all jobs
    const jobs = await Job.find({});
    console.log(`📊 Total jobs in database: ${jobs.length}`);
    
    jobs.forEach(job => {
      console.log(`- ${job.jobTitle || job.title} (Status: ${job.status}, Approval: ${job.approvalStatus})`);
    });
    
  } catch (error) {
    console.error('❌ Error updating jobs:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateJobs();