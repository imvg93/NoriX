import mongoose from 'mongoose';
import { User } from '../../models/User';
import { MatchedStudent } from './matcher';
import { emitToUser } from './events';

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

      // Emit Socket.IO event for real-time instant job ping - IMMEDIATE, NO DELAY
      const socketManager = (global as any).socketManager;
      if (socketManager && socketManager.io) {
        try {
          const roomName = `user:${student._id.toString()}`;
          const pingData = {
            jobId: job._id.toString(),
            status: 'dispatching',
            jobTitle: job.jobTitle,
            jobType: job.jobType,
            distance: student.distance,
            pay: job.pay,
            duration: job.duration,
            durationUnit: job.durationUnit,
            location: job.location.address,
            companyName: job.companyName || 'Company',
            waveNumber,
            expiresIn: 10, // 10 seconds to accept
            timestamp: new Date().toISOString(),
            version: 1
          };
          
          console.log(`\n   ${'⚡'.repeat(70)}`);
          console.log(`   ⚡ EMITTING SOCKET EVENT NOW - STUDENT SHOULD SEE POPUP IMMEDIATELY!`);
          console.log(`   ⚡ Room: ${roomName}`);
          console.log(`   ⚡ Event: student:ping`);
          console.log(`   ⚡ Job: ${pingData.jobTitle}`);
          console.log(`   ⚡ Pay: ${pingData.pay}`);
          console.log(`   ${'⚡'.repeat(70)}\n`);
          
          // Emit immediately - don't wait for room check (new contract)
          socketManager.io.to(roomName).emit('student:ping', pingData);
          // Legacy fallback
          socketManager.io.to(roomName).emit('instant-job-ping', pingData);
          
          // Also try direct emission to socket ID if available
          const sockets = socketManager.io.sockets.sockets;
          for (const [socketId, socket] of sockets) {
            if ((socket as any).userId?.toString() === student._id.toString()) {
              console.log(`   🎯 DIRECT EMIT to socket ${socketId}`);
              socket.emit('student:ping', pingData);
              socket.emit('instant-job-ping', pingData);
            }
          }
          
          // Check if room exists for logging
          const room = socketManager.io.sockets.adapter.rooms.get(roomName);
          console.log(`\n   ${'─'.repeat(70)}`);
          console.log(`   📡 SOCKET.IO EMISSION`);
          console.log(`   ${'─'.repeat(70)}`);
          console.log(`   Student: ${student.name} (${student._id})`);
          console.log(`   Room: ${roomName}`);
          console.log(`   Event: student:ping`);
          console.log(`   Data:`, JSON.stringify(pingData, null, 2));
          
          if (room && room.size > 0) {
            console.log(`   ✅ SUCCESSFULLY EMITTED - Student is connected (${room.size} socket(s))`);
            console.log(`   🎯 Student should receive notification NOW!`);
          } else {
            console.log(`   ⚠️ WARNING - Student NOT connected to Socket.IO`);
            console.log(`   Room "${roomName}" does not exist`);
            console.log(`   Ping was emitted but student may not receive it`);
            console.log(`   Check:`);
            console.log(`      1. Is student logged in?`);
            console.log(`      2. Is socket service initialized in frontend?`);
            console.log(`      3. Check browser console for socket connection logs`);
          }
          console.log(`   ${'─'.repeat(70)}\n`);
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

