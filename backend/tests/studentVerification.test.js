const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock auth middleware to inject roles without JWT
jest.mock('../src/middleware/auth', () => {
	return {
		authenticateToken: (req, _res, next) => {
			// Allow tests to set req.testUser
			if (req.testUser) {
				req.user = req.testUser;
			}
			next();
		},
		requireStudent: (req, _res, next) => {
			if (!req.user || req.user.userType !== 'student') {
				const err = new Error('Access denied');
				err.statusCode = 403;
				throw err;
			}
			next();
		},
		requireEmployer: (_req, _res, next) => next()
	};
});

const express = require('express');

// Import TS modules via ts-jest transform
const Student = require('../src/models/Student').default;
const User = require('../src/models/User').default;
const KYC = require('../src/models/KYC').default;
const Job = require('../src/models/Job').default;
const applicationRoutes = require('../src/routes/applications').default;
const studentsRoutes = require('../src/routes/students').default;

describe('Student KYC/Verification and Schema', () => {
	let mongod;
	let app;

	beforeAll(async () => {
		mongod = await MongoMemoryServer.create();
		const uri = mongod.getUri();
		process.env.MONGODB_URI = uri;
		await mongoose.connect(uri);

		app = express();
		app.use(express.json());
		// Middleware to inject test user
		app.use((req, _res, next) => {
			if (req.headers['x-test-user']) {
				try {
					req.testUser = JSON.parse(String(req.headers['x-test-user']));
				} catch {
					req.testUser = null;
				}
			}
			next();
		});
		app.use('/api/students', studentsRoutes);
		app.use('/api/applications', applicationRoutes);
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongod.stop();
	});

	afterEach(async () => {
		const collections = await mongoose.connection.db.collections();
		for (const collection of collections) {
			await collection.deleteMany({});
		}
	});

	test('Reject verification if college_email or id_doc_url missing', async () => {
		const s = await Student.create({
			name: 'Alice',
			phone: '1234567890',
			college: 'ABC College',
			college_email: 'alice@abc.edu',
			id_doc_url: '',
			skills: [],
			availability: [],
		});

		const res = await request(app)
			.put(`/api/students/verify/${s._id}`)
			.set('x-test-user', JSON.stringify({ _id: new mongoose.Types.ObjectId(), userType: 'admin' }));

		expect(res.statusCode).toBe(400);
	});

	test('Allow verification only if both college_email and id_doc_url exist', async () => {
		const s = await Student.create({
			name: 'Bob',
			phone: '1112223333',
			college: 'XYZ College',
			college_email: 'bob@xyz.edu',
			id_doc_url: 'https://cdn/id.png',
			skills: ['sales'],
			availability: ['weekends'],
		});

		const res = await request(app)
			.put(`/api/students/verify/${s._id}`)
			.set('x-test-user', JSON.stringify({ _id: new mongoose.Types.ObjectId(), userType: 'admin' }));

		expect(res.statusCode).toBe(200);
		expect(res.body?.data?.student?.verified).toBe(true);
	});

	test('Ensure admin-only route updates verified = true', async () => {
		const s = await Student.create({
			name: 'Cara',
			phone: '9999999999',
			college: 'LMN College',
			college_email: 'cara@lmn.edu',
			id_doc_url: 'https://cdn/id2.png',
			skills: [],
			availability: ['flexible'],
		});

		// Non-admin
		const resDenied = await request(app)
			.put(`/api/students/verify/${s._id}`)
			.set('x-test-user', JSON.stringify({ _id: new mongoose.Types.ObjectId(), userType: 'student' }));
		expect(resDenied.statusCode).toBe(400);

		// Admin
		const res = await request(app)
			.put(`/api/students/verify/${s._id}`)
			.set('x-test-user', JSON.stringify({ _id: new mongoose.Types.ObjectId(), userType: 'admin' }));
		expect(res.statusCode).toBe(200);
		expect(res.body?.data?.student?.verified).toBe(true);
	});

	test('All students have only the new fields and defaults', async () => {
		const s = await Student.create({
			name: 'Dave',
			phone: '0000000000',
			college: 'OPQ College',
			college_email: 'dave@opq.edu',
			id_doc_url: 'https://cdn/id3.png',
			skills: ['ops'],
			availability: ['weekdays'],
		});
		const obj = s.toObject();
		const keys = Object.keys(obj).filter((k) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(k));

		expect(keys.sort()).toEqual(
			[
				'name',
				'phone',
				'college',
				'college_email',
				'id_doc_url',
				'skills',
				'availability',
				'verified',
				'reliability_score',
				'total_shifts',
				'no_shows'
			].sort()
		);
		expect(obj.verified).toBe(false);
		expect(obj.reliability_score).toBe(0);
		expect(obj.total_shifts).toBe(0);
		expect(obj.no_shows).toBe(0);
	});

	test('Unique index on college_email enforced', async () => {
		await Student.create({
			name: 'Eve',
			phone: '1111111111',
			college: 'RST',
			college_email: 'eve@rst.edu',
			id_doc_url: 'x',
			skills: [],
			availability: []
		});
		await expect(
			Student.create({
				name: 'Eve 2',
				phone: '2222222222',
				college: 'RST',
				college_email: 'eve@rst.edu',
				id_doc_url: 'x2',
				skills: [],
				availability: []
			})
		).rejects.toBeTruthy();
	});

	test('Unverified students should fail when applying for a job', async () => {
		const studentUser = await User.create({
			name: 'Frank',
			email: 'frank@norix.app',
			phone: '8888888888',
			password: 'password',
			userType: 'student',
			college: 'Some College',
			role: 'user',
			isActive: true,
			emailVerified: true
		});
		const job = await Job.create({
			jobTitle: 'Helper',
			description: 'Assist with tasks',
			companyName: 'Acme',
			email: 'hr@acme.com',
			phone: '1234567890',
			location: 'City',
			salaryRange: '10-20',
			employerId: new mongoose.Types.ObjectId(),
			workType: 'Part-time',
			skillsRequired: ['help'],
			applicationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			status: 'active'
		});

		const res = await request(app)
			.post('/api/applications')
			.set('x-test-user', JSON.stringify({ _id: studentUser._id, userType: 'student' }))
			.send({ jobId: job._id.toString() });

		expect(res.statusCode).toBe(403);
		const msg = String(res.body?.message || (res.body?.error && res.body?.error.message) || '');
		expect(msg).toMatch(/KYC approved/i);
	});

	test('Verified students should appear in match results', async () => {
		await Student.create({
			name: 'Gina',
			phone: '7777777777',
			college: 'UVW',
			college_email: 'gina@uvw.edu',
			id_doc_url: 'doc',
			skills: ['sales'],
			availability: ['weekends'],
			verified: true
		});
		const verified = await Student.find({ verified: true });
		expect(verified.length).toBe(1);
		expect(verified[0].name).toBe('Gina');
	});

	test('Reliability score updates correctly after totals change', async () => {
		const s = await Student.create({
			name: 'Hank',
			phone: '6666666666',
			college: 'JKL',
			college_email: 'hank@jkl.edu',
			id_doc_url: 'doc',
			skills: [],
			availability: []
		});
		expect(s.reliability_score).toBe(0);

		s.total_shifts = 10;
		s.no_shows = 2;
		await s.save();
		// reliability = (1 - 2/10) * 100 = 80
		const reloaded = await Student.findById(s._id);
		expect(reloaded.reliability_score).toBe(80);
	});
});


