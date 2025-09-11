const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { KYC } = require('./dist/models/KYC');
const { User } = require('./dist/models/User');

async function testKYCData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studenting');
    console.log('✅ Connected to MongoDB');

    console.log('📊 Checking KYC submissions...');
    
    // Get all KYC submissions
    const allKYC = await KYC.find({}).populate('userId', 'name email userType');
    console.log(`📈 Total KYC submissions: ${allKYC.length}`);
    
    if (allKYC.length > 0) {
      console.log('\n📋 KYC Submissions:');
      allKYC.forEach((kyc, index) => {
        console.log(`\n${index + 1}. ${kyc.fullName || 'N/A'}`);
        console.log(`   Email: ${kyc.email || 'N/A'}`);
        console.log(`   College: ${kyc.college || 'N/A'}`);
        console.log(`   Status: ${kyc.verificationStatus || 'N/A'}`);
        console.log(`   Submitted: ${kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString() : 'N/A'}`);
        console.log(`   User ID: ${kyc.userId?._id || 'N/A'}`);
        console.log(`   User Name: ${kyc.userId?.name || 'N/A'}`);
        console.log(`   User Type: ${kyc.userId?.userType || 'N/A'}`);
      });
    } else {
      console.log('❌ No KYC submissions found in database');
    }

    // Get KYC stats
    const stats = {
      total: await KYC.countDocuments({}),
      pending: await KYC.countDocuments({ verificationStatus: 'pending' }),
      approved: await KYC.countDocuments({ verificationStatus: 'approved' }),
      rejected: await KYC.countDocuments({ verificationStatus: 'rejected' })
    };
    
    console.log('\n📊 KYC Statistics:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Pending: ${stats.pending}`);
    console.log(`   Approved: ${stats.approved}`);
    console.log(`   Rejected: ${stats.rejected}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testKYCData();
