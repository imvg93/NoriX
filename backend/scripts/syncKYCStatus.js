const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function syncKYCStatus() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('🔍 Checking KYC status synchronization...');

    // Get all users with KYC status
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const KYC = mongoose.model('KYC', new mongoose.Schema({}, { strict: false }));

    const users = await User.find({ 
      userType: 'student',
      $or: [
        { kycStatus: { $exists: true } },
        { isVerified: { $exists: true } }
      ]
    });

    console.log(`📊 Found ${users.length} students with KYC data`);

    let fixedCount = 0;
    let issuesFound = 0;

    for (const user of users) {
      // Get KYC record for this user
      const kyc = await KYC.findOne({ userId: user._id, isActive: true });
      
      // Determine canonical status
      let canonicalStatus = 'not_submitted';
      let canonicalIsVerified = false;
      
      if (kyc) {
        canonicalStatus = kyc.verificationStatus || 'not_submitted';
        canonicalIsVerified = canonicalStatus === 'approved';
      }
      
      // Check for inconsistencies
      const userKycStatus = user.kycStatus || 'not_submitted';
      const userIsVerified = user.isVerified || false;
      
      const isConsistent = (
        userKycStatus === canonicalStatus &&
        userIsVerified === canonicalIsVerified
      );

      if (!isConsistent) {
        issuesFound++;
        console.log(`\n🔧 Fixing inconsistency for user: ${user.email}`);
        console.log(`   Current: kycStatus=${userKycStatus}, isVerified=${userIsVerified}`);
        console.log(`   Should be: kycStatus=${canonicalStatus}, isVerified=${canonicalIsVerified}`);
        
        // Update user record to match canonical status
        await User.findByIdAndUpdate(user._id, {
          kycStatus: canonicalStatus,
          isVerified: canonicalIsVerified,
          ...(canonicalStatus === 'approved' && { kycVerifiedAt: kyc?.approvedAt }),
          ...(canonicalStatus === 'rejected' && { kycRejectedAt: kyc?.rejectedAt }),
          ...(canonicalStatus === 'pending' && { kycPendingAt: kyc?.submittedAt })
        });
        
        fixedCount++;
        console.log(`   ✅ Fixed`);
      } else {
        console.log(`✅ User ${user.email} is consistent`);
      }
    }

    console.log('\n📊 Sync Results:');
    console.log(`   - Users checked: ${users.length}`);
    console.log(`   - Issues found: ${issuesFound}`);
    console.log(`   - Issues fixed: ${fixedCount}`);

    if (issuesFound === 0) {
      console.log('🎉 All KYC statuses are synchronized!');
    } else {
      console.log(`🔧 Fixed ${fixedCount} synchronization issues`);
    }

  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the sync
syncKYCStatus().catch(console.error);