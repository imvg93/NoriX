import mongoose from 'mongoose';
import { InstantJob } from '../../models/InstantJob';
import { emitJobEvent, emitToUser } from './events';

/**
 * Lock job for student (60-second window)
 */
export async function lockJobForStudent(
  jobId: mongoose.Types.ObjectId,
  studentId: mongoose.Types.ObjectId
): Promise<{ success: boolean; lockExpiresAt?: Date; error?: string }> {
  const job = await InstantJob.findById(jobId);
  if (!job) {
    console.log(`❌ Lock failed: Job ${jobId} not found`);
    return { success: false, error: 'Job not found' };
  }

  console.log(`🔒 Attempting to lock job ${jobId} for student ${studentId}, current status: ${job.status}, expiresAt: ${job.expiresAt}`);

  // Check if job has expired (but allow if it's locked - employer might be confirming)
  const now = new Date();
  if (job.expiresAt && now > job.expiresAt) {
    // Job expired - but allow if status is still dispatching or searching (might be in process)
    if (job.status === 'expired' || job.status === 'failed') {
      console.log(`❌ Lock failed: Job ${jobId} has expired (expiresAt: ${job.expiresAt}, now: ${now})`);
      return { success: false, error: 'Job has expired and is no longer available' };
    }
    // If status is still dispatching/searching but expired, allow it (might be processing)
    console.log(`⚠️ Job ${jobId} has passed expiry time but status is ${job.status}, allowing lock`);
  }

  // Reject if already in progress or completed
  if (job.status === 'in_progress' || job.status === 'completed') {
    console.log(`❌ Lock failed: Job ${jobId} is already in progress/completed`);
    return { success: false, error: 'Job is already in progress' };
  }

  if (job.status === 'failed') {
    console.log(`❌ Lock failed: Job ${jobId} status is failed`);
    return { success: false, error: 'Job is no longer available' };
  }

  if (job.acceptedBy) {
    console.log(`❌ Lock failed: Job ${jobId} already has acceptedBy: ${job.acceptedBy}`);
    return { success: false, error: 'Job already has an accepted worker' };
  }

  // Check if job is already locked by another student
  if (job.lockedBy && job.lockExpiresAt && new Date() < job.lockExpiresAt) {
    if (job.lockedBy.toString() !== studentId.toString()) {
      console.log(`❌ Lock failed: Job ${jobId} is locked by another student ${job.lockedBy}`);
      return { success: false, error: 'Job is currently locked by another student' };
    }
    // Same student - extend lock (allow re-locking)
    console.log(`⚠️ Job ${jobId} already locked by same student, extending lock`);
  }

  // Check if lock expired - allow re-locking
  if (job.lockedBy && job.lockExpiresAt && new Date() >= job.lockExpiresAt) {
    // Lock expired, clear it and allow new lock
    console.log(`⚠️ Previous lock expired for job ${jobId}, clearing and creating new lock`);
    job.lockedBy = undefined;
    job.lockedAt = undefined;
    job.lockExpiresAt = undefined;
  }

  // Create 60-second lock
  const lockExpiresAt = new Date(Date.now() + 60 * 1000);

  job.lockedBy = studentId;
  job.lockedAt = new Date();
  job.lockExpiresAt = lockExpiresAt;
  job.status = 'locked';
  
  await job.save();

  emitJobEvent('job:locked', jobId, 'locked', { lockExpiresAt });
  emitToUser('student:lock_assigned', studentId, jobId, 'locked', { lockExpiresAt });
  emitToUser('employer:student_assigned', job.employerId, jobId, 'locked', { studentId: studentId.toString(), lockExpiresAt });

  console.log(`✅ Successfully locked job ${jobId} for student ${studentId}, lock expires at ${lockExpiresAt}`);

  return { success: true, lockExpiresAt };
}

/**
 * Clear lock (when employer rejects or lock expires)
 */
export async function clearLock(jobId: mongoose.Types.ObjectId): Promise<void> {
  const job = await InstantJob.findById(jobId);
  if (!job) return;

  const prevLockedBy = job.lockedBy;
  job.lockedBy = undefined;
  job.lockedAt = undefined;
  job.lockExpiresAt = undefined;
  
  // If still dispatching, continue; otherwise set appropriate status
  if (job.status === 'locked') {
    job.status = 'dispatching';
  }
  
  await job.save();
  if (job.status === 'dispatching') {
    emitJobEvent('job:unlocked', jobId, 'dispatching');
    if (prevLockedBy) {
      emitToUser('student:lock_released', prevLockedBy, jobId, 'dispatching');
    }
  }
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

  // Handle both populated and non-populated employerId
  let employerIdStr: string;
  if (job.employerId instanceof mongoose.Types.ObjectId) {
    employerIdStr = job.employerId.toString();
  } else {
    const populatedEmployer = job.employerId as any;
    employerIdStr = populatedEmployer._id ? populatedEmployer._id.toString() : populatedEmployer.toString();
  }

  if (employerIdStr !== employerId.toString()) {
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

  // IMPORTANT: Stop any active dispatch BEFORE confirming
  const { stopDispatch } = await import('./dispatcher');
  await stopDispatch(jobId);
  console.log(`🛑 Stopped dispatch before confirming job ${jobId}`);

  // Confirm student - keep lock active until arrival, move acceptedBy
  job.acceptedBy = job.lockedBy;
  job.acceptedAt = new Date();
  job.status = 'locked'; // stay locked until arrival confirmation
  job.currentWave = 0; // Reset wave counter
  
  await job.save();
  
  console.log(`✅ Confirmed student ${job.acceptedBy} for job ${jobId}, status: locked (dispatch stopped)`);

  return { success: true };
}

