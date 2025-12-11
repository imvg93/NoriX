const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function fixUserKYCStatus(email) {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log(`🔍 Checking KYC status for user: ${email}`);

    // Get models
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const KYC = mongoose.model('KYC', new mongoose.Schema({}, { strict: false }));

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      await mongoose.connection.close();
      return;
    }

    console.log(`\n📋 User found:`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   User Type: ${user.userType}`);
    console.log(`   Current kycStatus: ${user.kycStatus || 'not set'}`);
    console.log(`   Current isVerified: ${user.isVerified || false}`);

    // Find KYC record
    const kyc = await KYC.findOne({ userId: user._id, isActive: true });
    
    if (!kyc) {
      console.log(`\n⚠️ No active KYC record found for this user`);
      console.log(`   Updating user to 'not-submitted' status`);
      
      await User.findByIdAndUpdate(user._id, {
        kycStatus: 'not-submitted',
        isVerified: false,
        kycVerifiedAt: null,
        kycRejectedAt: null,
        kycPendingAt: null
      });
      
      console.log(`   ✅ User updated to 'not-submitted'`);
      await mongoose.connection.close();
      return;
    }

    console.log(`\n📋 KYC Record found:`);
    console.log(`   KYC ID: ${kyc._id}`);
    console.log(`   Full Name: ${kyc.fullName || 'N/A'}`);
    console.log(`   Verification Status: ${kyc.verificationStatus || 'not set'}`);
    console.log(`   Submitted At: ${kyc.submittedAt || 'N/A'}`);
    console.log(`   Approved At: ${kyc.approvedAt || 'N/A'}`);
    console.log(`   Rejected At: ${kyc.rejectedAt || 'N/A'}`);

    // Determine canonical status from KYC
    const canonicalStatus = kyc.verificationStatus || 'not_submitted';
    const canonicalIsVerified = canonicalStatus === 'approved';
    
    // Check current user status
    const userKycStatus = user.kycStatus || 'not_submitted';
    const userIsVerified = user.isVerified || false;

    console.log(`\n🔍 Status Comparison:`);
    console.log(`   KYC Collection Status: ${canonicalStatus}`);
    console.log(`   User Collection Status: ${userKycStatus}`);
    console.log(`   KYC isVerified: ${canonicalIsVerified}`);
    console.log(`   User isVerified: ${userIsVerified}`);

    const isConsistent = (
      userKycStatus === canonicalStatus &&
      userIsVerified === canonicalIsVerified
    );

    if (isConsistent) {
      console.log(`\n✅ Status is already consistent!`);
      console.log(`   Both collections show: ${canonicalStatus}`);
    } else {
      console.log(`\n🔧 Status mismatch detected! Fixing...`);
      
      // Prepare update data
      const updateData = {
        kycStatus: canonicalStatus,
        isVerified: canonicalIsVerified
      };

      // Set appropriate timestamps
      if (canonicalStatus === 'approved') {
        updateData.kycVerifiedAt = kyc.approvedAt || new Date();
        updateData.kycRejectedAt = null;
        updateData.kycPendingAt = null;
      } else if (canonicalStatus === 'rejected') {
        updateData.kycRejectedAt = kyc.rejectedAt || new Date();
        updateData.kycVerifiedAt = null;
        updateData.kycPendingAt = null;
      } else if (canonicalStatus === 'pending') {
        updateData.kycPendingAt = kyc.submittedAt || new Date();
        updateData.kycVerifiedAt = null;
        updateData.kycRejectedAt = null;
      } else {
        updateData.kycVerifiedAt = null;
        updateData.kycRejectedAt = null;
        updateData.kycPendingAt = null;
      }

      // Update user record
      await User.findByIdAndUpdate(user._id, updateData);

      console.log(`\n✅ User profile updated successfully!`);
      console.log(`   New kycStatus: ${canonicalStatus}`);
      console.log(`   New isVerified: ${canonicalIsVerified}`);
      
      // Verify the update
      const updatedUser = await User.findById(user._id);
      console.log(`\n🔍 Verification:`);
      console.log(`   Updated kycStatus: ${updatedUser.kycStatus}`);
      console.log(`   Updated isVerified: ${updatedUser.isVerified}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node fixUserKYCStatus.js <email>');
  process.exit(1);
}

// Run the fix
fixUserKYCStatus(email).catch(console.error);

