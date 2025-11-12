import mongoose from 'mongoose';
import Student from '../models/Student';

export async function verifyStudent(studentId: string): Promise<{ updated: boolean; reason?: string }> {
	if (!mongoose.isValidObjectId(studentId)) {
		return { updated: false, reason: 'Invalid student id' };
	}
	const student = await Student.findById(studentId);
	if (!student) {
		return { updated: false, reason: 'Student not found' };
	}
	if (!student.college_email || !student.id_doc_url) {
		return { updated: false, reason: 'college_email and id_doc_url are required before verification' };
	}
	if (student.verified) {
		return { updated: true };
	}
	student.verified = true;
	await student.save();
	return { updated: true };
}

export function computeReliabilityScore(totalShifts: number, noShows: number): number {
	if (!totalShifts || totalShifts <= 0) return 0;
	const ratio = 1 - Math.min(noShows, totalShifts) / totalShifts;
	return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}


