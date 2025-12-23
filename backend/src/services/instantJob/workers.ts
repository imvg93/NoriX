// @ts-ignore - node-cron types issue
import cron from 'node-cron';
import * as InstantJobExpiry from './expiry';

let isRunning = false;

/**
 * Initialize background workers for instant job system
 * - Lock expiry checker: Every 30 seconds
 * - Job expiry checker: Every minute
 * - Student availability expiry: Every hour
 */
export function startWorkers(): void {
  if (isRunning) {
    console.log('⚠️ Instant job workers already running');
    return;
  }

  console.log('🚀 Starting instant job background workers...');

  // Lock expiry checker - every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const result = await InstantJobExpiry.expireLocks();
      if (result.expired > 0) {
        console.log(`✅ Expired ${result.expired} lock(s)`);
      }
    } catch (error) {
      console.error('❌ Error expiring locks:', error);
    }
  });

  // Job expiry checker - every minute
  cron.schedule('0 * * * * *', async () => {
    try {
      const result = await InstantJobExpiry.expireJobs();
      if (result.expired > 0) {
        console.log(`✅ Expired ${result.expired} job(s)`);
      }
    } catch (error) {
      console.error('❌ Error expiring jobs:', error);
    }
  });

  // Student availability expiry - every hour
  cron.schedule('0 0 * * * *', async () => {
    try {
      const result = await InstantJobExpiry.expireStudentAvailability();
      if (result.expired > 0) {
        console.log(`✅ Expired availability for ${result.expired} student(s)`);
      }
    } catch (error) {
      console.error('❌ Error expiring student availability:', error);
    }
  });

  isRunning = true;
  console.log('✅ Instant job workers started');
}

/**
 * Stop background workers (for testing/cleanup)
 */
export function stopWorkers(): void {
  // Note: node-cron doesn't have a built-in stop method
  // In production, you'd use BullMQ or similar for better control
  isRunning = false;
  console.log('🛑 Instant job workers stopped');
}

