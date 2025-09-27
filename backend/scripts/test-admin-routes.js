// Test script to verify all admin routes are working
const mongoose = require('mongoose');
const User = require('../dist/models/User').default;
const Job = require('../dist/models/Job').default;
const EmployerKYC = require('../dist/models/EmployerKYC').default;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');

async function testAdminRoutes() {
  try {
    console.log('🔍 Testing admin routes data availability...');

    // Test 1: Check if we have admin users
    const adminUsers = await User.find({ userType: 'admin' });
    console.log(`📊 Admin users found: ${adminUsers.length}`);

    // Test 2: Check if we have employer users
    const employerUsers = await User.find({ userType: 'employer' });
    console.log(`📊 Employer users found: ${employerUsers.length}`);

    // Test 3: Check if we have jobs
    const allJobs = await Job.find({});
    console.log(`📊 Total jobs found: ${allJobs.length}`);
    
    const activeJobs = await Job.find({ status: 'active' });
    console.log(`📊 Active jobs found: ${activeJobs.length}`);
    
    const approvedJobs = await Job.find({ approvalStatus: 'approved' });
    console.log(`📊 Approved jobs found: ${approvedJobs.length}`);

    // Test 4: Check if we have employer KYC records
    const allKYC = await EmployerKYC.find({});
    console.log(`📊 Total employer KYC records found: ${allKYC.length}`);
    
    const pendingKYC = await EmployerKYC.find({ status: 'pending' });
    console.log(`📊 Pending KYC records found: ${pendingKYC.length}`);
    
    const approvedKYC = await EmployerKYC.find({ status: 'approved' });
    console.log(`📊 Approved KYC records found: ${approvedKYC.length}`);

    // Test 5: Test the exact queries used by admin routes
    console.log('\n🔍 Testing admin route queries...');
    
    // Test jobs admin query
    const jobsAdminQuery = await Job.find({})
      .populate('employerId', 'name email companyName phone')
      .sort({ createdAt: -1 })
      .limit(10);
    console.log(`📊 Jobs admin query result: ${jobsAdminQuery.length} jobs`);
    
    // Test employer KYC admin query
    const kycAdminQuery = await EmployerKYC.find({})
      .populate('employerId', 'name email companyName phone')
      .populate('reviewedBy', 'name email')
      .sort({ submittedAt: -1 })
      .limit(10);
    console.log(`📊 Employer KYC admin query result: ${kycAdminQuery.length} records`);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Admin users: ${adminUsers.length}`);
    console.log(`- Employer users: ${employerUsers.length}`);
    console.log(`- Total jobs: ${allJobs.length} (${activeJobs.length} active, ${approvedJobs.length} approved)`);
    console.log(`- Total KYC records: ${allKYC.length} (${pendingKYC.length} pending, ${approvedKYC.length} approved)`);

  } catch (error) {
    console.error('❌ Error testing admin routes:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAdminRoutes();
