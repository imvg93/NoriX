// Simple script to count jobs in database
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

// Define a simple Job schema for counting
const jobSchema = new mongoose.Schema({}, { strict: false, collection: 'jobs' });
const Job = mongoose.model('Job', jobSchema);

async function countJobs() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB!\n');

    // Count all jobs
    const totalJobs = await Job.countDocuments({});
    console.log(`📊 TOTAL JOBS IN DATABASE: ${totalJobs}\n`);

    // Count by status
    const activeJobs = await Job.countDocuments({ status: 'active' });
    const approvedJobs = await Job.countDocuments({ approvalStatus: 'approved' });
    const pendingJobs = await Job.countDocuments({ approvalStatus: 'pending' });
    
    // Count jobs that should appear on /jobs page (active AND approved)
    const activeAndApproved = await Job.countDocuments({ 
      status: 'active', 
      approvalStatus: 'approved' 
    });

    console.log('📈 Breakdown:');
    console.log(`  - Total jobs: ${totalJobs}`);
    console.log(`  - Active jobs: ${activeJobs}`);
    console.log(`  - Approved jobs: ${approvedJobs}`);
    console.log(`  - Pending approval: ${pendingJobs}`);
    console.log(`  - Active + Approved (should show on /jobs page): ${activeAndApproved}\n`);

    // Show sample of jobs that should appear
    if (activeAndApproved > 0) {
      const sampleJobs = await Job.find({ 
        status: 'active', 
        approvalStatus: 'approved' 
      }).select('jobTitle companyName status approvalStatus').limit(20);
      
      console.log('📋 Sample jobs (first 20 that should appear on /jobs page):');
      sampleJobs.forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.jobTitle || 'N/A'} - ${job.companyName || 'N/A'} (Status: ${job.status}, Approval: ${job.approvalStatus})`);
      });
    }

    // Show jobs that are active but not approved
    const activeButNotApproved = await Job.countDocuments({ 
      status: 'active', 
      approvalStatus: { $ne: 'approved' } 
    });
    
    if (activeButNotApproved > 0) {
      console.log(`\n⚠️  Active jobs NOT approved: ${activeButNotApproved}`);
      const notApproved = await Job.find({ 
        status: 'active', 
        approvalStatus: { $ne: 'approved' } 
      }).select('jobTitle companyName status approvalStatus').limit(10);
      
      notApproved.forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.jobTitle || 'N/A'} - ${job.companyName || 'N/A'} (Status: ${job.status}, Approval: ${job.approvalStatus || 'null'})`);
      });
    }

  } catch (error) {
    console.error('❌ Error counting jobs:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

countJobs();

