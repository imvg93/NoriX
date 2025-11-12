import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
	name: string;
	phone: string;
	college: string;
	college_email: string;
	id_doc_url: string;
	skills: string[];
	availability: string[];
	verified: boolean;
	reliability_score: number;
	total_shifts: number;
	no_shows: number;
	createdAt: Date;
	updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 100
		},
		phone: {
			type: String,
			required: true,
			trim: true
		},
		college: {
			type: String,
			required: true,
			trim: true,
			maxlength: 200
		},
		college_email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
		},
		id_doc_url: {
			type: String,
			default: ''
		},
		skills: [
			{
				type: String,
				trim: true,
				maxlength: 50
			}
		],
		availability: [
			{
				type: String,
				trim: true,
				lowercase: true,
				enum: ['weekdays', 'weekends', 'both', 'flexible', 'morning', 'evening', 'night']
			}
		],
		verified: {
			type: Boolean,
			default: false,
			index: true
		},
		reliability_score: {
			type: Number,
			default: 0,
			min: 0,
			max: 100,
			index: true
		},
		total_shifts: {
			type: Number,
			default: 0,
			min: 0
		},
		no_shows: {
			type: Number,
			default: 0,
			min: 0
		}
	},
	{
		timestamps: true
	}
);

// Unique index on college_email
studentSchema.index({ college_email: 1 }, { unique: true });
// Optional indexes to help querying
studentSchema.index({ skills: 1 }, { name: 'skills_idx' });
studentSchema.index({ availability: 1 }, { name: 'availability_idx' });

function computeReliability(totalShifts: number, noShows: number): number {
	if (!totalShifts || totalShifts <= 0) {
		return 0;
	}
	const ratio = 1 - Math.min(noShows, totalShifts) / totalShifts;
	return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

// Recalculate reliability_score whenever totals change
studentSchema.pre('save', function (next) {
	if (this.isModified('total_shifts') || this.isModified('no_shows')) {
		(this as any).reliability_score = computeReliability(this.total_shifts, this.no_shows);
	}
	next();
});

studentSchema.pre('findOneAndUpdate', function (next) {
	const update = this.getUpdate() as any;
	if (!update) return next();
	const $set = update.$set || update;
	if ($set && (typeof $set.total_shifts === 'number' || typeof $set.no_shows === 'number')) {
		// Use aggregation pipeline style update where possible, otherwise we compute after execution in post hook
	}
	next();
});

studentSchema.post('findOneAndUpdate', async function (doc: any) {
	if (!doc) return;
	// Ensure reliability_score is consistent after updates
	const recalculated = computeReliability(doc.total_shifts, doc.no_shows);
	if (doc.reliability_score !== recalculated) {
		await doc.updateOne({ $set: { reliability_score: recalculated } });
	}
});

const Student = mongoose.model<IStudent>('Student', studentSchema);
export { Student };
export default Student;


