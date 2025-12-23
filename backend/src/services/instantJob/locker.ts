import mongoose from 'mongoose';
import { InstantJob } from '../../models/InstantJob';

/**
 * Lock job for student (90-second window)
 */
export async function lockJobForStudent(
  jobId: mongoose.Types.ObjectId,
  studentId: mongoose.Types.ObjectId
): Promise<{ success: boolean; lockExpiresAt?: Date; error?: string }> {
  const job = await InstantJob.findById(jobId);
  if (!job) {
    return { success: false, error: 'Job not found' };
  }

  if (job.status === 'confirmed' || job.status === 'expired') {
    return { success: false, error: 'Job is no longer available' };
  }

  if (job.acceptedBy) {
    return { success: false, error: 'Job already has an accepted worker' };
  }

  // Check if job is already locked by another student
  if (job.lockedBy && job.lockExpiresAt && new Date() < job.lockExpiresAt) {
    if (job.lockedBy.toString() !== studentId.toString()) {
      return { success: false, error: 'Job is currently locked by another student' };
    }
    // Same student - extend lock
  }

  // Create 90-second lock
  const lockExpiresAt = new Date(Date.now() + 90 * 1000);

  job.lockedBy = studentId;
  job.lockedAt = new Date();
  job.lockExpiresAt = lockExpiresAt;
  job.status = 'locked';
  await job.save();

  return { success: true, lockExpiresAt };
}

/**
 * Clear lock (when employer rejects or lock expires)
 */
export async function clearLock(jobId: mongoose.Types.ObjectId): Promise<void> {
  const job = await InstantJob.findById(jobId);
  if (!job) return;

  job.lockedBy = undefined;
  job.lockedAt = undefined;
  job.lockExpiresAt = undefined;
  
  // If still dispatching, continue; otherwise set appropriate status
  if (job.status === 'locked') {
    job.status = 'dispatching';
  }
  
  await job.save();
}

/**
 * Confirm student (employer accepts)
 */
export async function confirmStudent(
  jobId: mongoose.Types.ObjectId,
  employerId: mongoose.Types.ObjectId
): Promise<{ success: boolean; error?: string }> {
  const job = await InstantJob.findById(jobId);
  if (!job) {
    return { success: false, error: 'Job not found' };
  }

  if (job.employerId.toString() !== employerId.toString()) {
    return { success: false, error: 'Not authorized' };
  }

  if (!job.lockedBy) {
    return { success: false, error: 'Job is not locked' };
  }

  if (job.lockExpiresAt && new Date() > job.lockExpiresAt) {
    // Lock expired - clear it
    await clearLock(jobId);
    return { success: false, error: 'Lock expired' };
  }

  // Confirm student
  job.acceptedBy = job.lockedBy;
  job.acceptedAt = new Date();
  job.status = 'confirmed';
  job.lockedBy = undefined;
  job.lockedAt = undefined;
  job.lockExpiresAt = undefined;
  await job.save();

  return { success: true };
}

