import mongoose from 'mongoose';
import { KYC } from '../models/KYC';
import { User } from '../models/User';
import { KYCAudit } from '../models/KYCAudit';
import { computeKycStatus, validateKycConsistency } from '../utils/kycStatusHelper';

/**
 * Database Migration Script for KYC System
 * This script fixes data inconsistencies and adds required indexes
 */

interface MigrationResult {
  success: boolean;
  errors: string[];
  stats: {
    usersProcessed: number;
    kycRecordsProcessed: number;
    inconsistenciesFixed: number;
    indexesCreated: number;
  };
}

export async function runKYCMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    errors: [],
    stats: {
      usersProcessed: 0,
      kycRecordsProcessed: 0,
      inconsistenciesFixed: 0,
      indexesCreated: 0
    }
  };

  try {
    console.log('🚀 Starting KYC Database Migration...');

    // Step 1: Create required indexes
    await createIndexes(result);

    // Step 2: Fix data inconsistencies
    await fixDataInconsistencies(result);

    // Step 3: Create audit entries for fixed inconsistencies
    await createAuditEntries(result);

    console.log('✅ KYC Migration completed successfully');
    console.log('📊 Migration Stats:', result.stats);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

async function createIndexes(result: MigrationResult): Promise<void> {
  console.log('📋 Creating database indexes...');

  try {
    // Create KYC compound index
    await KYC.collection.createIndex(
      { email: 1, phone: 1 },
      { unique: true, name: 'email_phone_unique' }
    );
    result.stats.indexesCreated++;

    // Create KYC audit indexes
    await KYCAudit.collection.createIndex(
      { userId: 1, timestamp: -1 },
      { name: 'kyc_audit_user_timestamp' }
    );
    result.stats.indexesCreated++;

    await KYCAudit.collection.createIndex(
      { adminId: 1, timestamp: -1 },
      { name: 'kyc_audit_admin_timestamp' }
    );
    result.stats.indexesCreated++;

    await KYCAudit.collection.createIndex(
      { action: 1, timestamp: -1 },
      { name: 'kyc_audit_action_timestamp' }
    );
    result.stats.indexesCreated++;

    console.log(`✅ Created ${result.stats.indexesCreated} indexes`);

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    result.errors.push(`Index creation failed: ${error}`);
  }
}

async function fixDataInconsistencies(result: MigrationResult): Promise<void> {
  console.log('🔧 Fixing data inconsistencies...');

  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Get all users
      const users = await User.find({}).session(session);
      result.stats.usersProcessed = users.length;

      for (const user of users) {
        // Find KYC record for this user
        const kycRecord = await KYC.findOne({ userId: user._id }).session(session);
        result.stats.kycRecordsProcessed += kycRecord ? 1 : 0;

        // Compute canonical status
        const canonicalStatus = computeKycStatus(user, kycRecord);

        // Check for inconsistencies
        const isConsistent = validateKycConsistency(user, kycRecord);

        if (!isConsistent) {
          console.log(`🔧 Fixing inconsistency for user: ${user.email}`);
          
          // Update user record to match canonical status
          await User.findByIdAndUpdate(
            user._id,
            {
              isVerified: canonicalStatus.isVerified,
              kycStatus: canonicalStatus.status,
              ...(canonicalStatus.status === 'approved' && { kycVerifiedAt: canonicalStatus.verifiedAt }),
              ...(canonicalStatus.status === 'rejected' && { kycRejectedAt: canonicalStatus.rejectedAt }),
              ...(canonicalStatus.status === 'pending' && { kycPendingAt: canonicalStatus.submittedAt })
            },
            { session }
          );

          result.stats.inconsistenciesFixed++;
        }
      }
    });

    console.log(`✅ Fixed ${result.stats.inconsistenciesFixed} inconsistencies`);

  } catch (error) {
    console.error('❌ Error fixing inconsistencies:', error);
    result.errors.push(`Data consistency fix failed: ${error}`);
    throw error;
  } finally {
    await session.endSession();
  }
}

async function createAuditEntries(result: MigrationResult): Promise<void> {
  if (result.stats.inconsistenciesFixed === 0) {
    return;
  }

  console.log('📝 Creating audit entries for fixed inconsistencies...');

  try {
    // Create a system admin user for audit entries (or use existing admin)
    let systemAdmin = await User.findOne({ userType: 'admin' });
    
    if (!systemAdmin) {
      // Create a system admin for migration purposes
      systemAdmin = new User({
        name: 'System Migration',
        email: 'system@migration.local',
        phone: '0000000000',
        userType: 'admin',
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        kycStatus: 'approved',
        isVerified: true
      });
      await systemAdmin.save();
    }

    // Create audit entry for the migration
    const auditEntry = new KYCAudit({
      userId: systemAdmin._id, // System admin as the actor
      adminId: systemAdmin._id,
      action: 'approved', // Migration action
      reason: `System migration fixed ${result.stats.inconsistenciesFixed} data inconsistencies`,
      prevStatus: 'not_submitted',
      newStatus: 'approved',
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'KYC-Migration-Script'
    });

    await auditEntry.save();
    console.log('✅ Created migration audit entry');

  } catch (error) {
    console.error('❌ Error creating audit entries:', error);
    result.errors.push(`Audit entry creation failed: ${error}`);
  }
}

// Backfill script for existing data
export async function backfillKYCData(): Promise<void> {
  console.log('🔄 Starting KYC data backfill...');

  try {
    // Update all existing KYC records to use canonical status enum
    const updateResult = await KYC.updateMany(
      { verificationStatus: { $in: ['in-review'] } },
      { $set: { verificationStatus: 'pending' } }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} KYC records to use canonical status`);

    // Run the main migration
    const migrationResult = await runKYCMigration();
    
    if (!migrationResult.success) {
      throw new Error(`Migration failed: ${migrationResult.errors.join(', ')}`);
    }

    console.log('✅ KYC data backfill completed successfully');

  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw error;
  }
}

// Export for use in other modules
export { MigrationResult };
