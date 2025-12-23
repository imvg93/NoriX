import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { ValidationError } from '../middleware/errorHandler';
import InstantJob from '../models/InstantJob';
import User from '../models/User';

/**
 * Create instant job
 * @route POST /api/instant-jobs/create
 * @access Private (Employers only)
 */
export const createInstantJob = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.userType !== 'employer') {
    throw new ValidationError('Only employers can create instant jobs');
  }

  const { jobTitle, location, pay, duration, durationUnit, skillsRequired, radius } = req.body;

  if (!jobTitle || !location || !pay || !duration) {
    throw new ValidationError('Missing required fields: jobTitle, location, pay, duration');
  }

  // Calculate expiry (30 minutes from now)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const instantJob = await InstantJob.create({
    employerId: req.user._id,
    jobTitle,
    location: {
      address: location.address || location,
      latitude: location.latitude || 0,
      longitude: location.longitude || 0
    },
    pay,
    duration,
    durationUnit: durationUnit || 'hours',
    skillsRequired: skillsRequired || [],
    radius: radius || 5,
    status: 'searching',
    currentWave: 0,
    waves: [],
    expiresAt
  });

  res.json({
    success: true,
    data: instantJob,
    message: 'Instant job created successfully'
  });
};

/**
 * Get instant job status
 * @route GET /api/instant-jobs/:jobId/status
 * @access Private (Employers only)
 */
export const getInstantJobStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.userType !== 'employer') {
    throw new ValidationError('Only employers can access this endpoint');
  }

  const { jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ValidationError('Invalid job ID');
  }

  const instantJob = await InstantJob.findById(jobId);
  if (!instantJob) {
    throw new ValidationError('Instant job not found');
  }

  if (instantJob.employerId.toString() !== req.user._id.toString()) {
    throw new ValidationError('Access denied');
  }

  res.json({
    success: true,
    data: instantJob,
    message: 'Instant job status retrieved successfully'
  });
};

/**
 * Accept instant job (student)
 * @route POST /api/instant-jobs/accept
 * @access Private (Students only)
 */
export const acceptInstantJob = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.userType !== 'student') {
    throw new ValidationError('Only students can accept instant jobs');
  }

  const { jobId } = req.body;
  if (!jobId || !mongoose.isValidObjectId(jobId)) {
    throw new ValidationError('Valid job ID is required');
  }

  const instantJob = await InstantJob.findById(jobId);
  if (!instantJob) {
    throw new ValidationError('Instant job not found');
  }

  if (instantJob.status !== 'searching' && instantJob.status !== 'dispatching') {
    throw new ValidationError('Job is not available for acceptance');
  }

  // Lock the job for 90 seconds
  instantJob.lockedBy = req.user._id;
  instantJob.lockedAt = new Date();
  instantJob.lockExpiresAt = new Date(Date.now() + 90 * 1000);
  instantJob.status = 'locked';
  await instantJob.save();

  res.json({
    success: true,
    data: instantJob,
    message: 'Instant job accepted successfully'
  });
};

/**
 * Confirm or reject student (employer)
 * @route POST /api/instant-jobs/confirm
 * @access Private (Employers only)
 */
export const confirmInstantJob = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.userType !== 'employer') {
    throw new ValidationError('Only employers can confirm instant jobs');
  }

  const { jobId, action } = req.body; // action: 'confirm' or 'reject'
  if (!jobId || !mongoose.isValidObjectId(jobId)) {
    throw new ValidationError('Valid job ID is required');
  }

  const instantJob = await InstantJob.findById(jobId);
  if (!instantJob) {
    throw new ValidationError('Instant job not found');
  }

  if (instantJob.employerId.toString() !== req.user._id.toString()) {
    throw new ValidationError('Access denied');
  }

  if (instantJob.status !== 'locked') {
    throw new ValidationError('Job is not in locked state');
  }

  if (action === 'confirm') {
    instantJob.status = 'confirmed';
    instantJob.acceptedBy = instantJob.lockedBy;
    instantJob.acceptedAt = new Date();
    instantJob.lockedBy = undefined;
    instantJob.lockedAt = undefined;
    instantJob.lockExpiresAt = undefined;
  } else {
    instantJob.status = 'searching';
    instantJob.lockedBy = undefined;
    instantJob.lockedAt = undefined;
    instantJob.lockExpiresAt = undefined;
  }

  await instantJob.save();

  res.json({
    success: true,
    data: instantJob,
    message: `Instant job ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully`
  });
};

/**
 * Get contact info for confirmed instant job
 * @route GET /api/instant-jobs/:jobId/contact-info
 * @access Private (Employer or Student)
 */
export const getContactInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ValidationError('Authentication required');
  }

  const { jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ValidationError('Invalid job ID');
  }

  const instantJob = await InstantJob.findById(jobId).populate('employerId acceptedBy', 'name phone email');
  if (!instantJob) {
    throw new ValidationError('Instant job not found');
  }

  if (instantJob.status !== 'confirmed') {
    throw new ValidationError('Job must be confirmed to access contact info');
  }

  // Verify user is either employer or accepted student
  const userId = req.user._id.toString();
  const isEmployer = userId === instantJob.employerId.toString();
  const isStudent = instantJob.acceptedBy && userId === instantJob.acceptedBy.toString();

  if (!isEmployer && !isStudent) {
    throw new ValidationError('Access denied');
  }

  const contactInfo = isEmployer && instantJob.acceptedBy
    ? {
        name: (instantJob.acceptedBy as any).name,
        phone: (instantJob.acceptedBy as any).phone,
        email: (instantJob.acceptedBy as any).email
      }
    : {
        name: (instantJob.employerId as any).name,
        phone: (instantJob.employerId as any).phone,
        email: (instantJob.employerId as any).email
      };

  res.json({
    success: true,
    data: contactInfo,
    message: 'Contact info retrieved successfully'
  });
};

/**
 * Track student location for confirmed job
 * @route GET /api/instant-jobs/:jobId/track-student
 * @access Private (Employer or Student)
 */
export const trackStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ValidationError('Authentication required');
  }

  const { jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ValidationError('Invalid job ID');
  }

  const instantJob = await InstantJob.findById(jobId).populate('acceptedBy', 'name');
  if (!instantJob) {
    throw new ValidationError('Instant job not found');
  }

  if (instantJob.status !== 'confirmed') {
    throw new ValidationError('Job must be confirmed to track student');
  }

  const userId = req.user._id.toString();
  const isEmployer = userId === instantJob.employerId.toString();
  const isStudent = instantJob.acceptedBy && userId === instantJob.acceptedBy.toString();

  if (!isEmployer && !isStudent) {
    throw new ValidationError('Access denied');
  }

  res.json({
    success: true,
    data: {
      student: instantJob.acceptedBy ? {
        name: (instantJob.acceptedBy as any).name,
        arrivalStatus: instantJob.arrivalStatus,
        lastLocationUpdate: instantJob.lastLocationUpdate,
        locationHistory: instantJob.locationHistory
      } : null,
      jobLocation: instantJob.location
    },
    message: 'Tracking data retrieved successfully'
  });
};

/**
 * Confirm student arrival at job location
 * @route POST /api/instant-jobs/:jobId/confirm-arrival
 * @access Private (Student or Employer)
 */
export const confirmArrival = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ValidationError('Authentication required');
  }

  const { jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ValidationError('Invalid job ID');
  }

  const instantJob = await InstantJob.findById(jobId);
  if (!instantJob) {
    throw new ValidationError('Instant job not found');
  }

  if (instantJob.status !== 'confirmed') {
    throw new ValidationError('Job must be confirmed to confirm arrival');
  }

  const userId = req.user._id.toString();
  const isEmployer = userId === instantJob.employerId.toString();
  const isStudent = instantJob.acceptedBy && userId === instantJob.acceptedBy.toString();

  if (!isEmployer && !isStudent) {
    throw new ValidationError('Access denied');
  }

  instantJob.arrivalStatus = 'arrived';
  instantJob.arrivalConfirmedAt = new Date();
  instantJob.arrivalConfirmedBy = isEmployer ? 'employer' : 'student';
  await instantJob.save();

  res.json({
    success: true,
    data: instantJob,
    message: 'Arrival confirmed successfully'
  });
};

/**
 * Mark confirmation popup as viewed
 * @route POST /api/instant-jobs/:jobId/mark-viewed
 * @access Private (Student or Employer)
 */
export const markConfirmationViewed = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ValidationError('Authentication required');
  }

  const { jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ValidationError('Invalid job ID');
  }

  const instantJob = await InstantJob.findById(jobId);
  if (!instantJob) {
    throw new ValidationError('Instant job not found');
  }

  const userId = req.user._id.toString();
  const isEmployer = userId === instantJob.employerId.toString();
  const isStudent = instantJob.acceptedBy && userId === instantJob.acceptedBy.toString();

  if (!isEmployer && !isStudent) {
    throw new ValidationError('Access denied');
  }

  if (isEmployer) {
    instantJob.confirmationViewedByEmployer = true;
    if (!instantJob.confirmationViewedAt) {
      instantJob.confirmationViewedAt = { student: undefined, employer: new Date() } as any;
    } else {
      (instantJob.confirmationViewedAt as any).employer = new Date();
    }
  } else {
    instantJob.confirmationViewedByStudent = true;
    if (!instantJob.confirmationViewedAt) {
      instantJob.confirmationViewedAt = { student: new Date(), employer: undefined } as any;
    } else {
      (instantJob.confirmationViewedAt as any).student = new Date();
    }
  }

  await instantJob.save();

  res.json({
    success: true,
    message: 'Confirmation marked as viewed'
  });
};

/**
 * Get current active instant job for employer
 * @route GET /api/instant-jobs/current
 * @access Private (Employers only)
 */
export const getCurrentInstantJob = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.userType !== 'employer') {
    throw new ValidationError('Only employers can access this endpoint');
  }

  // Find the most recent confirmed or dispatching instant job for this employer
  const instantJob = await InstantJob.findOne({
    employerId: req.user._id,
    status: { $in: ['confirmed', 'dispatching', 'locked', 'searching'] }
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!instantJob) {
    res.json({
      success: true,
      data: null,
      message: 'No active instant job found'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      jobId: instantJob._id.toString(),
      status: instantJob.status,
      jobTitle: instantJob.jobTitle
    },
    message: 'Current instant job retrieved successfully'
  });
};
