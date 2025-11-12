import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student';
import User from '../models/User';
import KYC from '../models/KYC';
import Application from '../models/Application';

dotenv.config();

type SummaryItem = {
	userId: string;
	studentId?: string;
	beforeFields?: string[];
	afterFields: string[];
	action: 'created' | 'updated';
};

export async function runStudentsMigration(): Promise<{
	created: number;
	updated: number;
	indexesCreated: number;
	summary: SummaryItem[];
}> {
	const summary: SummaryItem[] = [];
	let created = 0;
	let updated = 0;
	let indexesCreated = 0;

	// Ensure indexes explicitly (autoIndex disabled globally)
	await Student.collection.createIndex({ college_email: 1 }, { unique: true, name: 'college_email_unique' }).catch(() => {});
	indexesCreated++;
	await Student.collection.createIndex({ verified: 1 }, { name: 'verified_idx' }).catch(() => {});
	indexesCreated++;
	await Student.collection.createIndex({ reliability_score: 1 }, { name: 'reliability_score_idx' }).catch(() => {});
	indexesCreated++;
	await Student.collection.createIndex({ skills: 1 }, { name: 'skills_idx' }).catch(() => {});
	indexesCreated++;
	await Student.collection.createIndex({ availability: 1 }, { name: 'availability_idx' }).catch(() => {});
	indexesCreated++;

	const students = await User.find({ userType: 'student' });
	for (const u of students) {
		const kyc = await KYC.findOne({ userId: u._id });

		// Determine id_doc_url from KYC docs
		const idDoc = kyc?.collegeIdCard || kyc?.aadharCard || '';

		// Determine availability array
		const availabilityArray = u.availability ? [String(u.availability).toLowerCase()] : [];

		// Determine verified flag
		const isVerified = (kyc?.verificationStatus === 'approved') || Boolean(u.isVerified);

		// Compute total_shifts from applications with accepted/approved/closed?
		const totalShifts = await Application.countDocuments({
			studentId: u._id,
			status: { $in: ['approved', 'accepted', 'closed'] }
		});

		// No reliable no-show data in current schema; default 0
		const noShows = 0;

		const payload = {
			name: u.name || kyc?.fullName || '',
			phone: u.phone || kyc?.phone || '',
			college: u.college || kyc?.college || '',
			college_email: u.email || kyc?.email || '',
			id_doc_url: idDoc,
			skills: (u.skills as any) || [],
			availability: availabilityArray,
			verified: isVerified,
			reliability_score: 0,
			total_shifts: totalShifts,
			no_shows: noShows
		};

		const existing = await Student.findOne({ college_email: payload.college_email });
		if (existing) {
			const before = Object.keys(existing.toObject ? existing.toObject() : (existing as any));
			await Student.updateOne({ _id: existing._id }, { $set: payload });
			const after = Object.keys(payload);
			summary.push({
				userId: String(u._id),
				studentId: String(existing._id),
				beforeFields: before,
				afterFields: after,
				action: 'updated'
			});
			updated++;
		} else {
			const createdDoc = await Student.create(payload as any);
			const after = Object.keys(payload);
			summary.push({
				userId: String(u._id),
				studentId: String(createdDoc._id),
				afterFields: after,
				action: 'created'
			});
			created++;
		}
	}

	return { created, updated, indexesCreated, summary };
}

// Allow running from CLI
if (require.main === module) {
	(async () => {
		try {
			const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentjobs';
			await mongoose.connect(uri);
			const result = await runStudentsMigration();

			console.log('=== Students Migration Summary ===');
			console.log(`Indexes created: ${result.indexesCreated}`);
			console.log(`Students created: ${result.created}`);
			console.log(`Students updated: ${result.updated}`);
			console.log('Sample (first 5) before → after field structure:');
			result.summary.slice(0, 5).forEach((s) => {
				console.log({
					userId: s.userId,
					studentId: s.studentId,
					action: s.action,
					beforeFields: s.beforeFields,
					afterFields: s.afterFields
				});
			});
			await mongoose.disconnect();
			process.exit(0);
		} catch (e) {
			console.error(e);
			process.exit(1);
		}
	})();
}


