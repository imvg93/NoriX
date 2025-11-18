import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, ValidationError, sendErrorResponse } from '../middleware/errorHandler';
import Student from '../models/Student';
import VerificationLog from '../models/VerificationLog';
import { getPresignedReadUrl } from '../utils/storageProvider';

const router = express.Router();

// PATCH /api/admin/verification/:studentId
router.patch(
  '/:studentId',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new ValidationError('Invalid studentId');
    }

    const { action, rejection_code, admin_notes } = req.body as {
      action: 'approve' | 'reject' | 'require_trial';
      rejection_code?: string;
      admin_notes?: string;
    };
    if (!action) throw new ValidationError('Action is required');

    const student = await Student.findById(studentId);
    if (!student) throw new ValidationError('Student not found');

    const now = new Date();

    if (action === 'approve') {
      if (student.trial_shift_status === 'completed') {
        student.verified = true;
      } else {
        student.verified = false;
        if (student.trial_shift_status === 'not_requested') {
          student.trial_shift_status = 'pending';
        }
      }
      student.rejection_code = '';
      student.admin_notes = admin_notes || student.admin_notes;
      student.last_reviewed_by = req.user!._id;
      student.last_reviewed_at = now;
      student.verification_history = [
        ...(student.verification_history || []),
        { action: 'approve', by: req.user!._id, details: admin_notes || '', at: now } as any,
      ];
      await student.save();
      await VerificationLog.create({
        studentId: student._id,
        adminId: req.user!._id,
        action: 'approve',
        code: student.verified ? 'APPROVED_VERIFIED' : 'APPROVED_TRIAL_REQUIRED',
        details: { verified: student.verified, trial_shift_status: student.trial_shift_status },
        timestamp: now,
      });
    } else if (action === 'reject') {
      student.verified = false;
      student.rejection_code = rejection_code || 'unspecified';
      student.admin_notes = admin_notes || '';
      student.last_reviewed_by = req.user!._id;
      student.last_reviewed_at = now;
      student.verification_history = [
        ...(student.verification_history || []),
        { action: 'reject', by: req.user!._id, code: student.rejection_code, details: admin_notes || '', at: now } as any,
      ];
      await student.save();
      await VerificationLog.create({
        studentId: student._id,
        adminId: req.user!._id,
        action: 'reject',
        code: student.rejection_code,
        details: { admin_notes: student.admin_notes },
        timestamp: now,
      });
    } else if (action === 'require_trial') {
      student.verified = false;
      student.trial_shift_status = 'pending';
      student.rejection_code = '';
      student.admin_notes = admin_notes || '';
      student.last_reviewed_by = req.user!._id;
      student.last_reviewed_at = now;
      student.verification_history = [
        ...(student.verification_history || []),
        { action: 'require_trial', by: req.user!._id, details: admin_notes || '', at: now } as any,
      ];
      await student.save();
      await VerificationLog.create({
        studentId: student._id,
        adminId: req.user!._id,
        action: 'require_trial',
        code: 'TRIAL_REQUIRED',
        details: {},
        timestamp: now,
      });
    }

    const socketManager = (global as any).socketManager;
    if (socketManager) {
      socketManager.emitToUser(String(student._id), 'verification:update', {
        verified: student.verified,
        trial_shift_status: student.trial_shift_status,
        rejection_code: student.rejection_code,
        admin_notes: student.admin_notes,
        last_reviewed_at: student.last_reviewed_at,
      });
      socketManager.emitToAdmins('verification:updated', {
        studentId: student._id,
        action,
      });
    }

    sendSuccessResponse(res, { student }, 'Verification updated');
  })
);

// GET /api/admin/verification/pending
router.get(
  '/pending',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { page = 1, limit = 10 } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {
      $or: [
        { verified: false, id_doc_url: { $ne: '' }, video_url: { $ne: '' } },
        { verified: false, trial_shift_status: { $in: ['pending', 'assigned'] } },
        { rejection_code: { $ne: '' } },
      ],
    };

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ id_submitted_at: -1, video_submitted_at: -1 })
        .limit(Number(limit))
        .skip(skip)
        .lean(),
      Student.countDocuments(filter),
    ]);

    const items = await Promise.all(
      students.map(async (s) => ({
        _id: s._id,
        name: s.name,
        phone: s.phone,
        college: s.college,
        idPreview: s.id_doc_url ? await getPresignedReadUrl({ key: s.id_doc_url }) : null,
        videoPreview: s.video_url ? await getPresignedReadUrl({ key: s.video_url }) : null,
        ocr_conf: s.auto_checks?.ocr_confidence ?? null,
        face_score: s.auto_checks?.face_match_score ?? null,
        duplicate_flag: s.auto_checks?.duplicate_flag ?? false,
        submittedAt: s.id_submitted_at || s.video_submitted_at || s.updatedAt,
        trial_shift_status: s.trial_shift_status || 'not_requested',
        rejection_code: s.rejection_code || '',
        admin_notes: s.admin_notes || '',
      }))
    );

    sendSuccessResponse(
      res,
      {
        items,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
        },
      },
      'Pending verifications'
    );
  })
);

export default router;


