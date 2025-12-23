import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/norix';

async function fixUserRole() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const email = 'webresfolio@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      await mongoose.disconnect();
      return;
    }

    console.log(`📋 Found user: ${user.name} (${user.email})`);
    console.log(`📋 Current role: ${user.role}`);
    console.log(`📋 Current userType: ${user.userType}`);

    // Determine role based on userType or set default
    let newRole: 'student' | 'individual' | 'corporate' | 'local' | 'admin' = 'student';
    let newUserType: 'student' | 'employer' | 'admin' = 'student';

    if (user.userType === 'employer') {
      // If employer, check if they have companyName to determine role
      if (user.companyName) {
        newRole = 'corporate';
        newUserType = 'employer';
      } else {
        newRole = 'individual';
        newUserType = 'employer';
      }
    } else if (user.userType === 'admin') {
      newRole = 'admin';
      newUserType = 'admin';
    } else {
      // Default to student
      newRole = 'student';
      newUserType = 'student';
    }

    // Update user role and userType
    user.role = newRole;
    if (!user.userType) {
      user.userType = newUserType;
    }

    // Ensure isActive is true
    if (user.isActive === undefined || user.isActive === false) {
      user.isActive = true;
    }

    // Ensure emailVerified is true
    if (user.emailVerified === undefined || user.emailVerified === false) {
      user.emailVerified = true;
    }

    await user.save();

    console.log(`✅ Updated user role to: ${user.role}`);
    console.log(`✅ Updated userType to: ${user.userType}`);
    console.log(`✅ User isActive: ${user.isActive}`);
    console.log(`✅ User emailVerified: ${user.emailVerified}`);
    console.log(`✅ User can now login!`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error fixing user role:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
fixUserRole();

