import express from 'express';
import mongoose from 'mongoose';
import SavedJob from '../models/SavedJob';
import Job from '../models/Job';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, sendErrorResponse } from '../middleware/errorHandler';

const router = express.Router();

console.log('📦 Saved jobs routes module loaded');

// Test route to verify the router is working
router.get('/test', (req, res) => {
  console.log('✅ Test route hit');
  res.json({ success: true, message: 'Saved jobs route is working!' });
});

// Check if a job is saved (must be before /:jobId route)
router.get('/check/:jobId', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const studentId = req.user!._id;
  const jobId = req.params.jobId;

  const savedJob = await SavedJob.findOne({ studentId, jobId });

  sendSuccessResponse(res, { isSaved: !!savedJob }, 'Check completed');
}));

// Get all saved jobs for the current student
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const studentId = req.user!._id;

  const savedJobs = await SavedJob.find({ studentId })
    .populate({
      path: 'jobId',
      populate: {
        path: 'employerId',
        select: 'name email companyName'
      }
    })
    .sort({ savedAt: -1 });

  // Transform to match frontend format
  const formattedSavedJobs = savedJobs.map(savedJob => {
    const savedJobId = savedJob._id as mongoose.Types.ObjectId | string;
    const job = savedJob.jobId as any;
    const jobIdValue = job?._id as mongoose.Types.ObjectId | string;
    const savedAt = savedJob.savedAt instanceof Date ? savedJob.savedAt : new Date(savedJob.savedAt);
    return {
      _id: String(savedJobId),
      job: {
        _id: String(jobIdValue),
        title: job.jobTitle || job.title,
        company: job.companyName || job.company,
        location: job.location,
        salary: job.salaryRange || job.salary,
        type: job.workType || job.type,
        description: job.description,
        requirements: job.skillsRequired || job.requirements || [],
        highlighted: job.highlighted || false
      },
      savedDate: savedAt.toISOString().split('T')[0]
    };
  });

  sendSuccessResponse(res, { savedJobs: formattedSavedJobs }, 'Saved jobs retrieved successfully');
}));

// Save a job
router.post('/:jobId', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const studentId = req.user!._id;
  const jobId = req.params.jobId;

  console.log('💾 POST /api/saved-jobs/:jobId - Saving job:', { studentId: studentId.toString(), jobId });

  // Check if job exists
  const job = await Job.findById(jobId);
  if (!job) {
    console.log('❌ Job not found:', jobId);
    return sendErrorResponse(res, 404, 'Job not found');
  }

  // Check if already saved
  const existingSavedJob = await SavedJob.findOne({ studentId, jobId });
  if (existingSavedJob) {
    console.log('⚠️ Job already saved:', jobId);
    return sendErrorResponse(res, 400, 'Job is already saved');
  }

  // Create saved job
  const savedJob = await SavedJob.create({
    studentId,
    jobId,
    savedAt: new Date()
  });

  console.log('✅ Saved job created:', savedJob._id);

  await savedJob.populate({
    path: 'jobId',
    populate: {
      path: 'employerId',
      select: 'name email companyName'
    }
  });

  const jobData = savedJob.jobId as any;
  const savedJobId = savedJob._id as mongoose.Types.ObjectId | string;
  const formattedSavedJob = {
    _id: String(savedJobId),
    job: {
      _id: String(jobData._id as mongoose.Types.ObjectId | string),
      title: jobData.jobTitle || jobData.title,
      company: jobData.companyName || jobData.company,
      location: jobData.location,
      salary: jobData.salaryRange || jobData.salary,
      type: jobData.workType || jobData.type,
      description: jobData.description,
      requirements: jobData.skillsRequired || jobData.requirements || [],
      highlighted: jobData.highlighted || false
    },
    savedDate: savedJob.savedAt.toISOString().split('T')[0]
  };

  sendSuccessResponse(res, { savedJob: formattedSavedJob }, 'Job saved successfully');
}));

// Unsave a job (delete saved job)
router.delete('/:jobId', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const studentId = req.user!._id;
  const jobId = req.params.jobId;

  const savedJob = await SavedJob.findOneAndDelete({ studentId, jobId });

  if (!savedJob) {
    return sendErrorResponse(res, 404, 'Saved job not found');
  }

  sendSuccessResponse(res, { message: 'Job unsaved successfully' }, 'Job unsaved successfully');
}));

export default router;

