/**
 * Auto-Fix Applications Dates (No Confirmation Required)
 * 
 * This script automatically fixes all applications with missing dates.
 * Run this script: node scripts/fix-applications-dates-auto.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/studentjobs';

console.log('🔧 Auto-Fixing Application Dates\n');

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    const Application = mongoose.connection.collection('applications');
    const now = new Date();

    // Find problematic applications
    const problematic = await Application.find({
      $or: [
        { appliedAt: { $exists: false } },
        { appliedAt: null },
        { appliedAt: '' }
      ]
    }).toArray();

    console.log(`📊 Found ${problematic.length} applications with missing dates\n`);

    if (problematic.length === 0) {
      console.log('✅ All applications already have valid dates!');
      process.exit(0);
    }

    // Fix each application
    let fixed = 0;
    for (const app of problematic) {
      const updateData = {
        appliedAt: app.createdAt || now,
        updatedAt: now
      };

      if (!app.createdAt) {
        updateData.createdAt = now;
      }

      const result = await Application.updateOne(
        { _id: app._id },
        { $set: updateData }
      );

      if (result.modifiedCount > 0) {
        fixed++;
      }
    }

    console.log(`✅ Fixed ${fixed} applications\n`);

    // Verify
    const stillBroken = await Application.countDocuments({
      $or: [
        { appliedAt: { $exists: false } },
        { appliedAt: null },
        { appliedAt: '' }
      ]
    });

    if (stillBroken === 0) {
      console.log('✅ All applications now have valid dates!');
    } else {
      console.log(`⚠️  ${stillBroken} applications still have issues`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

