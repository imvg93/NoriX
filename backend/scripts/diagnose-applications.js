/**
 * Comprehensive Application Diagnostics
 * 
 * This script checks for various issues with Application records
 * Run: node scripts/diagnose-applications.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/studentjobs';

console.log('🔍 Application Diagnostics\n');
console.log('═'.repeat(80) + '\n');

async function main() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    const Application = mongoose.connection.collection('applications');

    // Get all applications
    const allApps = await Application.find({}).limit(10).toArray();
    
    console.log(`📊 Total applications in database: ${await Application.countDocuments({})}`);
    console.log(`📋 Showing first 10 applications:\n`);

    if (allApps.length === 0) {
      console.log('⚠️  No applications found in database!');
      process.exit(0);
    }

    // Check each application
    allApps.forEach((app, index) => {
      console.log(`\n${index + 1}. Application ID: ${app._id}`);
      console.log(`   ─`.repeat(40));
      console.log(`   Job ID: ${app.jobId || app.job || 'MISSING'}`);
      console.log(`   Student ID: ${app.studentId || app.student || 'MISSING'}`);
      console.log(`   Employer ID: ${app.employer || 'MISSING'}`);
      console.log(`   Status: ${app.status || 'MISSING'}`);
      console.log(`   appliedAt: ${app.appliedAt || 'MISSING'}`);
      console.log(`   appliedAt type: ${typeof app.appliedAt}`);
      console.log(`   appliedAt is Date? ${app.appliedAt instanceof Date}`);
      console.log(`   appliedAt value: ${JSON.stringify(app.appliedAt)}`);
      console.log(`   createdAt: ${app.createdAt || 'MISSING'}`);
      console.log(`   createdAt type: ${typeof app.createdAt}`);
      console.log(`   updatedAt: ${app.updatedAt || 'MISSING'}`);
      
      // Check if appliedAt can call getTime()
      if (app.appliedAt) {
        try {
          const time = new Date(app.appliedAt).getTime();
          console.log(`   ✅ appliedAt.getTime() works: ${time}`);
        } catch (e) {
          console.log(`   ❌ appliedAt.getTime() FAILS: ${e.message}`);
        }
      } else {
        console.log(`   ❌ appliedAt is falsy (null/undefined/empty)`);
      }
    });

    console.log('\n\n' + '═'.repeat(80));
    console.log('\n📊 Statistics:');
    console.log('─'.repeat(80));

    // Count by different criteria
    const counts = {
      total: await Application.countDocuments({}),
      withAppliedAt: await Application.countDocuments({ appliedAt: { $exists: true, $ne: null } }),
      withoutAppliedAt: await Application.countDocuments({ appliedAt: { $exists: false } }),
      appliedAtNull: await Application.countDocuments({ appliedAt: null }),
      appliedAtEmpty: await Application.countDocuments({ appliedAt: '' }),
    };

    console.log(`Total applications: ${counts.total}`);
    console.log(`With appliedAt (exists & not null): ${counts.withAppliedAt}`);
    console.log(`Without appliedAt (doesn't exist): ${counts.withoutAppliedAt}`);
    console.log(`appliedAt is null: ${counts.appliedAtNull}`);
    console.log(`appliedAt is empty string: ${counts.appliedAtEmpty}`);

    // Check for invalid date objects
    console.log('\n🔍 Checking for invalid Date objects...');
    const allWithAppliedAt = await Application.find({ 
      appliedAt: { $exists: true, $ne: null, $ne: '' } 
    }).toArray();

    let invalidDates = 0;
    for (const app of allWithAppliedAt) {
      if (app.appliedAt) {
        const date = new Date(app.appliedAt);
        if (isNaN(date.getTime())) {
          invalidDates++;
          console.log(`❌ Invalid date in ${app._id}: ${JSON.stringify(app.appliedAt)}`);
        }
      }
    }
    console.log(`\nFound ${invalidDates} applications with invalid date objects`);

    // Check for orphaned references
    console.log('\n🔍 Checking for orphaned job references...');
    const Job = mongoose.connection.collection('jobs');
    let orphanedJobs = 0;
    
    for (const app of allApps) {
      const jobId = app.jobId || app.job;
      if (jobId) {
        const jobExists = await Job.findOne({ _id: jobId });
        if (!jobExists) {
          orphanedJobs++;
          console.log(`❌ Application ${app._id} references non-existent job ${jobId}`);
        }
      }
    }
    console.log(`Found ${orphanedJobs} applications with orphaned job references (in sample)`);

    console.log('\n✅ Diagnostic complete!\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

