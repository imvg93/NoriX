#!/usr/bin/env node

/**
 * KYC Database Migration Script
 * 
 * This script fixes data inconsistencies and adds required indexes for the KYC system.
 * Run this script after deploying the updated KYC system.
 * 
 * Usage:
 *   npm run migrate:kyc
 *   or
 *   node scripts/runKYCMigration.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { runKYCMigration, backfillKYCData } from '../src/scripts/kycMigration';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🚀 Starting KYC Database Migration...');
  console.log('=====================================');

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check command line arguments
    const args = process.argv.slice(2);
    const shouldBackfill = args.includes('--backfill') || args.includes('-b');

    if (shouldBackfill) {
      console.log('🔄 Running full backfill migration...');
      await backfillKYCData();
    } else {
      console.log('🔧 Running standard migration...');
      const result = await runKYCMigration();
      
      if (result.success) {
        console.log('✅ Migration completed successfully!');
        console.log('📊 Migration Statistics:');
        console.log(`   - Users processed: ${result.stats.usersProcessed}`);
        console.log(`   - KYC records processed: ${result.stats.kycRecordsProcessed}`);
        console.log(`   - Inconsistencies fixed: ${result.stats.inconsistenciesFixed}`);
        console.log(`   - Indexes created: ${result.stats.indexesCreated}`);
        
        if (result.errors.length > 0) {
          console.log('⚠️  Warnings:');
          result.errors.forEach(error => console.log(`   - ${error}`));
        }
      } else {
        console.error('❌ Migration failed!');
        result.errors.forEach(error => console.error(`   - ${error}`));
        process.exit(1);
      }
    }

    console.log('=====================================');
    console.log('🎉 Migration completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Restart your application server');
    console.log('   2. Test the KYC flow end-to-end');
    console.log('   3. Monitor logs for any issues');

  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted by user');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Migration terminated');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the migration
main().catch(console.error);
