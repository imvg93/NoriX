// Test data script for Admin Panel
// Run this in your backend directory: node scripts/add-test-data.js

const mongoose = require('mongoose');
const User = require('../dist/models/User').default;
const Job = require('../dist/models/Job').default;
const EmployerKYC = require('../dist/models/EmployerKYC').default;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addTestData() {
  try {
    console.log('🚀 Adding test data...');

    // Create test employer users
    const testEmployers = [
      {
        name: 'John Smith',
        email: 'john@techcorp.com',
        password: '$2b$10$example', // This would be hashed in real scenario
        userType: 'employer',
        companyName: 'TechCorp Solutions',
        phone: '9876543212', // Indian phone number format
        address: '123 Tech Street, San Francisco',
        businessType: 'Tech Company',
        isActive: true,
        emailVerified: true,
        kycStatus: 'approved'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@innovate.com',
        password: '$2b$10$example',
        userType: 'employer',
        companyName: 'Innovate Labs',
        phone: '9876543213', // Indian phone number format
        address: '456 Innovation Ave, New York',
        businessType: 'Creative Agency',
        isActive: true,
        emailVerified: true,
        kycStatus: 'pending'
      }
    ];

    const createdEmployers = [];
    for (const employerData of testEmployers) {
      const existingEmployer = await User.findOne({ email: employerData.email });
      if (!existingEmployer) {
        const employer = new User(employerData);
        await employer.save();
        createdEmployers.push(employer);
        console.log(`✅ Created employer: ${employerData.name}`);
      } else {
        createdEmployers.push(existingEmployer);
        console.log(`ℹ️ Employer already exists: ${employerData.name}`);
      }
    }

    // Create test jobs
    const testJobs = [
      {
        employerId: createdEmployers[0]._id,
        jobTitle: 'Senior Full Stack Developer',
        description: 'We are looking for an experienced full-stack developer to join our team. You will work on cutting-edge web applications using React, Node.js, and MongoDB.',
        location: 'San Francisco, CA',
        salaryRange: '$80,000 - $120,000',
        workType: 'Full-time',
        skillsRequired: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        companyName: 'TechCorp Solutions',
        email: 'john@techcorp.com',
        phone: '9876543212',
        status: 'active',
        approvalStatus: 'approved',
        approvedBy: createdEmployers[0]._id,
        approvedAt: new Date()
      },
      {
        employerId: createdEmployers[1]._id,
        jobTitle: 'Frontend Developer Intern',
        description: 'Join our team as a frontend developer intern and gain hands-on experience with modern web technologies.',
        location: 'Remote',
        salaryRange: '$3,000 - $4,000/month',
        workType: 'Part-time',
        skillsRequired: ['React', 'JavaScript', 'CSS', 'HTML'],
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        companyName: 'Innovate Labs',
        email: 'sarah@innovate.com',
        phone: '9876543213',
        status: 'active',
        approvalStatus: 'pending'
      }
    ];

    for (const jobData of testJobs) {
      const existingJob = await Job.findOne({ 
        jobTitle: jobData.jobTitle, 
        employerId: jobData.employerId 
      });
      
      if (!existingJob) {
        const job = new Job(jobData);
        await job.save();
        console.log(`✅ Created job: ${jobData.jobTitle}`);
      } else {
        console.log(`ℹ️ Job already exists: ${jobData.jobTitle}`);
      }
    }

    // Create test employer KYC records
    const testKYC = [
      {
        employerId: createdEmployers[0]._id,
        companyName: 'TechCorp Solutions',
        companyEmail: 'john@techcorp.com',
        companyPhone: '9876543210',
        authorizedName: 'John Smith',
        designation: 'Owner',
        address: '123 Tech Street',
        city: 'San Francisco',
        latitude: '37.7749',
        longitude: '-122.4194',
        GSTNumber: '29ABCDE1234F1Z5',
        PAN: 'ABCDE1234F',
        documents: {
          gstCertificateUrl: 'https://example.com/gst-cert.pdf',
          panCardUrl: 'https://example.com/pan-card.pdf'
        },
        status: 'approved',
        submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        reviewedBy: createdEmployers[0]._id,
        reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        employerId: createdEmployers[1]._id,
        companyName: 'Innovate Labs',
        companyEmail: 'sarah@innovate.com',
        companyPhone: '9876543211',
        authorizedName: 'Sarah Johnson',
        designation: 'HR Manager',
        address: '456 Innovation Ave',
        city: 'New York',
        latitude: '40.7128',
        longitude: '-74.0060',
        GSTNumber: '29ABCDE1234F1Z5',
        PAN: 'FGHIJ5678K',
        documents: {
          gstCertificateUrl: 'https://example.com/gst-cert-2.pdf',
          panCardUrl: 'https://example.com/pan-card-2.pdf'
        },
        status: 'pending',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];

    for (const kycData of testKYC) {
      const existingKYC = await EmployerKYC.findOne({ employerId: kycData.employerId });
      
      if (!existingKYC) {
        const kyc = new EmployerKYC(kycData);
        await kyc.save();
        console.log(`✅ Created employer KYC: ${kycData.companyName}`);
      } else {
        console.log(`ℹ️ Employer KYC already exists: ${kycData.companyName}`);
      }
    }

    console.log('🎉 Test data added successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Employers: ${createdEmployers.length}`);
    console.log(`- Jobs: ${testJobs.length}`);
    console.log(`- Employer KYC: ${testKYC.length}`);

  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    mongoose.connection.close();
  }
}

addTestData();
