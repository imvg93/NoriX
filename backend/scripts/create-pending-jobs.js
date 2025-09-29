// Create pending jobs for testing approval functionality
const mongoose = require('mongoose');
const User = require('../dist/models/User').default;
const Job = require('../dist/models/Job').default;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');

async function createPendingJobs() {
  try {
    console.log('🔍 Creating pending jobs for testing...');

    // Find employer users
    const employers = await User.find({ userType: 'employer' });
    console.log(`📊 Found ${employers.length} employer users`);

    if (employers.length === 0) {
      console.log('❌ No employer users found. Cannot create jobs.');
      return;
    }

    // Create some pending jobs
    const pendingJobs = [
      {
        employerId: employers[0]._id,
        jobTitle: 'Software Engineer - Pending Approval',
        description: 'We are looking for a skilled Software Engineer to join our team. This job is pending admin approval.',
        location: 'San Francisco, CA',
        salaryRange: '$80,000 - $120,000',
        workType: 'Full-time',
        skillsRequired: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        companyName: employers[0].companyName || 'Test Company 1',
        email: employers[0].email,
        phone: '9876543210',
        status: 'active',
        approvalStatus: 'pending' // This is the key - pending approval
      },
      {
        employerId: employers[1] ? employers[1]._id : employers[0]._id,
        jobTitle: 'Frontend Developer - Awaiting Review',
        description: 'Join our frontend team as a developer. This position requires admin approval.',
        location: 'Remote',
        salaryRange: '$60,000 - $90,000',
        workType: 'Part-time',
        skillsRequired: ['React', 'TypeScript', 'CSS', 'HTML'],
        applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        companyName: employers[1] ? (employers[1].companyName || 'Test Company 2') : 'Test Company 1',
        email: employers[1] ? employers[1].email : employers[0].email,
        phone: '9876543211',
        status: 'active',
        approvalStatus: 'pending' // This is the key - pending approval
      }
    ];

    const createdJobs = [];
    for (const jobData of pendingJobs) {
      // Check if job already exists
      const existingJob = await Job.findOne({ 
        employerId: jobData.employerId, 
        jobTitle: jobData.jobTitle 
      });
      
      if (!existingJob) {
        const newJob = new Job(jobData);
        await newJob.save();
        createdJobs.push(newJob);
        console.log(`✅ Created pending job: ${newJob.jobTitle}`);
      } else {
        // Update existing job to pending
        existingJob.approvalStatus = 'pending';
        existingJob.approvedBy = undefined;
        existingJob.approvedAt = undefined;
        existingJob.rejectionReason = undefined;
        existingJob.rejectedBy = undefined;
        existingJob.rejectedAt = undefined;
        await existingJob.save();
        createdJobs.push(existingJob);
        console.log(`🔄 Updated existing job to pending: ${existingJob.jobTitle}`);
      }
    }

    // Verify the jobs were created/updated
    const allPendingJobs = await Job.find({ approvalStatus: 'pending' });
    console.log(`\n📊 Total pending jobs now: ${allPendingJobs.length}`);
    
    allPendingJobs.forEach((job, index) => {
      console.log(`  ${index + 1}. ${job.jobTitle} - ${job.companyName} (ID: ${job._id})`);
    });

    console.log('\n✅ Pending jobs created/updated successfully!');
    console.log('🔧 You can now test the approval functionality in the admin panel.');

  } catch (error) {
    console.error('❌ Error creating pending jobs:', error);
  } finally {
    mongoose.connection.close();
  }
}

createPendingJobs();
