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

async function createTestData() {
  try {
    console.log('🧪 Creating Test Data for KYC and Applications...\n');

    // 1. Create a test employer KYC
    console.log('1️⃣ Creating test employer KYC...');
    
    const employer = await User.findOne({ userType: 'employer' });
    if (!employer) {
      console.log('❌ No employer found');
      return;
    }
    
    console.log(`📋 Creating KYC for employer: ${employer.name} (${employer._id})`);
    
    const kycData = {
      employerId: employer._id,
      companyName: 'Test Company Ltd',
      companyEmail: 'test@company.com',
      companyPhone: '9876543210',
      authorizedName: 'John Doe',
      designation: 'HR Manager',
      address: '123 Test Street',
      city: 'Test City',
      latitude: '12.9716',
      longitude: '77.5946',
      GSTNumber: '29ABCDE1234F1Z5',
      PAN: 'ABCDE1234F',
      status: 'pending',
      submittedAt: new Date()
    };
    
    const kycRecord = await EmployerKYC.findOneAndUpdate(
      { employerId: employer._id },
      { $set: kycData },
      { new: true, upsert: true }
    );
    
    console.log(`✅ KYC record created: ${kycRecord._id}`);
    console.log(`   Status: ${kycRecord.status}`);
    console.log(`   Company: ${kycRecord.companyName}`);
    
    // Update User model
    await User.findByIdAndUpdate(employer._id, {
      kycStatus: 'pending',
      isVerified: false,
      kycPendingAt: new Date(),
      $unset: { kycVerifiedAt: 1, kycRejectedAt: 1 }
    });
    
    console.log('✅ User KYC status updated to pending');

    // 2. Create a test job
    console.log('\n2️⃣ Creating test job...');
    
    const jobData = {
      jobTitle: 'Test Developer Position',
      description: 'A test job for development purposes',
      location: 'Test City',
      salaryRange: '₹50,000/month',
      workType: 'Full-time',
      skillsRequired: ['JavaScript', 'React', 'Node.js'],
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      employerId: employer._id,
      companyName: 'Test Company Ltd',
      status: 'active',
      approvalStatus: 'approved',
      approvedBy: employer._id,
      approvedAt: new Date()
    };
    
    const job = await Job.findOneAndUpdate(
      { employerId: employer._id },
      { $set: jobData },
      { new: true, upsert: true }
    );
    
    console.log(`✅ Job created: ${job._id}`);
    console.log(`   Title: ${job.jobTitle}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Approval Status: ${job.approvalStatus}`);

    // 3. Find an existing student
    console.log('\n3️⃣ Finding existing student...');
    
    const student = await User.findOne({ userType: 'student' });
    if (!student) {
      console.log('❌ No student found');
      return;
    }
    
    console.log(`✅ Using existing student: ${student._id}`);
    console.log(`   Name: ${student.name}`);
    console.log(`   Email: ${student.email}`);
    console.log(`   KYC Status: ${student.kycStatus}`);

    // 4. Create a test application
    console.log('\n4️⃣ Creating test application...');
    
    const applicationData = {
      jobId: job._id,
      job: job._id, // Ensure both fields are set
      studentId: student._id,
      student: student._id, // Ensure both fields are set
      employer: employer._id,
      coverLetter: 'I am interested in this test position and would like to apply.',
      expectedPay: 50000,
      availability: 'flexible',
      status: 'applied',
      appliedAt: new Date()
    };
    
    const application = await Application.findOneAndUpdate(
      { jobId: job._id, studentId: student._id },
      { $set: applicationData },
      { new: true, upsert: true }
    );
    
    console.log(`✅ Application created: ${application._id}`);
    console.log(`   Job ID: ${application.jobId}`);
    console.log(`   Job Field: ${application.job}`);
    console.log(`   Student ID: ${application.studentId}`);
    console.log(`   Student Field: ${application.student}`);
    console.log(`   Status: ${application.status}`);
    
    // Verify linkages
    if (application.jobId.toString() === application.job?.toString()) {
      console.log('   ✅ Job linkage is correct');
    } else {
      console.log('   ❌ Job linkage mismatch');
    }
    
    if (application.studentId.toString() === application.student?.toString()) {
      console.log('   ✅ Student linkage is correct');
    } else {
      console.log('   ❌ Student linkage mismatch');
    }

    console.log('\n✅ Test data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Employer: ${employer.name} (KYC: ${kycRecord.status})`);
    console.log(`   Job: ${job.jobTitle} (Status: ${job.status})`);
    console.log(`   Student: ${student.name} (KYC: ${student.kycStatus})`);
    console.log(`   Application: ${application._id} (Status: ${application.status})`);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestData();
