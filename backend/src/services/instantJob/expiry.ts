import { InstantJob } from '../../models/InstantJob';
import { clearLock } from './locker';

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
 */
export async function expireJobs(): Promise<{ expired: number }> {
  const now = new Date();

  const expiredJobs = await InstantJob.find({
    status: { $in: ['pending', 'dispatching', 'locked'] },
    expiresAt: { $lt: now },
    acceptedBy: { $exists: false }
  });

  let expiredCount = 0;

  for (const job of expiredJobs) {
    job.status = 'expired';
    await job.save();
    expiredCount++;
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

