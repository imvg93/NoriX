import mongoose from 'mongoose';
import Escrow, { IEscrow } from '../../models/Escrow';

interface CreateEscrowParams {
  jobId: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  amount: number;
  feePercent?: number;
  session?: mongoose.ClientSession;
}

interface TransitionParams {
  escrowId: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  note?: string;
  penaltyPercent?: number;
  session?: mongoose.ClientSession;
}

export async function createHeldEscrow(params: CreateEscrowParams): Promise<IEscrow> {
  const { jobId, employerId, amount, feePercent = 10, session } = params;

  if (Number.isNaN(amount) || amount < 0) {
    throw new Error('Invalid escrow amount');
  }

  const escrow = await Escrow.create([{
    jobId,
    employerId,
    amount,
    feePercent,
    status: 'held',
    events: [{
      type: 'hold',
      note: 'Mock hold created (placeholder escrow)',
      amount,
      createdAt: new Date()
    }]
  }], { session });

  return escrow[0];
}

export async function releaseToStudent(params: TransitionParams): Promise<IEscrow | null> {
  const { escrowId, studentId, note, session } = params;
  const escrow = await Escrow.findById(escrowId).session(session || undefined);
  if (!escrow) return null;

  if (escrow.status !== 'held' && escrow.status !== 'penalized') {
    return escrow;
  }

  escrow.studentId = escrow.studentId || studentId;
  escrow.status = 'released';
  escrow.events.push({
    type: 'release',
    note: note || 'Released to student (mock payout)',
    amount: escrow.amount,
    createdAt: new Date()
  });

  await escrow.save({ session });
  return escrow;
}

export async function refundEscrow(params: TransitionParams): Promise<IEscrow | null> {
  const { escrowId, note, session } = params;
  const escrow = await Escrow.findById(escrowId).session(session || undefined);
  if (!escrow) return null;

  if (escrow.status !== 'held' && escrow.status !== 'penalized') {
    return escrow;
  }

  escrow.status = 'refunded';
  escrow.events.push({
    type: 'refund',
    note: note || 'Refund to employer (mock)',
    amount: escrow.amount,
    createdAt: new Date()
  });

  await escrow.save({ session });
  return escrow;
}

export async function penalizeEmployerCancellation(params: TransitionParams): Promise<{ escrow: IEscrow | null; feeAmount: number; refundAmount: number }> {
  const { escrowId, penaltyPercent = 20, note, session } = params;
  const escrow = await Escrow.findById(escrowId).session(session || undefined);
  if (!escrow) return { escrow: null, feeAmount: 0, refundAmount: 0 };

  if (escrow.status !== 'held') {
    return { escrow, feeAmount: 0, refundAmount: 0 };
  }

  const feeAmount = Math.round(((escrow.amount * penaltyPercent) / 100) * 100) / 100; // keep to 2 decimals
  const refundAmount = Math.max(0, Math.round((escrow.amount - feeAmount) * 100) / 100);
  escrow.status = 'penalized';
  escrow.events.push({
    type: 'penalty',
    note: note || `Employer cancellation penalty ${penaltyPercent}%`,
    amount: feeAmount,
    createdAt: new Date()
  });
  if (refundAmount > 0) {
    escrow.events.push({
      type: 'refund',
      note: 'Refund after employer cancellation (post-penalty)',
      amount: refundAmount,
      createdAt: new Date()
    });
  }

  await escrow.save({ session });
  return { escrow, feeAmount, refundAmount };
}


