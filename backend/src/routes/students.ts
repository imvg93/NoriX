import express from 'express';
import mongoose from 'mongoose';
import Student from '../models/Student';
import { verifyStudent } from '../services/studentService';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, ValidationError, sendSuccessResponse } from '../middleware/errorHandler';

const router = express.Router();

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


