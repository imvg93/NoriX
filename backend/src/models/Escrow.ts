import mongoose, { Document, Schema } from 'mongoose';

export type EscrowStatus = 'held' | 'released' | 'refunded' | 'penalized';

export interface IEscrow extends Document {
  jobId: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  amount: number;
  feePercent: number;
  status: EscrowStatus;
  settlementRef?: string;
  events: Array<{
    type: 'hold' | 'release' | 'refund' | 'penalty';
    note?: string;
    amount?: number;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const escrowSchema = new Schema<IEscrow>({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InstantJob',
    required: true,
    index: true
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  feePercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 10
  },
  status: {
    type: String,
    enum: ['held', 'released', 'refunded', 'penalized'],
    default: 'held',
    index: true
  },
  settlementRef: {
    type: String
  },
  events: [{
    type: {
      type: String,
      enum: ['hold', 'release', 'refund', 'penalty'],
      required: true
    },
    note: String,
    amount: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

escrowSchema.index({ status: 1, createdAt: -1 });

export const Escrow = mongoose.model<IEscrow>('Escrow', escrowSchema);
export default Escrow;


