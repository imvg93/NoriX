import mongoose from 'mongoose';
import { InstantJob } from '../../models/InstantJob';
import { clearLock } from './locker';
import { stopDispatch } from './dispatcher';
import { refundEscrow } from './escrowService';

/**
 * Check and expire locks that have passed their TTL
 * Called by background worker every 30 seconds
 */
export async function expireLocks(): Promise<{ expired: number }> {
  const now = new Date();

  const expiredLocks = await InstantJob.find({
    status: 'locked',
    lockExpiresAt: { $lt: now },
    acceptedBy: { $exists: false }
  });

  let expiredCount = 0;

  for (const job of expiredLocks) {
    await clearLock(job._id);
    expiredCount++;
  }

  return { expired: expiredCount };
}

/**
 * Check and expire jobs that have passed their expiry time
 * Called by background worker every minute
 * NOTE: Don't expire locked jobs - they're being processed by employer
 */
export async function expireJobs(): Promise<{ expired: number }> {
  const now = new Date();

  // Only expire jobs that are NOT locked (locked jobs are being processed)
  const expiredJobs = await InstantJob.find({
    status: { $in: ['pending', 'dispatching'] }, // Exclude 'locked'
    expiresAt: { $lt: now },
    acceptedBy: { $exists: false },
    lockedBy: { $exists: false } // Don't expire if locked
  });

  let expiredCount = 0;

  for (const job of expiredJobs) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      console.log(`⏰ Expiring job ${job._id} (expired at ${job.expiresAt})`);
      await stopDispatch(job._id);
      if (job.escrowId) {
        await refundEscrow({
          escrowId: job.escrowId,
          note: 'Job expired - auto refund',
          session
        });
      }
      job.status = 'expired';
      await job.save({ session });
      await session.commitTransaction();
      const socketManager = (global as any).socketManager;
      if (socketManager?.io) {
        const payloadBase = {
          jobId: job._id.toString(),
          status: 'expired',
          timestamp: new Date().toISOString(),
          version: 1
        };
        socketManager.io.to(`job:${job._id.toString()}`).emit('job:expired', payloadBase);
        socketManager.io.to(`user:${job.employerId.toString()}`).emit('job:expired', payloadBase);
      }
      expiredCount++;
    } catch (err) {
      await session.abortTransaction();
      console.error(`Failed to expire job ${job._id}:`, err);
    } finally {
      session.endSession();
    }
  }

  return { expired: expiredCount };
}

/**
 * Auto-expire student availability (8 hours max)
 * Called by background worker every hour
 */
export async function expireStudentAvailability(): Promise<{ expired: number }> {
  const now = new Date();

  const expiredStudents = await (await import('../../models/User')).User.updateMany(
    {
      availableForInstantJobs: true,
      instantAvailabilityExpiresAt: { $lt: now }
    },
    {
      $set: {
        availableForInstantJobs: false,
        onlineStatus: 'offline'
      }
    }
  );

  return { expired: expiredStudents.modifiedCount || 0 };
}

