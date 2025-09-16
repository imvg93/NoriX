const mongoose = require('mongoose');
const KYC = require('./dist/models/KYC').default;

async function checkKYCSubmissions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs');
    console.log('✅ Connected to MongoDB successfully!');

    console.log('🔍 Checking KYC submissions...');
    const kycs = await KYC.find({}).populate('userId', 'name email userType');
    
    console.log(`📊 Found ${kycs.length} KYC submissions:`);
    
    if (kycs.length === 0) {
      console.log('❌ No KYC submissions found in database');
    } else {
      kycs.forEach((kyc, i) => {
        console.log(`${i+1}. Student: ${kyc.userId?.name || 'Unknown'}`);
        console.log(`   Email: ${kyc.userId?.email || 'Unknown'}`);
        console.log(`   User Type: ${kyc.userId?.userType || 'Unknown'}`);
        console.log(`   Status: ${kyc.verificationStatus}`);
        console.log(`   Submitted: ${kyc.submittedAt}`);
        console.log(`   Full Name: ${kyc.fullName || 'Not set'}`);
        console.log(`   College: ${kyc.college || 'Not set'}`);
        console.log('   ---');
      });
    }

    // Also check if there are any users with KYC data
    const User = require('./dist/models/User').default;
    const usersWithKYC = await User.find({ kycStatus: { $exists: true } });
    console.log(`\n👥 Users with KYC status: ${usersWithKYC.length}`);
    usersWithKYC.forEach((user, i) => {
      console.log(`${i+1}. ${user.name} (${user.email}) - KYC Status: ${user.kycStatus || 'Not set'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkKYCSubmissions();
