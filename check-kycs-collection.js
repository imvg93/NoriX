const mongoose = require('mongoose');

async function checkKYCsCollection() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');
    console.log('✅ Connected to MongoDB successfully!');

    console.log('🔍 Checking kycs collection...');
    const db = mongoose.connection.db;
    const kycs = await db.collection('kycs').find({}).toArray();
    
    console.log(`📊 Found ${kycs.length} documents in kycs collection:`);
    
    if (kycs.length === 0) {
      console.log('❌ No KYC documents found in kycs collection');
    } else {
      kycs.forEach((kyc, i) => {
        console.log(`${i+1}. ID: ${kyc._id}`);
        console.log(`   User ID: ${kyc.userId}`);
        console.log(`   Status: ${kyc.verificationStatus}`);
        console.log(`   Full Name: ${kyc.fullName || 'Not set'}`);
        console.log(`   College: ${kyc.college || 'Not set'}`);
        console.log(`   Submitted: ${kyc.submittedAt || 'Not set'}`);
        console.log('   ---');
      });
    }

    // Also check users collection for any KYC-related data
    console.log('\n🔍 Checking users collection for KYC data...');
    const users = await db.collection('users').find({}).toArray();
    console.log(`📊 Found ${users.length} users:`);
     
    users.forEach((user, i) => {
      if (user.kycStatus || user.kycVerifiedAt || user.kycRejectedAt) {
        console.log(`${i+1}. ${user.name} (${user.email})`);
        console.log(`   KYC Status: ${user.kycStatus || 'Not set'}`);
        console.log(`   KYC Verified At: ${user.kycVerifiedAt || 'Not set'}`);
        console.log(`   KYC Rejected At: ${user.kycRejectedAt || 'Not set'}`);
        console.log('   ---');
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkKYCsCollection();
