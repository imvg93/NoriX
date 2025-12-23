import express from 'express';
import { authenticateToken, requireEmployer, requireStudent, AuthRequest } from '../middleware/auth';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import { createInstantJob, getInstantJobStatus, acceptInstantJob, confirmInstantJob, getContactInfo, trackStudent, confirmArrival, markConfirmationViewed, getCurrentInstantJob } from '../controllers/instantJobController';

const router = express.Router();

// IMPORTANT: Specific routes (without :jobId) must come BEFORE parameterized routes
// to avoid route conflicts

/**
 * @route   POST /api/instant-jobs/create
 * @desc    Create instant job
 * @access  Private (Employers only)
 */
router.post('/create', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  await createInstantJob(req, res);
}));

/**
 * @route   POST /api/instant-jobs/accept
 * @desc    Accept instant job (student)
 * @access  Private (Students only)
 */
router.post('/accept', authenticateToken, requireStudent, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  await acceptInstantJob(req, res);
}));

/**
 * @route   POST /api/instant-jobs/confirm
 * @desc    Confirm or reject student (employer)
 * @access  Private (Employers only)
 */
router.post('/confirm', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  await confirmInstantJob(req, res);
}));

/**
 * @route   GET /api/instant-jobs/current
 * @desc    Get current active instant job for employer
 * @access  Private (Employers only)
 */
router.get('/current', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  await getCurrentInstantJob(req, res);
}));

/**
 * @route   POST /api/instant-jobs/test-ping
 * @desc    Test endpoint to manually trigger ping (for debugging)
 * @access  Private (Admin/Employers only)
 */
router.post('/test-ping', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { studentId, jobId } = req.body;
  
  if (!studentId || !jobId) {
    throw new ValidationError('studentId and jobId are required');
  }

  const socketManager = (global as any).socketManager;
  if (!socketManager || !socketManager.io) {
    throw new ValidationError('Socket.IO not available');
  }

  const roomName = `user:${studentId}`;
  const pingData = {
    jobId,
    jobTitle: 'Test Job',
    jobType: 'test',
    distance: 2.5,
    pay: '₹500',
    duration: 2,
    durationUnit: 'hours',
    location: 'Test Location',
    waveNumber: 1,
    expiresIn: 30
  };

  socketManager.io.to(roomName).emit('instant-job-ping', pingData);

  res.json({
    success: true,
    message: `Test ping sent to student ${studentId}`,
    room: roomName
  });
}));

// Parameterized routes (with :jobId) come AFTER specific routes
/**
 * @route   GET /api/instant-jobs/:jobId/status
 * @desc    Get instant job status
 * @access  Private (Employers only - own jobs)
 */
router.get('/:jobId/status', authenticateToken, requireEmployer, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  await getInstantJobStatus(req, res);
}));

/**
 * @route   GET /api/instant-jobs/:jobId/contact-info
 * @desc    Get contact info and location for confirmed instant job
 * @access  Private (Employer or Student - only for confirmed jobs)
 */
router.get('/:jobId/contact-info', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  await getContactInfo(req, res);
}));

/**
 * @route   GET /api/instant-jobs/:jobId/track-student
 * @desc    Get assigned student details with live location tracking
 * @access  Private (Employer or Student - own jobs)
 */
router.get('/:jobId/track-student', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  await trackStudent(req, res);
}));

/**
 * @route   POST /api/instant-jobs/:jobId/confirm-arrival
 * @desc    Confirm student arrival at job location
 * @access  Private (Student or Employer)
 */
router.post('/:jobId/confirm-arrival', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  await confirmArrival(req, res);
}));

/**
 * @route   POST /api/instant-jobs/:jobId/mark-viewed
 * @desc    Mark confirmation popup as viewed (read receipt)
 * @access  Private (Student or Employer)
 */
router.post('/:jobId/mark-viewed', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  await markConfirmationViewed(req, res);
}));

export default router;

