import express from 'express';
import { authenticateToken, requireAdmin, requireStudent, AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, sendErrorResponse, ValidationError } from '../middleware/errorHandler';
import { getPresignedUploadUrl, getPresignedReadUrl, getMaxSizes } from '../utils/storageProvider';
import Student, { IStudent } from '../models/Student';
import VerificationLog from '../models/VerificationLog';
import mongoose from 'mongoose';
import { requireEmployer } from '../middleware/auth';
import multer from 'multer';
import { uploadImage, deleteImage } from '../config/cloudinary';
import fs from 'fs';
import crypto from 'crypto';

const router = express.Router();

// Test route to verify routing works
router.get('/test', (req, res) => {
  res.json({ message: 'Verification routes are working', path: req.path });
});

// Helper: validate mime type
function isAllowedIdMime(mime?: string): boolean {
  if (!mime) return false;
  return /^image\/(png|jpeg|jpg|webp|heic)$/i.test(mime) || /^application\/pdf$/i.test(mime);
}

function isAllowedVideoMime(mime?: string): boolean {
  if (!mime) return false;
  return /^video\/(mp4|webm|quicktime|x-matroska|ogg)$/i.test(mime);
}

// Multer for direct file uploads (Cloudinary path)
const diskStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    try {
      if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads', { recursive: true });
      }
    } catch {}
    cb(null, 'uploads/');
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split('.').pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  }
});
const upload = multer({ storage: diskStorage });

// POST /api/verification/upload-id
router.post(
  '/upload-id',
  authenticateToken,
  requireStudent,
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { fileName, contentType, size, sha256 } = req.body as {
      fileName?: string;
      contentType?: string;
      size?: number;
      sha256?: string;
    };

    const { MAX_ID_SIZE } = getMaxSizes();
    if (!fileName || !contentType || !size || !sha256) {
      throw new ValidationError('fileName, contentType, size and sha256 are required');
    }
    if (!isAllowedIdMime(contentType)) {
      throw new ValidationError('Unsupported ID document type');
    }
    if (size > MAX_ID_SIZE) {
      throw new ValidationError(`ID document exceeds max size of ${MAX_ID_SIZE} bytes`);
    }

    const key = `students/${req.user!._id}/id/${Date.now()}_${fileName}`;
    const upload = await getPresignedUploadUrl({
      key,
      contentType,
    });

    // Update student meta optimistically
    const student = await Student.findOneAndUpdate(
      { _id: req.user!._id },
      {
        $set: {
          id_doc_url: key,
          id_doc_hash: sha256,
          id_submitted_at: new Date(),
          verification_history: [
            ...(Array.isArray((req as any).user?.verification_history) ? (req as any).user.verification_history : []),
            { action: 'upload_id', by: req.user!._id, code: '', details: fileName, at: new Date() },
          ],
        },
      },
      { new: true, upsert: false }
    );

    // Log
    try {
      await VerificationLog.create({
        studentId: req.user!._id,
        adminId: null,
        action: 'upload_id',
        code: 'ID_UPLOADED',
        details: { fileName, contentType, size, sha256, key },
        timestamp: new Date(),
      });
    } catch (e) {
      // no-op
    }

    // Notify admins in real-time
    const socketManager = (global as any).socketManager;
    if (socketManager) {
      socketManager.emitToAdmins('verification:pending', {
        studentId: req.user!._id,
        type: 'id_upload',
        key,
      });
    }

    sendSuccessResponse(
      res,
      {
        status: 'uploaded',
        upload,
        id_doc_key: key,
        id_doc_read_url: await getPresignedReadUrl({ key }),
        id_doc_hash: sha256,
      },
      'ID upload URL generated'
    );
  })
);

// POST /api/verification/upload-id-file (Cloudinary; multipart)
router.post(
  '/upload-id-file',
  authenticateToken,
  requireStudent,
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) throw new ValidationError('No file uploaded');
    const { MAX_ID_SIZE } = getMaxSizes();
    if (!isAllowedIdMime(file.mimetype)) throw new ValidationError('Unsupported ID document type');
    if (file.size > MAX_ID_SIZE) throw new ValidationError(`ID document exceeds max size of ${MAX_ID_SIZE} bytes`);

    // Compute sha256
    const buf = fs.readFileSync(file.path);
    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

    // Upload to Cloudinary
    const result = await uploadImage(file, 'norix/verification/id');
    const secureUrl = result.secure_url;

    await Student.findOneAndUpdate(
      { _id: req.user!._id },
      {
        $set: {
          id_doc_url: secureUrl,
          id_doc_hash: sha256,
          id_submitted_at: new Date(),
        },
        $push: {
          verification_history: { action: 'upload_id', by: req.user!._id, details: file.originalname, at: new Date() } as any
        }
      },
      { new: true }
    );

    try {
      await VerificationLog.create({
        studentId: req.user!._id,
        adminId: null,
        action: 'upload_id',
        code: 'ID_UPLOADED',
        details: { mimetype: file.mimetype, size: file.size, sha256, secureUrl },
        timestamp: new Date(),
      });
    } catch {}

    sendSuccessResponse(res, { status: 'uploaded', id_doc_url: secureUrl, id_doc_hash: sha256 }, 'ID uploaded to Cloudinary');
  })
);

// POST /api/verification/upload-video
router.post(
  '/upload-video',
  authenticateToken,
  requireStudent,
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { fileName, contentType, size, sha256, durationSec } = req.body as {
      fileName?: string;
      contentType?: string;
      size?: number;
      sha256?: string;
      durationSec?: number;
    };
    const { MAX_VIDEO_SIZE } = getMaxSizes();

    if (!fileName || !contentType || !size || !sha256) {
      throw new ValidationError('fileName, contentType, size and sha256 are required');
    }
    if (!isAllowedVideoMime(contentType)) {
      throw new ValidationError('Unsupported video type');
    }
    if (size > MAX_VIDEO_SIZE) {
      throw new ValidationError(`Video exceeds max size of ${MAX_VIDEO_SIZE} bytes`);
    }
    if (typeof durationSec === 'number' && durationSec > 300) {
      throw new ValidationError('Video too long. Max 5 minutes.');
    }

    const key = `students/${req.user!._id}/video/${Date.now()}_${fileName}`;
    const upload = await getPresignedUploadUrl({
      key,
      contentType,
    });

    await Student.findOneAndUpdate(
      { _id: req.user!._id },
      {
        $set: {
          video_url: key,
          video_submitted_at: new Date(),
          verification_history: [
            { action: 'upload_video', by: req.user!._id, code: '', details: fileName, at: new Date() },
          ],
        },
      },
      { new: true }
    );

    try {
      await VerificationLog.create({
        studentId: req.user!._id,
        adminId: null,
        action: 'upload_video',
        code: 'VIDEO_UPLOADED',
        details: { fileName, contentType, size, sha256, durationSec, key },
        timestamp: new Date(),
      });
    } catch {}

    const socketManager = (global as any).socketManager;
    if (socketManager) {
      socketManager.emitToAdmins('verification:pending', {
        studentId: req.user!._id,
        type: 'video_upload',
        key,
      });
    }

    sendSuccessResponse(
      res,
      {
        status: 'uploaded',
        upload,
        video_key: key,
        video_read_url: await getPresignedReadUrl({ key }),
      },
      'Video upload URL generated'
    );
  })
);

// POST /api/verification/upload-video-file (Cloudinary; multipart)
router.post(
  '/upload-video-file',
  authenticateToken,
  requireStudent,
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) throw new ValidationError('No file uploaded');
    const { MAX_VIDEO_SIZE } = getMaxSizes();
    if (!isAllowedVideoMime(file.mimetype)) throw new ValidationError('Unsupported video type');
    if (file.size > MAX_VIDEO_SIZE) throw new ValidationError(`Video exceeds max size of ${MAX_VIDEO_SIZE} bytes`);

    // Get current student to check for existing video
    const currentStudent = await Student.findOne({ _id: req.user!._id });
    
    // Delete old video from Cloudinary if exists
    if (currentStudent?.video_url) {
      try {
        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/cloud_name/video/upload/v1234567890/norix/verification/video/filename
        const urlParts = currentStudent.video_url.split('/');
        const videoIndex = urlParts.findIndex(part => part === 'video');
        if (videoIndex !== -1 && videoIndex < urlParts.length - 1) {
          // Get the path after 'upload' or 'video'
          const uploadIndex = urlParts.findIndex(part => part === 'upload');
          if (uploadIndex !== -1) {
            const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/'); // Skip 'upload' and version
            const publicId = pathAfterUpload.replace(/\.[^/.]+$/, ''); // Remove file extension
            if (publicId) {
              console.log('🗑️ Deleting old video from Cloudinary:', publicId);
              await deleteImage(publicId);
              console.log('✅ Old video deleted successfully');
            }
          }
        }
      } catch (deleteError) {
        console.warn('⚠️ Failed to delete old video from Cloudinary:', deleteError);
        // Continue with upload even if deletion fails
      }
    }

    const result = await uploadImage(file, 'norix/verification/video');
    const secureUrl = result.secure_url;

    await Student.findOneAndUpdate(
      { _id: req.user!._id },
      {
        $set: {
          video_url: secureUrl,
          video_submitted_at: new Date(),
        },
        $push: {
          verification_history: { action: 'upload_video', by: req.user!._id, details: file.originalname, at: new Date() } as any
        }
      },
      { new: true }
    );

    try {
      await VerificationLog.create({
        studentId: req.user!._id,
        adminId: null,
        action: 'upload_video',
        code: 'VIDEO_UPLOADED',
        details: { mimetype: file.mimetype, size: file.size, secureUrl },
        timestamp: new Date(),
      });
    } catch {}

    sendSuccessResponse(res, { status: 'uploaded', video_url: secureUrl }, 'Video uploaded successfully');
  })
);

// DELETE /api/verification/delete-video
// @desc    Delete video from Cloudinary and MongoDB
// @access  Private
router.delete(
  '/delete-video',
  authenticateToken,
  requireStudent,
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const student = await Student.findOne({ _id: req.user!._id });
    
    if (!student || !student.video_url) {
      throw new ValidationError('No video found to delete');
    }

    const videoUrl = student.video_url;

    // Delete from Cloudinary
    try {
      // Extract public_id from Cloudinary URL
      const urlParts = videoUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1) {
        const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/'); // Skip 'upload' and version
        const publicId = pathAfterUpload.replace(/\.[^/.]+$/, ''); // Remove file extension
        if (publicId) {
          console.log('🗑️ Deleting video from Cloudinary:', publicId);
          await deleteImage(publicId);
          console.log('✅ Video deleted from Cloudinary');
        }
      }
    } catch (deleteError) {
      console.warn('⚠️ Failed to delete video from Cloudinary:', deleteError);
      // Continue with database update even if Cloudinary deletion fails
    }

    // Remove from MongoDB
    await Student.findOneAndUpdate(
      { _id: req.user!._id },
      {
        $set: {
          video_url: '',
          video_submitted_at: undefined,
        },
        $push: {
          verification_history: { action: 'delete_video', by: req.user!._id, details: 'Video deleted', at: new Date() } as any
        }
      },
      { new: true }
    );

    try {
      await VerificationLog.create({
        studentId: req.user!._id,
        adminId: null,
        action: 'delete_video',
        code: 'VIDEO_DELETED',
        details: { videoUrl },
        timestamp: new Date(),
      });
    } catch {}

    sendSuccessResponse(res, {}, 'Video deleted successfully');
  })
);

// GET /api/verification/status
// NOTE: This route is now handled by verificationRoutes.ts to avoid conflicts
// Keeping this commented out to prevent duplicate route registration
// router.get(
//   '/status',
//   authenticateToken,
//   requireStudent,
//   asyncHandler(async (req: AuthRequest, res: express.Response) => {
//     // Moved to verificationRoutes.ts
//   })
// );

// POST /api/verification/request-trial
router.post(
  '/request-trial',
  authenticateToken,
  requireStudent,
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const student = await Student.findById(req.user!._id);
    if (!student) throw new ValidationError('Student not found');

    student.trial_shift_status = 'pending';
    student.verification_history = [
      ...(student.verification_history || []),
      { action: 'request_trial', by: req.user!._id, at: new Date() } as any,
    ];
    await student.save();

    try {
      await VerificationLog.create({
        studentId: req.user!._id,
        adminId: null,
        action: 'request_trial',
        code: 'TRIAL_REQUESTED',
        details: {},
        timestamp: new Date(),
      });
    } catch {}

    const socketManager = (global as any).socketManager;
    if (socketManager) {
      socketManager.emitToAdmins('verification:pending', {
        studentId: req.user!._id,
        type: 'trial_request',
      });
      socketManager.emitToUser(req.user!._id.toString(), 'verification:update', {
        trial_shift_status: 'pending',
      });
    }

    sendSuccessResponse(res, { trial_shift_status: 'pending' }, 'Trial requested');
  })
);

// POST /api/verification/auto-check/:studentId (admin/internal)
router.post(
  '/auto-check/:studentId',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new ValidationError('Invalid studentId');
    }
    const student = await Student.findById(studentId);
    if (!student) throw new ValidationError('Student not found');

    // TODO: Queue OCR/face-match job; here we just mark a placeholder
    const now = new Date();
    student.auto_checks = {
      ...(student.auto_checks || {}),
      ocr_confidence: 0.8,
      face_match_score: 0.75,
      duplicate_flag: false,
      last_checked_at: now,
    };
    await student.save();

    try {
      await VerificationLog.create({
        studentId: student._id,
        adminId: req.user!._id,
        action: 'auto_check',
        code: 'AUTO_CHECK_UPDATED',
        details: { auto_checks: student.auto_checks },
        timestamp: now,
      });
    } catch {}

    const socketManager = (global as any).socketManager;
    if (socketManager) {
      socketManager.emitToUser(String(student._id as mongoose.Types.ObjectId), 'verification:update', {
        auto_checks: student.auto_checks,
      });
    }

    sendSuccessResponse(res, { auto_checks: student.auto_checks }, 'Auto-check updated');
  })
);

// POST /api/verification/trial-result/:studentId
router.post(
  '/trial-result/:studentId',
  authenticateToken,
  requireEmployer,
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new ValidationError('Invalid studentId');
    }
    const { attended, rating } = req.body as { attended?: boolean; rating?: number };
    const student = await Student.findById(studentId);
    if (!student) throw new ValidationError('Student not found');

    // Update reliability metrics
    student.total_shifts = (student.total_shifts || 0) + 1;
    if (!attended) {
      student.no_shows = (student.no_shows || 0) + 1;
      student.trial_shift_status = 'failed';
    } else {
      student.trial_shift_status = 'completed';
      // Verification policy: mark verified if rating >= 4 and attended true
      if (typeof rating === 'number' && rating >= 4) {
        student.verified = true;
      }
    }
    await student.save();

    try {
      await VerificationLog.create({
        studentId: student._id,
        adminId: null,
        action: 'trial_result',
        code: attended ? 'TRIAL_ATTENDED' : 'TRIAL_NO_SHOW',
        details: { attended: !!attended, rating },
        timestamp: new Date(),
      });
    } catch {}

    const socketManager = (global as any).socketManager;
    if (socketManager) {
      socketManager.emitToUser(String(student._id as mongoose.Types.ObjectId), 'verification:update', {
        verified: student.verified,
        trial_shift_status: student.trial_shift_status,
      });
      socketManager.emitToAdmins('verification:trial_result', {
        studentId: student._id as mongoose.Types.ObjectId,
        attended: !!attended,
        rating,
      });
    }

    sendSuccessResponse(
      res,
      {
        verified: student.verified,
        trial_shift_status: student.trial_shift_status,
        reliability_score: student.reliability_score,
      },
      'Trial result recorded'
    );
  })
);

export default router;


