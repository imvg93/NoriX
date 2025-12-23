import mongoose from 'mongoose';
import { InstantJob, IInstantJob } from '../../models/InstantJob';
import { findEligibleStudents, MatchedStudent } from './matcher';
import { notifyStudents } from './notifier';
import { lockJobForStudent, clearLock, confirmStudent } from './locker';

const WAVE_DELAY_MS = 45 * 1000; // 45 seconds between waves
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

  if (job.status !== 'pending') {
    return { success: false, error: `Job is not in pending status (current: ${job.status})` };
  }

  // Check if already dispatching
  if (activeDispatches.has(jobId.toString())) {
    return { success: false, error: 'Job is already being dispatched' };
  }

  // Start dispatch
  job.status = 'dispatching';
  job.currentWave = 0;
  await job.save();

  console.log(`🚀 Starting dispatch for job ${jobId}`);
  console.log(`   Job: ${job.jobTitle}`);
  console.log(`   Location: ${job.location.address}`);
  console.log(`   Radius: ${job.radius}km`);

  // Start wave 1 immediately
  await dispatchWave(jobId, 1);

  return { success: true };
}

/**
 * Dispatch a single wave
 */
export async function dispatchWave(jobId: mongoose.Types.ObjectId, waveNumber: number): Promise<void> {
  const job = await InstantJob.findById(jobId);
  if (!job) return;

  // Check if job is still active
  if (job.status === 'confirmed' || job.status === 'expired' || job.status === 'failed') {
    activeDispatches.delete(jobId.toString());
    return;
  }

  // Check if already has accepted student
  if (job.acceptedBy) {
    activeDispatches.delete(jobId.toString());
    return;
  }

  // Check max waves
  if (waveNumber > MAX_WAVES) {
    job.status = 'failed';
    await job.save();
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

  console.log(`🌊 Dispatching wave ${waveNumber} for job ${jobId}`);
  console.log(`   Already notified: ${allNotifiedIds.length} students`);

  // Find eligible students (excluding already notified)
  const matchedStudents = await findEligibleStudents(job, allNotifiedIds, STUDENTS_PER_WAVE);

  console.log(`   Found ${matchedStudents.length} eligible students for wave ${waveNumber}`);

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
      job.status = 'failed';
      await job.save();
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

  // Schedule next wave if not at max
  if (waveNumber < MAX_WAVES) {
    const timeout = setTimeout(() => {
      dispatchWave(jobId, waveNumber + 1);
    }, WAVE_DELAY_MS);
    activeDispatches.set(jobId.toString(), timeout);
  } else {
    // Max waves reached
    activeDispatches.delete(jobId.toString());
    
    // If still no accept after all waves, mark as failed
    setTimeout(async () => {
      const finalJob = await InstantJob.findById(jobId);
      if (finalJob && !finalJob.acceptedBy && finalJob.status === 'dispatching') {
        finalJob.status = 'failed';
        await finalJob.save();
      }
    }, WAVE_DELAY_MS);
  }
}

/**
 * Stop dispatch (if job is cancelled or expired)
 */
export async function stopDispatch(jobId: mongoose.Types.ObjectId): Promise<void> {
  const timeout = activeDispatches.get(jobId.toString());
  if (timeout) {
    clearTimeout(timeout);
    activeDispatches.delete(jobId.toString());
  }

  const job = await InstantJob.findById(jobId);
  if (job && job.status === 'dispatching') {
    job.status = 'expired';
    await job.save();
  }
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
  return await lockJobForStudent(jobId, studentId);
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
    // Reject - clear lock and continue dispatch
    await clearLock(jobId);
    
    const job = await InstantJob.findById(jobId);
    if (job && job.status === 'locked') {
      job.status = 'dispatching';
      await job.save();
      
      // Continue dispatch from current wave
      if (job.currentWave < MAX_WAVES) {
        await dispatchWave(jobId, job.currentWave + 1);
      }
    }
    
    return { success: true };
  }
}

// Export for use in routes
export { lockJobForStudent, clearLock, confirmStudent };

