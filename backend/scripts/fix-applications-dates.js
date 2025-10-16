/**
 * Database Cleanup Script: Fix Applications with Missing Dates
 * 
 * This script fixes all Application records that have missing or invalid dates.
 * It will:
 * 1. Find all applications with missing appliedAt dates
 * 2. Set appliedAt to createdAt if available, or current date
 * 3. Fix any other missing timestamp fields
 * 
 * Run this script: node scripts/fix-applications-dates.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/studentjobs';

console.log('🔧 Application Date Fix Script');
console.log('================================\n');

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${MONGODB_URI.split('@')[1] || MONGODB_URI}\n`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

async function fixApplicationDates() {
  try {
    const Application = mongoose.connection.collection('applications');
    
    // Step 1: Find all applications with issues
    console.log('🔍 Scanning for problematic applications...\n');
    
    const problematicApps = await Application.find({
      $or: [
        { appliedAt: { $exists: false } },
        { appliedAt: null },
        { appliedAt: '' }
      ]
    }).toArray();
    
    console.log(`📊 Found ${problematicApps.length} applications with missing appliedAt dates\n`);
    
    if (problematicApps.length === 0) {
      console.log('✅ All applications have valid appliedAt dates!');
      return { fixed: 0, total: 0 };
    }
    
    // Step 2: Display sample of problematic records
    console.log('📋 Sample of problematic applications:');
    console.log('─'.repeat(80));
    problematicApps.slice(0, 5).forEach((app, index) => {
      console.log(`${index + 1}. ID: ${app._id}`);
      console.log(`   Job ID: ${app.jobId || app.job || 'N/A'}`);
      console.log(`   Student ID: ${app.studentId || app.student || 'N/A'}`);
      console.log(`   Status: ${app.status || 'N/A'}`);
      console.log(`   appliedAt: ${app.appliedAt || 'MISSING'}`);
      console.log(`   createdAt: ${app.createdAt || 'N/A'}`);
      console.log('');
    });
    
    if (problematicApps.length > 5) {
      console.log(`   ... and ${problematicApps.length - 5} more\n`);
    }
    
    // Step 3: Ask for confirmation
    console.log('─'.repeat(80));
    console.log('\n⚠️  This script will update these records.');
    console.log('   - If createdAt exists: appliedAt = createdAt');
    console.log('   - If createdAt missing: appliedAt = current date\n');
    
    // Auto-proceed in non-interactive mode or wait for user confirmation
    const shouldProceed = await askForConfirmation();
    
    if (!shouldProceed) {
      console.log('❌ Operation cancelled by user.');
      return { fixed: 0, total: problematicApps.length };
    }
    
    // Step 4: Fix the records
    console.log('\n🔧 Fixing applications...\n');
    
    let fixedCount = 0;
    const now = new Date();
    
    for (const app of problematicApps) {
      try {
        const updateData = {};
        
        // Set appliedAt
        if (app.createdAt && app.createdAt instanceof Date) {
          updateData.appliedAt = app.createdAt;
        } else if (app.createdAt) {
          updateData.appliedAt = new Date(app.createdAt);
        } else {
          updateData.appliedAt = now;
        }
        
        // Also ensure createdAt exists
        if (!app.createdAt) {
          updateData.createdAt = now;
        }
        
        // Ensure updatedAt exists
        if (!app.updatedAt) {
          updateData.updatedAt = now;
        }
        
        const result = await Application.updateOne(
          { _id: app._id },
          { $set: updateData }
        );
        
        if (result.modifiedCount > 0) {
          fixedCount++;
          console.log(`✅ Fixed application ${app._id}`);
        }
      } catch (error) {
        console.error(`❌ Error fixing application ${app._id}:`, error.message);
      }
    }
    
    console.log('\n' + '─'.repeat(80));
    console.log(`\n✅ Fixed ${fixedCount} out of ${problematicApps.length} applications`);
    
    // Step 5: Verify the fix
    console.log('\n🔍 Verifying fix...\n');
    
    const stillBroken = await Application.find({
      $or: [
        { appliedAt: { $exists: false } },
        { appliedAt: null },
        { appliedAt: '' }
      ]
    }).toArray();
    
    if (stillBroken.length === 0) {
      console.log('✅ All applications now have valid appliedAt dates!');
    } else {
      console.log(`⚠️  Warning: ${stillBroken.length} applications still have issues.`);
      console.log('   You may need to manually review these records.\n');
      stillBroken.slice(0, 3).forEach((app, index) => {
        console.log(`${index + 1}. ID: ${app._id} - appliedAt: ${app.appliedAt}`);
      });
    }
    
    return { fixed: fixedCount, total: problematicApps.length };
    
  } catch (error) {
    console.error('❌ Error during fix process:', error);
    throw error;
  }
}

async function askForConfirmation() {
  // Check if running in non-interactive mode (CI/CD, script, etc.)
  if (!process.stdin.isTTY) {
    console.log('🤖 Running in non-interactive mode - auto-confirming');
    return true;
  }
  
  // Interactive mode - ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Do you want to proceed? (yes/no): ', (answer) => {
      rl.close();
      const confirmed = answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
      resolve(confirmed);
    });
  });
}

async function generateReport() {
  try {
    const Application = mongoose.connection.collection('applications');
    
    console.log('\n\n📊 FINAL REPORT');
    console.log('═'.repeat(80));
    
    const totalApplications = await Application.countDocuments({});
    const withAppliedAt = await Application.countDocuments({ 
      appliedAt: { $exists: true, $ne: null, $ne: '' } 
    });
    const withoutAppliedAt = totalApplications - withAppliedAt;
    
    const byStatus = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    console.log(`\n📈 Total Applications: ${totalApplications}`);
    console.log(`✅ With appliedAt: ${withAppliedAt} (${((withAppliedAt/totalApplications)*100).toFixed(1)}%)`);
    console.log(`❌ Without appliedAt: ${withoutAppliedAt} (${((withoutAppliedAt/totalApplications)*100).toFixed(1)}%)`);
    
    console.log('\n📊 Applications by Status:');
    byStatus.forEach(item => {
      console.log(`   ${item._id || 'unknown'}: ${item.count}`);
    });
    
    console.log('\n' + '═'.repeat(80));
    
  } catch (error) {
    console.error('❌ Error generating report:', error.message);
  }
}

async function main() {
  try {
    await connectDB();
    
    const result = await fixApplicationDates();
    
    await generateReport();
    
    console.log('\n✅ Script completed successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();

