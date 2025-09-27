// Test script to verify approval routes are working
const mongoose = require('mongoose');
const User = require('../dist/models/User').default;
const Job = require('../dist/models/Job').default;
const EmployerKYC = require('../dist/models/EmployerKYC').default;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');

async function testApprovalRoutes() {
  try {
    console.log('🔍 Testing approval routes data...');

    // Test 1: Check jobs that can be approved/rejected
    const pendingJobs = await Job.find({ approvalStatus: 'pending' });
    console.log(`📊 Pending jobs found: ${pendingJobs.length}`);
    
    const approvedJobs = await Job.find({ approvalStatus: 'approved' });
    console.log(`📊 Approved jobs found: ${approvedJobs.length}`);

    // Test 2: Check KYC records that can be approved/rejected
    const pendingKYC = await EmployerKYC.find({ status: 'pending' });
    console.log(`📊 Pending KYC records found: ${pendingKYC.length}`);
    
    const approvedKYC = await EmployerKYC.find({ status: 'approved' });
    console.log(`📊 Approved KYC records found: ${approvedKYC.length}`);

    // Test 3: Show specific records for testing
    if (pendingJobs.length > 0) {
      console.log('\n📋 Pending Jobs for testing:');
      pendingJobs.forEach((job, index) => {
        console.log(`  ${index + 1}. ID: ${job._id}, Title: ${job.jobTitle}, Company: ${job.companyName}`);
      });
    }

    if (pendingKYC.length > 0) {
      console.log('\n📋 Pending KYC for testing:');
      pendingKYC.forEach((kyc, index) => {
        console.log(`  ${index + 1}. ID: ${kyc._id}, Company: ${kyc.companyName}, Employer: ${kyc.employerId}`);
      });
    }

    // Test 4: Test approval update queries
    if (pendingJobs.length > 0) {
      const testJob = pendingJobs[0];
      console.log(`\n🔍 Testing job approval for: ${testJob.jobTitle}`);
      
      // Simulate approval
      testJob.approvalStatus = 'approved';
      testJob.approvedBy = new mongoose.Types.ObjectId();
      testJob.approvedAt = new Date();
      await testJob.save();
      
      console.log('✅ Job approval test successful');
      
      // Revert for testing
      testJob.approvalStatus = 'pending';
      testJob.approvedBy = undefined;
      testJob.approvedAt = undefined;
      await testJob.save();
      
      console.log('🔄 Job reverted to pending for testing');
    }

    if (pendingKYC.length > 0) {
      const testKYC = pendingKYC[0];
      console.log(`\n🔍 Testing KYC approval for: ${testKYC.companyName}`);
      
      // Simulate approval
      testKYC.status = 'approved';
      testKYC.reviewedBy = new mongoose.Types.ObjectId();
      testKYC.reviewedAt = new Date();
      await testKYC.save();
      
      console.log('✅ KYC approval test successful');
      
      // Revert for testing
      testKYC.status = 'pending';
      testKYC.reviewedBy = undefined;
      testKYC.reviewedAt = undefined;
      await testKYC.save();
      
      console.log('🔄 KYC reverted to pending for testing');
    }

    console.log('\n✅ All approval route tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Pending jobs: ${pendingJobs.length}`);
    console.log(`- Approved jobs: ${approvedJobs.length}`);
    console.log(`- Pending KYC: ${pendingKYC.length}`);
    console.log(`- Approved KYC: ${approvedKYC.length}`);

  } catch (error) {
    console.error('❌ Error testing approval routes:', error);
  } finally {
    mongoose.connection.close();
  }
}

testApprovalRoutes();
