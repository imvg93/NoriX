import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse } from '../middleware/errorHandler';
import Student from '../models/Student';
import User from '../models/User';
import { getPresignedReadUrl } from '../utils/storageProvider';

export const getStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('🔍 GET /api/verification/status - Controller called', {
    userId: req.user?._id,
    userType: req.user?.userType,
    userIdType: typeof req.user?._id,
    userIdString: req.user?._id?.toString()
  });

  if (!req.user) {
    return res.status(401).json({
      ok: false,
      verified: false,
      message: "Authentication required"
    });
  }

  // Ensure userId is a valid ObjectId
  const userId = req.user._id;
  let userIdObjectId: mongoose.Types.ObjectId;
  
  try {
    if (userId instanceof mongoose.Types.ObjectId) {
      userIdObjectId = userId;
    } else if (typeof userId === 'string') {
      userIdObjectId = new mongoose.Types.ObjectId(userId);
    } else {
      userIdObjectId = new mongoose.Types.ObjectId(userId.toString());
    }
  } catch (error) {
    console.error('❌ Invalid user ID format:', userId, error);
    return res.status(400).json({
      ok: false,
      verified: false,
      message: "Invalid user ID format"
    });
  }

  console.log('🔍 Looking up user in User collection:', userIdObjectId.toString());
  
  // First, verify the user exists in User collection
  const user = await User.findById(userIdObjectId).lean();
  if (!user) {
    console.error('❌ User not found in User collection:', userIdObjectId.toString());
    return res.status(404).json({
      ok: false,
      verified: false,
      message: "User not found"
    });
  }

  console.log('✅ User found:', {
    _id: user._id,
    name: user.name,
    email: user.email,
    userType: user.userType
  });

  // Now find student record - try multiple ways to find it
  let student = await Student.findById(userIdObjectId).lean();
  
  // If not found by _id, try finding by college_email (as fallback)
  if (!student && user.email) {
    console.log('🔍 Student not found by _id, trying college_email:', user.email);
    student = await Student.findOne({ college_email: user.email.toLowerCase() }).lean();
  }

  // If student record still doesn't exist, return default status with user details
  if (!student) {
    console.log('⚠️ Student record not found for user:', userIdObjectId.toString(), '- returning default status with user details');
    
    // Return default verification status with user information
    const defaultData = {
      verified: false,
      trial_shift_status: 'not_requested' as const,
      id_doc: {
        key: null,
        submitted_at: null,
        preview_url: null,
      },
      video: {
        key: null,
        submitted_at: null,
        preview_url: null,
      },
      auto_checks: {},
      last_reviewed_by: null,
      last_reviewed_at: null,
      rejection_code: null,
      admin_notes: '',
      timeline: ['Not Started'],
      // Include user details for reference
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    };
    
    return sendSuccessResponse(res, defaultData, 'Verification status (not started)');
  }

  console.log('✅ Student found:', {
    _id: student._id,
    name: student.name,
    college: student.college,
    verified: student.verified
  });

  console.log('✅ Student found, returning status');

  const statusTimeline = (() => {
    const steps = [];
    if (!student.id_doc_url) steps.push('Not Started');
    else if (student.id_doc_url && !student.video_url) steps.push('Pending');
    else if (student.video_url && student.trial_shift_status === 'pending') steps.push('Admin Review');
    else if (student.trial_shift_status === 'assigned' || student.trial_shift_status === 'pending') steps.push('Trial Assigned');
    else if (student.verified) steps.push('Verified');
    if (student.rejection_code) steps.push('Rejected');
    return steps;
  })();

  const data = {
    verified: student.verified || false,
    trial_shift_status: student.trial_shift_status || 'not_requested',
    id_doc: {
      key: student.id_doc_url || null,
      submitted_at: student.id_submitted_at || null,
      preview_url: student.id_doc_url ? await getPresignedReadUrl({ key: student.id_doc_url }) : null,
    },
    video: {
      key: student.video_url || null,
      submitted_at: student.video_submitted_at || null,
      preview_url: student.video_url ? await getPresignedReadUrl({ key: student.video_url }) : null,
    },
    auto_checks: student.auto_checks || {},
    last_reviewed_by: student.last_reviewed_by || null,
    last_reviewed_at: student.last_reviewed_at || null,
    rejection_code: student.rejection_code || null,
    admin_notes: student.admin_notes || '',
    timeline: statusTimeline,
  };

  return sendSuccessResponse(res, data, 'Verification status');
});

