const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function showDetailedKYCDetails() {
  try {
    await connectDB();
    
    console.log('\n📋 DETAILED KYC DETAILS OF SUBMITTED STUDENTS\n');
    console.log('=' .repeat(70));
    
    // Get all KYC records with student details
    const kycCollection = mongoose.connection.db.collection('kycs');
    const usersCollection = mongoose.connection.db.collection('users');
    
    const kycRecords = await kycCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`📊 Total KYC Submissions: ${kycRecords.length}`);
    console.log('-'.repeat(50));
    
    for (let i = 0; i < kycRecords.length; i++) {
      const kyc = kycRecords[i];
      
      // Get student details
      const student = await usersCollection.findOne({ _id: kyc.userId });
      
      console.log(`\n${i + 1}. KYC SUBMISSION DETAILS:`);
      console.log('=' .repeat(50));
      
      console.log(`📋 KYC Information:`);
      console.log(`   🆔 KYC ID: ${kyc._id}`);
      console.log(`   👤 Student ID: ${kyc.userId}`);
      console.log(`   📊 Verification Status: ${kyc.verificationStatus || 'N/A'}`);
      console.log(`   📅 Submitted At: ${kyc.submittedAt || 'N/A'}`);
      console.log(`   📅 Last Updated: ${kyc.lastUpdated || 'N/A'}`);
      console.log(`   ✅ Active: ${kyc.isActive || 'N/A'}`);
      
      if (kyc.approvedAt) {
        console.log(`   ✅ Approved At: ${kyc.approvedAt}`);
        console.log(`   👨‍💼 Approved By: ${kyc.approvedBy}`);
      }
      
      console.log(`\n👤 Student Personal Information:`);
      console.log(`   📝 Full Name: ${kyc.fullName || 'N/A'}`);
      console.log(`   📧 Email: ${kyc.email || 'N/A'}`);
      console.log(`   📱 Phone: ${kyc.phone || 'N/A'}`);
      console.log(`   🎂 Date of Birth: ${kyc.dob || 'N/A'}`);
      console.log(`   ⚧ Gender: ${kyc.gender || 'N/A'}`);
      console.log(`   🩸 Blood Group: ${kyc.bloodGroup || 'N/A'}`);
      console.log(`   🏠 Address: ${kyc.address || 'N/A'}`);
      
      console.log(`\n🎓 Educational Information:`);
      console.log(`   🏫 College: ${kyc.college || 'N/A'}`);
      console.log(`   📚 Course Year: ${kyc.courseYear || 'N/A'}`);
      console.log(`   🏠 Stay Type: ${kyc.stayType || 'N/A'}`);
      
      console.log(`\n⏰ Availability Information:`);
      console.log(`   ⏱️ Hours Per Week: ${kyc.hoursPerWeek || 'N/A'}`);
      console.log(`   📅 Available Days: ${kyc.availableDays || 'N/A'}`);
      
      console.log(`\n💼 Job Preferences:`);
      console.log(`   🎯 Preferred Job Types: ${kyc.preferredJobTypes || 'N/A'}`);
      console.log(`   🛠️ Experience & Skills: ${kyc.experienceSkills || 'N/A'}`);
      
      console.log(`\n📄 Documents:`);
      console.log(`   🆔 Aadhar Card: ${kyc.aadharCard || 'Not uploaded'}`);
      console.log(`   🎓 College ID Card: ${kyc.collegeIdCard || 'Not uploaded'}`);
      
      if (kyc.emergencyContact) {
        console.log(`\n🚨 Emergency Contact:`);
        try {
          const emergencyContact = typeof kyc.emergencyContact === 'string' 
            ? JSON.parse(kyc.emergencyContact) 
            : kyc.emergencyContact;
          console.log(`   👤 Name: ${emergencyContact.name || 'N/A'}`);
          console.log(`   📱 Phone: ${emergencyContact.phone || 'N/A'}`);
          console.log(`   🔗 Relation: ${emergencyContact.relation || 'N/A'}`);
        } catch (e) {
          console.log(`   📄 Data: ${kyc.emergencyContact}`);
        }
      }
      
      if (kyc.payroll) {
        console.log(`\n💰 Payroll Information:`);
        try {
          const payroll = typeof kyc.payroll === 'string' 
            ? JSON.parse(kyc.payroll) 
            : kyc.payroll;
          console.log(`   🏦 Bank Name: ${payroll.bankName || 'N/A'}`);
          console.log(`   🏦 Account Number: ${payroll.accountNumber || 'N/A'}`);
          console.log(`   🏦 IFSC Code: ${payroll.ifscCode || 'N/A'}`);
          console.log(`   👤 Account Holder Name: ${payroll.accountHolderName || 'N/A'}`);
        } catch (e) {
          console.log(`   📄 Data: ${kyc.payroll}`);
        }
      }
      
      // Show student user details if available
      if (student) {
        console.log(`\n👤 Student User Account Details:`);
        console.log(`   📧 Email: ${student.email}`);
        console.log(`   📱 Phone: ${student.phone}`);
        console.log(`   🏫 College: ${student.college || 'N/A'}`);
        console.log(`   🛠️ Skills: ${student.skills ? student.skills.join(', ') : 'N/A'}`);
        console.log(`   ✅ Active: ${student.isActive}`);
        console.log(`   📧 Email Verified: ${student.emailVerified}`);
        console.log(`   📱 Phone Verified: ${student.phoneVerified}`);
        console.log(`   📋 Approval Status: ${student.approvalStatus}`);
        console.log(`   📅 Account Created: ${student.createdAt}`);
      }
      
      console.log('\n' + '=' .repeat(50));
    }
    
    // Show summary statistics
    console.log(`\n📊 KYC SUBMISSION SUMMARY:`);
    console.log('-'.repeat(50));
    
    const pendingCount = kycRecords.filter(kyc => kyc.verificationStatus === 'pending').length;
    const approvedCount = kycRecords.filter(kyc => kyc.verificationStatus === 'approved').length;
    const rejectedCount = kycRecords.filter(kyc => kyc.verificationStatus === 'rejected').length;
    
    console.log(`📋 Total Submissions: ${kycRecords.length}`);
    console.log(`⏳ Pending Review: ${pendingCount}`);
    console.log(`✅ Approved: ${approvedCount}`);
    console.log(`❌ Rejected: ${rejectedCount}`);
    
    // Show recent submissions
    const recentSubmissions = kycRecords.slice(0, 3);
    console.log(`\n🕒 Recent Submissions:`);
    recentSubmissions.forEach((kyc, index) => {
      console.log(`   ${index + 1}. ${kyc.fullName} - ${kyc.submittedAt} - ${kyc.verificationStatus}`);
    });
    
    console.log(`\n🔍 MongoDB Queries to Access KYC Data:`);
    console.log('-'.repeat(50));
    console.log(`1. Get all KYC records:`);
    console.log(`   db.kycs.find()`);
    console.log(`\n2. Get pending KYC records:`);
    console.log(`   db.kycs.find({verificationStatus: "pending"})`);
    console.log(`\n3. Get KYC with student details:`);
    console.log(`   db.kycs.aggregate([{$lookup: {from: "users", localField: "userId", foreignField: "_id", as: "student"}}])`);
    console.log(`\n4. Get KYC by student email:`);
    console.log(`   db.kycs.find({email: "student@test.com"})`);
    console.log(`\n5. Count KYC submissions:`);
    console.log(`   db.kycs.countDocuments()`);
    
    console.log(`\n🎉 KYC details retrieval completed!`);
    console.log('=' .repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the detailed KYC search
showDetailedKYCDetails();
