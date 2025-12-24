import mongoose from 'mongoose';
import { User } from '../../models/User';
import { penalizeEmployerCancellation } from './escrowService';

interface PenaltyOptions {
  session?: mongoose.ClientSession;
  note?: string;
}

export async function applyStudentCancelPenalty(
  jobId: mongoose.Types.ObjectId,
  studentId: mongoose.Types.ObjectId,
  options: PenaltyOptions = {}
): Promise<void> {
  await applyStudentPenalty({
    jobId,
    studentId,
    banHours: 24,
    trustDelta: -10,
    type: 'student_cancel',
    ...options
  });
}

export async function applyStudentNoShowPenalty(
  jobId: mongoose.Types.ObjectId,
  studentId: mongoose.Types.ObjectId,
  options: PenaltyOptions = {}
): Promise<void> {
  await applyStudentPenalty({
    jobId,
    studentId,
    banHours: 24 * 7,
    trustDelta: -30,
    type: 'student_no_show',
    ...options
  });
}

async function applyStudentPenalty(params: {
  jobId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  banHours: number;
  trustDelta: number;
  type: 'student_cancel' | 'student_no_show';
  session?: mongoose.ClientSession;
  note?: string;
}) {
  const { jobId, studentId, banHours, trustDelta, type, session, note } = params;
  const user = await User.findById(studentId).session(session ?? null);
  if (!user) return;

  const now = new Date();
  const banUntil = new Date(now.getTime() + banHours * 60 * 60 * 1000);
  const existingBan = user.instantBanUntil && user.instantBanUntil > now ? user.instantBanUntil : null;

  user.instantBanUntil = existingBan && existingBan > banUntil ? existingBan : banUntil;
  user.trustScore = (user.trustScore || 0) + trustDelta;
  user.instantPenaltyHistory = user.instantPenaltyHistory || [];
  user.instantPenaltyHistory.push({
    type,
    jobId,
    appliedAt: now,
    banUntil: user.instantBanUntil,
    trustDelta,
    note
  } as any);

  await user.save({ session });
}

export async function applyEmployerCancelPenalty(
  jobId: mongoose.Types.ObjectId,
  employerId: mongoose.Types.ObjectId,
  escrowId: mongoose.Types.ObjectId,
  penaltyPercent: number,
  options: PenaltyOptions = {}
): Promise<{ feeAmount: number }> {
  const { session, note } = options;

  const { feeAmount, escrow } = await penalizeEmployerCancellation({
    escrowId,
    penaltyPercent,
    note,
    session
  });

  const employer = await User.findById(employerId).session(session ?? null);
  if (employer) {
    employer.instantPenaltyHistory = employer.instantPenaltyHistory || [];
    employer.instantPenaltyHistory.push({
      type: 'employer_cancel',
      jobId,
      appliedAt: new Date(),
      feeAmount,
      note
    } as any);
    await employer.save({ session });
  }

  return { feeAmount: feeAmount || 0 };
}


