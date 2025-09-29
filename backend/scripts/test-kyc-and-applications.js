const mongoose = require('mongoose');
const User = require('../dist/models/User').default;
const EmployerKYC = require('../dist/models/EmployerKYC').default;
const Application = require('../dist/models/Application').default;
const Job = require('../dist/models/Job').default;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testKYCAndApplications() {
  try {
    console.log('🧪 Testing KYC and Application Fixes...\n');

    // Test 1: Check if KYC status updates correctly
    console.log('1️⃣ Testing KYC Status Updates...');
    
    // Find an employer user
    const employer = await User.findOne({ userType: 'employer' });
    if (!employer) {
      console.log('❌ No employer found for testing');
      return;
    }
    
    console.log(`📋 Testing with employer: ${employer.name} (${employer.email})`);
    console.log(`   Current KYC Status: ${employer.kycStatus}`);
    console.log(`   Is Verified: ${employer.isVerified}`);
    
    // Check EmployerKYC record
    const kycRecord = await EmployerKYC.findOne({ employerId: employer._id });
    if (kycRecord) {
      console.log(`   KYC Record Status: ${kycRecord.status}`);
      console.log(`   Submitted At: ${kycRecord.submittedAt}`);
    } else {
      console.log('   No KYC record found');
    }

    // Test 2: Check job application linkage
    console.log('\n2️⃣ Testing Job Application Linkage...');
    
    // Find a job
    const job = await Job.findOne({ status: 'active' });
    if (!job) {
      console.log('❌ No active job found for testing');
      return;
    }
    
    console.log(`📋 Testing with job: ${job.jobTitle} (${job._id})`);
    
    // Find applications for this job
    const applications = await Application.find({ jobId: job._id });
    console.log(`   Found ${applications.length} applications for this job`);
    
    applications.forEach((app, index) => {
      console.log(`   Application ${index + 1}:`);
      console.log(`     Job ID: ${app.jobId}`);
      console.log(`     Job Field: ${app.job}`);
      console.log(`     Student ID: ${app.studentId}`);
      console.log(`     Student Field: ${app.student}`);
      console.log(`     Status: ${app.status}`);
      console.log(`     Applied At: ${app.appliedAt}`);
      
      // Check if jobId and job field match
      if (app.jobId.toString() === app.job?.toString()) {
        console.log('     ✅ Job linkage is correct');
      } else {
        console.log('     ❌ Job linkage mismatch');
      }
      
      // Check if studentId and student field match
      if (app.studentId.toString() === app.student?.toString()) {
        console.log('     ✅ Student linkage is correct');
      } else {
        console.log('     ❌ Student linkage mismatch');
      }
    });

    // Test 3: Check database consistency
    console.log('\n3️⃣ Testing Database Consistency...');
    
    // Count total applications
    const totalApplications = await Application.countDocuments();
    console.log(`   Total applications in database: ${totalApplications}`);
    
    // Count applications with proper job linkage
    const applicationsWithJobLinkage = await Application.countDocuments({
      $expr: { $eq: ['$jobId', '$job'] }
    });
    console.log(`   Applications with correct job linkage: ${applicationsWithJobLinkage}`);
    
    // Count applications with proper student linkage
    const applicationsWithStudentLinkage = await Application.countDocuments({
      $expr: { $eq: ['$studentId', '$student'] }
    });
    console.log(`   Applications with correct student linkage: ${applicationsWithStudentLinkage}`);

    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testKYCAndApplications();

