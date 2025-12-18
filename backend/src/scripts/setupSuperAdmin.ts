/**
 * Setup Super Admin Script
 * Creates or updates the super admin user (mework2003@gmail.com) with all role capabilities
 */

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database';
import User from '../models/User';
import bcrypt from 'bcryptjs';

const SUPER_ADMIN_EMAIL = 'mework2003@gmail.com';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin@2024'; // Change this to a secure password

async function setupSuperAdmin() {
  try {
    await connectDB();
    console.log('🔗 Connected to database');

    // Check if super admin already exists
    let superAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });

    if (superAdmin) {
      console.log('✅ Super admin already exists, updating...');
      
      // Update existing super admin
      // Set role to 'student' as default (can be changed via role switcher)
      superAdmin.role = 'student';
      superAdmin.name = superAdmin.name || 'Super Admin';
      superAdmin.isActive = true;
      superAdmin.emailVerified = true;
      superAdmin.phoneVerified = true;
      superAdmin.isVerified = true;
      superAdmin.status = 'approved';
      superAdmin.kycStatus = 'approved';
      
      // Add student fields (required for student role)
      if (!superAdmin.college) {
        superAdmin.college = 'Super Admin University';
      }
      
      await superAdmin.save();
      console.log('✅ Super admin updated successfully');
      console.log('📧 Email:', superAdmin.email);
      console.log('👤 Name:', superAdmin.name);
      console.log('🎭 Role:', superAdmin.role);
    } else {
      console.log('🆕 Creating new super admin...');
      
      // Create new super admin
      const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
      
      superAdmin = await User.create({
        name: 'Super Admin',
        email: SUPER_ADMIN_EMAIL,
        phone: '+1234567890', // Update with real phone if needed
        password: hashedPassword,
        role: 'student', // Default role, can be switched
        college: 'Super Admin University', // Required for student role
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        isVerified: true,
        status: 'approved',
        kycStatus: 'approved',
        submittedAt: new Date(),
        onboardingCompleted: true
      });
      
      console.log('✅ Super admin created successfully');
      console.log('📧 Email:', superAdmin.email);
      console.log('🔑 Password:', SUPER_ADMIN_PASSWORD);
      console.log('👤 Name:', superAdmin.name);
      console.log('🎭 Role:', superAdmin.role);
      console.log('⚠️  Please change the password after first login!');
    }

    console.log('\n📊 Super Admin Details:');
    console.log('   Email:', superAdmin.email);
    console.log('   Name:', superAdmin.name);
    console.log('   Role:', superAdmin.role);
    console.log('   Active:', superAdmin.isActive);
    console.log('   Verified:', superAdmin.isVerified);
    console.log('\n✅ Setup complete!');

  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
    throw error;
  } finally {
    await disconnectDB();
    console.log('🔌 Disconnected from database');
  }
}

// Run if called directly
if (require.main === module) {
  setupSuperAdmin()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default setupSuperAdmin;





