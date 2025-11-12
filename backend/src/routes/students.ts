import express from 'express';
import mongoose from 'mongoose';
import Student from '../models/Student';
import { verifyStudent } from '../services/studentService';
import { authenticateToken, AuthRequest, requireStudent } from '../middleware/auth';
import { asyncHandler, ValidationError, sendSuccessResponse } from '../middleware/errorHandler';

const router = express.Router();

// @route   GET /api/students/me
// @desc    Get current student's profile (students collection)
// @access  Private (Student)
router.get(
	'/me',
	authenticateToken,
	requireStudent,
	asyncHandler(async (req: AuthRequest, res: express.Response) => {
		const email = (req.user?.email || '').toLowerCase();
		const phone = String(req.user?.phone || '').trim();

		let student = await Student.findOne({ college_email: email });
		if (!student && phone) {
			student = await Student.findOne({ phone });
		}

		return sendSuccessResponse(res, { student: student || null }, 'Student profile fetched');
	})
);

// @route   PUT /api/students/me
// @desc    Create/Update current student's profile
// @access  Private (Student)
router.put(
	'/me',
	authenticateToken,
	requireStudent,
	asyncHandler(async (req: AuthRequest, res: express.Response) => {
		const body = req.body || {};
		const email = (req.user?.email || '').toLowerCase();

		const payload: any = {
			name: String(body.name || req.user?.name || '').trim(),
			phone: String(body.phone || req.user?.phone || '').trim(),
			college: String(body.college || '').trim(),
			college_email: String(body.college_email || email).toLowerCase().trim(),
			id_doc_url: String(body.id_doc_url || '').trim(),
			skills: Array.isArray(body.skills) ? body.skills.map((s: any) => String(s).trim()).filter(Boolean) : [],
			availability: Array.isArray(body.availability) ? body.availability.map((a: any) => String(a).toLowerCase().trim()).filter(Boolean) : [],
		};

		if (!payload.name || !payload.phone || !payload.college || !payload.college_email) {
			throw new ValidationError('name, phone, college and college_email are required');
		}

		// Upsert by unique college_email
		const student = await Student.findOneAndUpdate(
			{ college_email: payload.college_email },
			{ $set: payload, $setOnInsert: { verified: false, reliability_score: 0, total_shifts: 0, no_shows: 0 } },
			{ upsert: true, new: true }
		);

		// Notify admins that a student submitted/updated their profile
		try {
			const notificationService = (global as any).notificationService as any;
			if (notificationService) {
				await notificationService.notifyAdmin(
					'Student KYC Submitted/Updated',
					`Student ${payload.name} (${payload.college_email}) submitted/updated KYC profile.`,
					{
						studentId: student._id?.toString?.(),
						name: payload.name,
						college: payload.college,
						college_email: payload.college_email,
						has_id_doc: !!payload.id_doc_url
					}
				);
			}
		} catch (e) {
			console.error('Failed to notify admin about student KYC submission:', (e as any)?.message || e);
		}

		return sendSuccessResponse(res, { student }, 'Student profile saved');
	})
);

// @route   PUT /api/students/verify/:id
// @desc    Verify a student (Admin only)
// @access  Private (Admin)
router.put(
	'/verify/:id',
	authenticateToken,
	asyncHandler(async (req: AuthRequest, res: express.Response) => {
		const actor = req.user;
		if (!actor || actor.userType !== 'admin') {
			throw new ValidationError('Admin access required');
		}
		const { id } = req.params;
		if (!mongoose.isValidObjectId(id)) {
			throw new ValidationError('Invalid student id');
		}

		const updated = await verifyStudent(id);
		if (!updated.updated) {
			throw new ValidationError(updated.reason || 'Unable to verify student');
		}

		const student = await Student.findById(id);
		return sendSuccessResponse(res, { student }, 'Student verified successfully');
	})
);

export default router;


