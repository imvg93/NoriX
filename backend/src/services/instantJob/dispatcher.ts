import mongoose from 'mongoose';
import { InstantJob, IInstantJob } from '../../models/InstantJob';
import { findEligibleStudents, MatchedStudent } from './matcher';
import { notifyStudents } from './notifier';
import { lockJobForStudent, clearLock, confirmStudent } from './locker';
import { emitJobEvent } from './events';
import { refundEscrow } from './escrowService';

const WAVE_DELAY_MS = 15 * 1000; // 15 seconds between waves
const MAX_WAVES = 3;
const STUDENTS_PER_WAVE = 5;

// In-memory tracking of active dispatches
const activeDispatches = new Map<string, NodeJS.Timeout>();

/**
 * Start dispatching instant job (wave-based system)
 * Wave 1 → notify 5 → wait 45s → Wave 2 → notify 5 → wait 45s → Wave 3 → notify 5
 */
export async function startDispatch(jobId: mongoose.Types.ObjectId): Promise<{ success: boolean; error?: string }> {
  const job = await InstantJob.findById(jobId);
  if (!job) {
    return { success: false, error: 'Job not found' };
  }

  // NEVER start dispatch if job has already moved to execution
  if (job.status === 'in_progress' || job.status === 'completed' || job.status === 'cancelled') {
    console.log(`⚠️ Cannot start dispatch for job ${jobId} - job is already in progress/completed/cancelled`);
    return { success: false, error: 'Job is already in progress and cannot be dispatched again' };
  }

  // Accept pending or dispatching status only
  if (job.status !== 'pending' && job.status !== 'dispatching') {
    return { success: false, error: `Job is not in pending or dispatching status (current: ${job.status})` };
  }

  // Check if already dispatching
  if (activeDispatches.has(jobId.toString())) {
    console.log(`⚠️ Job ${jobId} is already being dispatched`);
    return { success: false, error: 'Job is already being dispatched' };
  }

  // Check if job already has accepted student
  if (job.acceptedBy) {
    console.log(`⚠️ Cannot start dispatch for job ${jobId} - job already has accepted student`);
    return { success: false, error: 'Job already has an accepted student' };
  }

  // Start dispatch
  job.status = 'dispatching';
  job.currentWave = 0;
  await job.save();
  emitJobEvent('job:dispatching', jobId, 'dispatching');

  const startTime = Date.now();
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 STARTING INSTANT JOB DISPATCH`);
  console.log(`${'='.repeat(80)}`);
  console.log(`📋 Job Details:`);
  console.log(`   ID: ${jobId}`);
  console.log(`   Title: ${job.jobTitle}`);
  console.log(`   Type: ${job.jobType}`);
  console.log(`   Pay: ${job.pay}`);
  console.log(`   Location: ${job.location.address}`);
  console.log(`   Coordinates: ${job.location.latitude}, ${job.location.longitude}`);
  console.log(`   Radius: ${job.radius}km`);
  console.log(`   Duration: ${job.duration} ${job.durationUnit}`);
  console.log(`   Status: ${job.status}`);
  console.log(`   ⏰ Start Time: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);

  // Start wave 1 IMMEDIATELY - no delay, no await blocking
  // This fires asynchronously so it doesn't block the response
  setImmediate(() => {
    const immediateTime = Date.now() - startTime;
    console.log(`⚡ FIRING WAVE 1 IMMEDIATELY (${immediateTime}ms after startDispatch)`);
    dispatchWave(jobId, 1).catch(err => {
      console.error(`❌ Error in wave 1 dispatch:`, err);
    });
  });

  return { success: true };
}

async function failJob(job: any, reason: string) {
  console.log(`🛑 Marking job ${job._id} as failed: ${reason}`);
  if (job.escrowId) {
    try {
      await refundEscrow({
        escrowId: job.escrowId,
        note: `Job failed: ${reason}`
      });
    } catch (err) {
      console.error(`❌ Failed to refund escrow for job ${job._id}:`, err);
    }
  }
  job.status = 'failed';
  await job.save();
  emitJobEvent('job:failed', job._id, 'failed');
}

/**
 * Dispatch a single wave
 */
export async function dispatchWave(jobId: mongoose.Types.ObjectId, waveNumber: number): Promise<void> {
  const job = await InstantJob.findById(jobId);
  if (!job) {
    console.log(`⚠️ Job ${jobId} not found in dispatchWave ${waveNumber}`);
    activeDispatches.delete(jobId.toString());
    return;
  }

  // CRITICAL: Stop dispatch immediately if job is already running or done
  if (job.status === 'in_progress' || job.status === 'completed') {
    console.log(`🛑 Job ${jobId} is in progress/completed - stopping dispatch wave ${waveNumber}`);
    activeDispatches.delete(jobId.toString());
    return;
  }

  // Check if job is expired, failed, or cancelled
  if (job.status === 'expired' || job.status === 'failed' || job.status === 'cancelled') {
    console.log(`🛑 Job ${jobId} is ${job.status} - stopping dispatch wave ${waveNumber}`);
    activeDispatches.delete(jobId.toString());
    return;
  }

  // Check if already has accepted student
  if (job.acceptedBy) {
    console.log(`🛑 Job ${jobId} has accepted student - stopping dispatch wave ${waveNumber}`);
    activeDispatches.delete(jobId.toString());
    return;
  }

  // Check max waves
  if (waveNumber > MAX_WAVES) {
    await failJob(job, 'Wave limit exceeded');
    activeDispatches.delete(jobId.toString());
    return;
  }

  // Get all previously notified student IDs
  const allNotifiedIds: string[] = [];
  job.waves.forEach(wave => {
    wave.notifiedStudentIds.forEach(id => {
      allNotifiedIds.push(id.toString());
    });
  });

  const waveStartTime = Date.now();
  
  console.log(`\n${'🌊'.repeat(40)}`);
  console.log(`🌊 DISPATCHING WAVE ${waveNumber} FOR JOB ${jobId}`);
  console.log(`${'🌊'.repeat(40)}`);
  console.log(`   Already notified: ${allNotifiedIds.length} students`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   ⏰ Wave Start Time: ${Date.now()}`);

  // Find eligible students (excluding already notified)
  const matchStartTime = Date.now();
  const matchedStudents = await findEligibleStudents(job, allNotifiedIds, STUDENTS_PER_WAVE);
  const matchTime = Date.now() - matchStartTime;

  console.log(`   ⏱️  Student matching took: ${matchTime}ms`);
  console.log(`   ✅ Found ${matchedStudents.length} eligible students for wave ${waveNumber}`);

  if (matchedStudents.length === 0) {
    console.log(`   ⚠️ No eligible students found for wave ${waveNumber}`);
    // No more eligible students - check if we should try next wave or fail
    if (waveNumber < MAX_WAVES) {
      // Schedule next wave
      const timeout = setTimeout(() => {
        dispatchWave(jobId, waveNumber + 1);
      }, WAVE_DELAY_MS);
      activeDispatches.set(jobId.toString(), timeout);
    } else {
      // Max waves reached, no students found
      await failJob(job, 'No students found after max waves');
      activeDispatches.delete(jobId.toString());
    }
    return;
  }

  // Send notifications
  console.log(`   📤 Sending notifications to ${matchedStudents.length} students...`);
  const notifiedIds = await notifyStudents(matchedStudents, job, waveNumber);
  console.log(`   ✅ Notified ${notifiedIds.length} students`);

  // Record wave
  job.currentWave = waveNumber;
  job.waves.push({
    waveNumber,
    notifiedStudentIds: notifiedIds.map(id => new mongoose.Types.ObjectId(id)),
    sentAt: new Date()
  });
  job.attempts = waveNumber;
  await job.save();

  // CRITICAL CHECK: Before scheduling next wave, verify job is still available
  const refreshedJob = await InstantJob.findById(jobId);
  
  if (!refreshedJob) {
    console.log(`⚠️ Job ${jobId} not found after wave ${waveNumber} - stopping dispatch`);
    activeDispatches.delete(jobId.toString());
    return;
  }

  // Check if job has been accepted/locked/confirmed
  if (refreshedJob.status === 'locked' || refreshedJob.status === 'in_progress' || refreshedJob.acceptedBy || refreshedJob.status === 'cancelled' || refreshedJob.status === 'failed' || refreshedJob.status === 'expired') {
    console.log(`🛑 Job ${jobId} has been ${refreshedJob.status} or accepted - STOPPING dispatch at wave ${waveNumber}`);
    activeDispatches.delete(jobId.toString());
    return;
  }

  // Schedule next wave if not at max
  if (waveNumber < MAX_WAVES) {
    console.log(`⏰ Scheduling wave ${waveNumber + 1} in ${WAVE_DELAY_MS}ms`);
    const timeout = setTimeout(async () => {
      // Double-check before dispatching next wave
      const jobBeforeNextWave = await InstantJob.findById(jobId);
      if (jobBeforeNextWave && jobBeforeNextWave.status !== 'locked' && jobBeforeNextWave.status !== 'in_progress' && jobBeforeNextWave.status !== 'cancelled' && jobBeforeNextWave.status !== 'failed' && jobBeforeNextWave.status !== 'expired' && !jobBeforeNextWave.acceptedBy) {
        console.log(`✅ Job still available - proceeding with wave ${waveNumber + 1}`);
        dispatchWave(jobId, waveNumber + 1);
      } else {
        console.log(`🛑 Job no longer available - canceling wave ${waveNumber + 1}`);
        activeDispatches.delete(jobId.toString());
      }
    }, WAVE_DELAY_MS);
    activeDispatches.set(jobId.toString(), timeout);
  } else {
    // Max waves reached
    activeDispatches.delete(jobId.toString());
    
    // If still no accept after all waves, mark as failed
    setTimeout(async () => {
      const finalJob = await InstantJob.findById(jobId);
      if (finalJob && !finalJob.acceptedBy && finalJob.status === 'dispatching') {
        await failJob(finalJob, 'No students accepted after all waves completed');
      }
    }, WAVE_DELAY_MS);
  }
}

/**
 * Stop dispatch (if job is cancelled or expired)
 */
export async function stopDispatch(jobId: mongoose.Types.ObjectId): Promise<void> {
  console.log(`\n${'🛑'.repeat(40)}`);
  console.log(`🛑 STOPPING DISPATCH FOR JOB ${jobId}`);
  console.log(`${'🛑'.repeat(40)}`);
  
  const timeout = activeDispatches.get(jobId.toString());
  if (timeout) {
    clearTimeout(timeout);
    activeDispatches.delete(jobId.toString());
    console.log(`   ✅ Cleared scheduled wave timeout`);
  } else {
    console.log(`   ⚠️ No active timeout found (may have already completed)`);
  }

  const job = await InstantJob.findById(jobId);
  if (job) {
    console.log(`   Current status: ${job.status}`);
    console.log(`   Has acceptedBy: ${!!job.acceptedBy}`);
    console.log(`   Has lockedBy: ${!!job.lockedBy}`);
    
    // NEVER change status if job is already running or done
    if (job.status === 'in_progress' || job.status === 'completed') {
      console.log(`   ✅ Job is active - dispatch stopped, status remains '${job.status}'`);
      return;
    }

    // Only log if still dispatching - don't change status
    if (job.status === 'dispatching' || job.status === 'pending') {
      // Don't change status - just stop the dispatch timers
      // Status will be changed by locker when student accepts/employer confirms
      console.log(`   ✅ Dispatch stopped - status remains '${job.status}' (will be updated by locker)`);
    } else if (job.status === 'locked') {
      console.log(`   ✅ Job is locked - dispatch stopped, status remains 'locked'`);
    }
  } else {
    console.log(`   ⚠️ Job not found`);
  }
  
  console.log(`${'🛑'.repeat(40)}\n`);
}

/**
 * Handle student accept (called from route)
 */
export async function handleStudentAccept(
  jobId: mongoose.Types.ObjectId,
  studentId: mongoose.Types.ObjectId
): Promise<{ success: boolean; lockExpiresAt?: Date; error?: string }> {
  // Stop dispatch
  await stopDispatch(jobId);

  // Lock job for student
  const result = await lockJobForStudent(jobId, studentId);
  if (result.success) {
    emitJobEvent('job:locked', jobId, 'locked', { lockExpiresAt: result.lockExpiresAt });
  }
  return result;
}

/**
 * Handle employer confirm/reject (called from route)
 */
export async function handleEmployerConfirm(
  jobId: mongoose.Types.ObjectId,
  employerId: mongoose.Types.ObjectId,
  confirm: boolean
): Promise<{ success: boolean; error?: string }> {
  if (confirm) {
    return await confirmStudent(jobId, employerId);
  } else {
    console.log(`\n${'❌'.repeat(40)}`);
    console.log(`❌ EMPLOYER REJECTED - CONTINUING SEARCH`);
    console.log(`${'❌'.repeat(40)}`);
    
    // Reject - clear lock and continue dispatch
    await clearLock(jobId);
    
    const job = await InstantJob.findById(jobId);
    if (!job) {
      return { success: false, error: 'Job not found' };
    }
    
    console.log(`   Current wave: ${job.currentWave}`);
    console.log(`   Current status: ${job.status}`);
    
    // Set status back to dispatching
    if (job.status === 'locked') {
      job.status = 'dispatching';
      await job.save();
      console.log(`   ✅ Status changed to 'dispatching'`);
    }
    
    // Get already notified students
    const allNotifiedIds: string[] = [];
    job.waves.forEach(wave => {
      wave.notifiedStudentIds.forEach(id => {
        allNotifiedIds.push(id.toString());
      });
    });
    
    // Also exclude the rejected student
    if (job.lockedBy) {
      allNotifiedIds.push(job.lockedBy.toString());
    }
    
    console.log(`   Already notified/rejected: ${allNotifiedIds.length} students`);
    
    // Find more students immediately
    const matchedStudents = await findEligibleStudents(job, allNotifiedIds, STUDENTS_PER_WAVE);
    console.log(`   Found ${matchedStudents.length} new eligible students`);
    
    if (matchedStudents.length > 0) {
      // Dispatch to new students immediately
      console.log(`   🚀 Dispatching to ${matchedStudents.length} new students NOW!`);
      
      // Update wave number
      const nextWave = job.currentWave + 1;
      
      // Send notifications
      const notifiedIds = await notifyStudents(matchedStudents, job, nextWave);
      console.log(`   ✅ Notified ${notifiedIds.length} students`);
      
      // Record wave
      job.currentWave = nextWave;
      job.waves.push({
        waveNumber: nextWave,
        notifiedStudentIds: notifiedIds.map(id => new mongoose.Types.ObjectId(id)),
        sentAt: new Date()
      });
      job.attempts = nextWave;
      await job.save();
      
      console.log(`   📊 Updated to wave ${nextWave}`);
      console.log(`${'❌'.repeat(40)}\n`);
    } else if (job.currentWave < MAX_WAVES) {
      // No students found, but we can try next wave later
      console.log(`   ⏰ No students available now, scheduling next wave...`);
      const timeout = setTimeout(async () => {
        await dispatchWave(jobId, job.currentWave + 1);
      }, WAVE_DELAY_MS);
      activeDispatches.set(jobId.toString(), timeout);
      console.log(`${'❌'.repeat(40)}\n`);
    } else {
      // Max waves reached
      console.log(`   ⚠️ Max waves reached, no more students available`);
    job.status = 'failed';
    await job.save();
      console.log(`${'❌'.repeat(40)}\n`);
    }
    
    return { success: true };
  }
}

// Export for use in routes
export { lockJobForStudent, clearLock, confirmStudent };

