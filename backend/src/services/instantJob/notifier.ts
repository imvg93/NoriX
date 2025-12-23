import mongoose from 'mongoose';
import { User } from '../../models/User';
import { MatchedStudent } from './matcher';

let notificationService: any = null;

export function setNotificationService(service: any) {
  notificationService = service;
}

// Initialize notification service from global if available
if (typeof global !== 'undefined' && (global as any).notificationService) {
  setNotificationService((global as any).notificationService);
}

/**
 * Send notifications to students with cooldown management
 * Sets 7.5 minute cooldown per student to prevent spam
 */
export async function notifyStudents(
  students: MatchedStudent[],
  job: any,
  waveNumber: number
): Promise<string[]> {
  const notifiedIds: string[] = [];
  const now = new Date();
  const cooldownMinutes = 7.5;

  console.log(`📨 Notifying ${students.length} students for job ${job._id} (wave ${waveNumber})`);

  for (const student of students) {
    try {
      const studentDoc = await User.findById(student._id);
      if (!studentDoc) {
        console.log(`   ⚠️ Student ${student._id} not found, skipping`);
        continue;
      }

      // Check cooldown - prevent spam (reduced to 2 minutes for testing)
      const testCooldownMinutes = 2; // Reduced from 7.5 for easier testing
      if (studentDoc.instantCooldownUntil && now < studentDoc.instantCooldownUntil) {
        const remainingSeconds = Math.ceil((studentDoc.instantCooldownUntil.getTime() - now.getTime()) / 1000);
        console.log(`   ⏸️ Student ${student._id} (${student.name}) is in cooldown for ${remainingSeconds}s, skipping`);
        continue;
      }

      // Set cooldown (2 minutes for testing, was 7.5)
      studentDoc.instantCooldownUntil = new Date(now.getTime() + testCooldownMinutes * 60 * 1000);
      await studentDoc.save();
      console.log(`   ✅ Student ${student._id} (${student.name}) cooldown set for ${testCooldownMinutes} minutes`);

      // Send notification via socket (browser push will be handled on frontend)
      if (notificationService) {
        try {
          await notificationService.createNotification({
            receiverId: student._id,
            senderId: job.employerId,
            message: `Instant job alert: ${job.jobTitle} - ${job.pay} - ${student.distance}km away`,
            type: 'alert',
            metadata: {
              jobId: job._id,
              instantJobId: job._id,
              jobTitle: job.jobTitle,
              distance: student.distance,
              pay: job.pay,
              duration: job.duration,
              waveNumber,
              instantJob: true
            }
          });
        } catch (err) {
          console.error(`Failed to send notification to ${student._id}:`, err);
        }
      }

      // Emit Socket.IO event for real-time instant job ping
      const socketManager = (global as any).socketManager;
      if (socketManager && socketManager.io) {
        try {
          const roomName = `user:${student._id.toString()}`;
          const pingData = {
            jobId: job._id.toString(),
            jobTitle: job.jobTitle,
            jobType: job.jobType,
            distance: student.distance,
            pay: job.pay,
            duration: job.duration,
            durationUnit: job.durationUnit,
            location: job.location.address,
            waveNumber,
            expiresIn: 30 // 30 seconds to accept
          };
          
          // Check if room exists (has connected sockets)
          const room = socketManager.io.sockets.adapter.rooms.get(roomName);
          if (room && room.size > 0) {
            socketManager.io.to(roomName).emit('instant-job-ping', pingData);
            console.log(`   📡 ✅ Sent instant job ping to student ${student._id} (${student.name}) via Socket.IO (room: ${roomName}, ${room.size} socket(s))`);
          } else {
            console.log(`   ⚠️ Student ${student._id} (${student.name}) not connected to Socket.IO (room: ${roomName} doesn't exist)`);
            // Still add to notified list even if not connected - they'll see it when they reconnect
          }
        } catch (err) {
          console.error(`   ❌ Failed to emit Socket.IO event to ${student._id}:`, err);
        }
      } else {
        console.log(`   ⚠️ Socket.IO manager not available`);
      }

      notifiedIds.push(student._id.toString());
    } catch (error) {
      console.error(`Error notifying student ${student._id}:`, error);
    }
  }

  return notifiedIds;
}

