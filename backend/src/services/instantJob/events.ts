/* Centralized Instant Job Socket Events
 * All events include: jobId, status, timestamp, version
 * Namespace: /instant-jobs (event names prefixed accordingly)
 */
import mongoose from 'mongoose';

type BasePayload = {
  jobId: string;
  status: string;
  timestamp: string;
  version: number;
};

function emit(event: string, payload: Record<string, any>, room?: string) {
  const socketManager = (global as any).socketManager;
  if (!socketManager || !socketManager.io) return;
  const base: BasePayload = {
    jobId: payload.jobId,
    status: payload.status,
    timestamp: new Date().toISOString(),
    version: 1,
  };
  socketManager.io.to(room || `job:${payload.jobId}`).emit(event, { ...base, ...payload });
}

export function emitJobEvent(event: string, jobId: mongoose.Types.ObjectId, status: string, extra: Record<string, any> = {}) {
  emit(event, { jobId: jobId.toString(), status, ...extra });
}

export function emitToUser(event: string, userId: mongoose.Types.ObjectId | string, jobId: mongoose.Types.ObjectId, status: string, extra: Record<string, any> = {}) {
  emit(event, { jobId: jobId.toString(), status, ...extra }, `user:${userId.toString()}`);
}


