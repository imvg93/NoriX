import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { ValidationError, AuthorizationError } from '../middleware/errorHandler';
import InstantJob from '../models/InstantJob';
import User from '../models/User';
import { startDispatch, stopDispatch } from '../services/instantJob/dispatcher';
import { createHeldEscrow, releaseToStudent, refundEscrow, penalizeEmployerCancellation } from '../services/instantJob/escrowService';

const completionTimeouts = new Map<string, NodeJS.Timeout>();
const COMPLETION_AUTO_MS = 10 * 60 * 1000; // 10 minutes

async function scheduleAutoComplete(jobId: mongoose.Types.ObjectId) {
  const key = jobId.toString();
  if (completionTimeouts.has(key)) {
    clearTimeout(completionTimeouts.get(key) as NodeJS.Timeout);
  }
  const timeout = setTimeout(async () => {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();
      const job = await InstantJob.findById(jobId).session(session);
      if (!job) {
        await session.abortTransaction();
        return;
      }
      // Only auto-complete in_progress jobs that have a completion request
      if (job.status !== 'in_progress' || !job.completionRequestedAt) {
        await session.abortTransaction();
        return;
      }
      if (!job.escrowId || !job.acceptedBy) {
        await session.abortTransaction();
        return;
      }

      await releaseToStudent({
        escrowId: job.escrowId,
        studentId: job.acceptedBy as any,
        note: 'Auto-complete after employer inactivity',
        session
      });

      job.status = 'completed';
      job.completedAt = new Date();
      job.completionAutoCompleted = true;
      await job.save({ session });

      await session.commitTransaction();

      const payloadBase = {
        jobId: job._id.toString(),
        status: 'completed',
        timestamp: new Date().toISOString(),
        version: 1
      };
      const socketManager = (global as any).socketManager;
      if (socketManager?.io) {
        socketManager.io.to(`job:${job._id.toString()}`).emit('job:completed', payloadBase);
        socketManager.io.to(`user:${job.employerId.toString()}`).emit('employer:auto_completed', payloadBase);
        socketManager.io.to(`user:${job.employerId.toString()}`).emit('job:completed', payloadBase);
        if (job.acceptedBy) {
          socketManager.io.to(`user:${job.acceptedBy.toString()}`).emit('job:completed', payloadBase);
        }
      }
    } catch (err) {
      console.error('Auto-complete error:', err);
    } finally {
      completionTimeouts.delete(key);
    }
  }, COMPLETION_AUTO_MS);

  completionTimeouts.set(key, timeout);
}

/**
 * Create instant job
 * @route POST /api/instant-jobs/create
 * @access Private (Employers only)
 */
export const createInstantJob = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.userType !== 'employer') {
    throw new ValidationError('Only employers can create instant jobs');
  }

  const { jobType, jobTitle, location, locationLat, locationLon, pay, duration, durationUnit, skillsRequired, radius } = req.body;

  if (!jobType || !location || !pay || !duration) {
    throw new ValidationError('Missing required fields: jobType, location, pay, duration');
  }

  const numericPay = typeof pay === 'number'
    ? pay
    : Number(String(pay).replace(/[^\d.]/g, ''));

  if (Number.isNaN(numericPay) || numericPay <= 0) {
    throw new ValidationError('Pay must be a valid number greater than 0');
  }

  // Calculate expiry (30 minutes from now) - give enough time for dispatch and acceptance
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  console.log(`⏰ Job expires at: ${expiresAt}`);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [instantJob] = await InstantJob.create([{
      employerId: req.user._id,
      jobType,
      jobTitle: jobTitle || jobType,
      location: {
        address: (location as any).address || location,
        latitude: (location as any).latitude || locationLat || 0,
        longitude: (location as any).longitude || locationLon || 0
      },
      pay,
      duration,
      durationUnit: durationUnit || 'hours',
      skillsRequired: skillsRequired || [],
      radius: radius || 5,
      status: 'pending',
      currentWave: 0,
      waves: [],
      expiresAt,
      startTime: new Date()
    }], { session });

    const escrow = await createHeldEscrow({
      jobId: instantJob._id,
      employerId: req.user._id,
      amount: numericPay,
      feePercent: 10,
      session
    });

    instantJob.escrowId = escrow._id as mongoose.Types.ObjectId | undefined;
    await instantJob.save({ session });

    await session.commitTransaction();

    const jobCreatedTime = Date.now();
    console.log(`\n${'⚡'.repeat(80)}`);
    console.log(`⚡ INSTANT JOB CREATED: ${instantJob._id}`);
    console.log(`⚡ TIME: ${new Date().toISOString()}`);
    console.log(`⚡ ESCROW HELD: ${escrow._id} (amount: ${numericPay})`);
    console.log(`⚡ TRIGGERING IMMEDIATE DISPATCH - WAVE 1 SHOULD START NOW!`);
    console.log(`${'⚡'.repeat(80)}\n`);

    // Start dispatch IMMEDIATELY (fire-and-forget for instant response)
    // This should trigger wave 1 within milliseconds
    startDispatch(instantJob._id).then(result => {
      const dispatchStartTime = Date.now() - jobCreatedTime;
      if (!result.success) {
        console.error(`⚠️ Failed to start dispatch (${dispatchStartTime}ms):`, result.error);
      } else {
        console.log(`✅ Dispatch started in ${dispatchStartTime}ms for instant job ${instantJob._id}`);
      }
    }).catch(error => {
      const dispatchErrorTime = Date.now() - jobCreatedTime;
      console.error(`⚠️ Error starting dispatch (${dispatchErrorTime}ms):`, error);
    });

    res.json({
      success: true,
      data: {
        ...instantJob.toObject(),
        jobId: instantJob._id.toString() // Add jobId for frontend compatibility
      },
      message: 'Instant job created successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating instant job / escrow:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get instant job status
 * @route GET /api/instant-jobs/:jobId/status
 * @access Private (Employers only)
 */
export const getInstantJobStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ValidationError('Authentication required');
  }

  const { jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ValidationError('Invalid job ID');
  }

  // Populate lockedBy and acceptedBy with complete student information
  const instantJob = await InstantJob.findById(jobId)
    .populate('lockedBy', 'name email phone profilePicture rating completedJobs skills address college courseYear')
    .populate('acceptedBy', 'name email phone profilePicture rating completedJobs skills address college courseYear')
    .populate('employerId', 'name email phone companyName');

  if (!instantJob) {
    throw new ValidationError('Instant job not found');
  }

  // Handle both populated and non-populated employerId
  let employerIdStr: string;
  if (instantJob.employerId instanceof mongoose.Types.ObjectId) {
    employerIdStr = instantJob.employerId.toString();
  } else {
    // It's populated, get the _id from the populated object
    const populatedEmployer = instantJob.employerId as any;
    employerIdStr = populatedEmployer._id ? populatedEmployer._id.toString() : populatedEmployer.toString();
  }
  
  const userId = req.user._id.toString();
  const userType = req.user.userType;

  // Authorization check based on user role
  if (userType === 'employer') {
    // Employer: can access only if they own the job
    if (employerIdStr !== userId) {
      console.error('❌ Employer access denied:', {
        jobId,
        employerId: employerIdStr,
        requestingUserId: userId
      });
      throw new AuthorizationError('You do not have permission to access this job');
    }
  } else if (userType === 'student') {
    // Student: can access if they are lockedBy OR acceptedBy
    const isLockedStudent = instantJob.lockedBy && instantJob.lockedBy.toString() === userId;
    const isAcceptedStudent = instantJob.acceptedBy && instantJob.acceptedBy.toString() === userId;
    
    if (!isLockedStudent && !isAcceptedStudent) {
      console.error('❌ Student access denied:', {
        jobId,
        lockedBy: instantJob.lockedBy ? instantJob.lockedBy.toString() : null,
        acceptedBy: instantJob.acceptedBy ? instantJob.acceptedBy.toString() : null,
        requestingUserId: userId
      });
      throw new AuthorizationError('You do not have permission to access this job');
    }
  } else {
    throw new AuthorizationError('Invalid user type');
  }

  console.log('✅ Access granted to job status:', { userId, userType, jobId });


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

  // Enforce bans (separate from cooldown)
  const requestingStudent = await User.findById(req.user._id).select('instantBanUntil');
  const nowCheck = new Date();
  if (requestingStudent?.instantBanUntil && requestingStudent.instantBanUntil > nowCheck) {
    throw new ValidationError(`You are banned from instant jobs until ${requestingStudent.instantBanUntil.toISOString()}`);
  }

  const { jobId } = req.body;
  if (!jobId || !mongoose.isValidObjectId(jobId)) {
    throw new ValidationError('Valid job ID is required');
  }

  const instantJob = await InstantJob.findById(jobId).populate('employerId', 'name email phone companyName');
  if (!instantJob) {
    throw new ValidationError('Instant job not found');
  }

  // Check job expiry before accepting
  const now = new Date();
  if (instantJob.expiresAt && now > instantJob.expiresAt) {
    // Job expired - but allow if status is still active (might be processing)
    if (instantJob.status === 'expired' || instantJob.status === 'failed') {
      throw new ValidationError('Job has expired and is no longer available');
    }
    console.log(`⚠️ Job ${jobId} has passed expiry but status is ${instantJob.status}, allowing accept attempt`);
  }

  // Allow accepting if job is dispatching or locked (if same student)
  if (instantJob.status !== 'dispatching' && instantJob.status !== 'locked') {
    if (instantJob.status === 'expired') {
      throw new ValidationError('Job has expired');
    }
    if (instantJob.status === 'failed') {
      throw new ValidationError('Job is no longer available');
    }
    if (instantJob.status === 'completed' || instantJob.status === 'in_progress') {
      throw new ValidationError('Job is already in progress');
    }
    throw new ValidationError(`Job is not available for acceptance (status: ${instantJob.status})`);
  }

  // If already locked by another student, reject
  if (instantJob.lockedBy && instantJob.lockedBy.toString() !== req.user._id.toString()) {
    if (instantJob.lockExpiresAt && new Date() < instantJob.lockExpiresAt) {
      throw new ValidationError('Job is currently locked by another student');
    }
    // Lock expired, allow this student to accept
  }

  // Use dispatcher to handle accept (stops dispatch and locks job)
  const { handleStudentAccept } = await import('../services/instantJob/dispatcher');
  const result = await handleStudentAccept(instantJob._id, req.user._id);

  if (!result.success) {
    // Provide more detailed error message
    const errorMsg = result.error || 'Failed to accept job';
    console.error(`❌ Accept failed for job ${jobId}: ${errorMsg}`);
    throw new ValidationError(errorMsg);
  }

  // Get updated job with complete student info
  const updatedJob = await InstantJob.findById(jobId)
    .populate('lockedBy', 'name email phone profilePicture rating completedJobs skills address college courseYear')
    .populate('employerId', 'name email phone companyName');

  // Send notification to employer via Socket.IO
  const socketManager = (global as any).socketManager;
  if (socketManager && socketManager.io && updatedJob) {
    // Get employerId string (handle populated or not)
    let employerIdForRoom: string;
    if (instantJob.employerId instanceof mongoose.Types.ObjectId) {
      employerIdForRoom = instantJob.employerId.toString();
    } else {
      const populatedEmployer = instantJob.employerId as any;
      employerIdForRoom = populatedEmployer._id ? populatedEmployer._id.toString() : populatedEmployer.toString();
    }
    const employerRoom = `user:${employerIdForRoom}`;
    const studentInfo = updatedJob.lockedBy ? {
      studentId: (updatedJob.lockedBy as any)._id.toString(),
      name: (updatedJob.lockedBy as any).name,
      email: (updatedJob.lockedBy as any).email,
      phone: (updatedJob.lockedBy as any).phone,
      profilePicture: (updatedJob.lockedBy as any).profilePicture,
      rating: (updatedJob.lockedBy as any).rating || 0,
      completedJobs: (updatedJob.lockedBy as any).completedJobs || 0,
      skills: (updatedJob.lockedBy as any).skills || [],
      address: (updatedJob.lockedBy as any).address,
      college: (updatedJob.lockedBy as any).college,
      courseYear: (updatedJob.lockedBy as any).courseYear
    } : null;

    socketManager.io.to(employerRoom).emit('instant-job-student-accepted', {
      jobId: instantJob._id.toString(),
      jobTitle: instantJob.jobTitle,
      student: studentInfo,
      lockExpiresAt: result.lockExpiresAt,
      timestamp: new Date()
    });
    socketManager.io.to(employerRoom).emit('employer:student_assigned', {
      jobId: instantJob._id.toString(),
      status: 'locked',
      student: studentInfo,
      lockExpiresAt: result.lockExpiresAt,
      timestamp: new Date().toISOString(),
      version: 1
    });

    console.log(`📨 Notified employer ${instantJob.employerId} about student acceptance`);
  }

  res.json({
    success: true,
    data: {
      job: updatedJob,
      lockExpiresAt: result.lockExpiresAt
    },
    message: 'Instant job accepted successfully. Waiting for employer confirmation.'
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

  const instantJob = await InstantJob.findById(jobId)
    .populate('lockedBy', 'name email phone')
    .populate('acceptedBy', 'name email phone');
  
  if (!instantJob) {
    throw new ValidationError('Instant job not found');
  }

  // Handle both populated and non-populated employerId
  let employerIdStr: string;
  if (instantJob.employerId instanceof mongoose.Types.ObjectId) {
    employerIdStr = instantJob.employerId.toString();
  } else {
    const populatedEmployer = instantJob.employerId as any;
    employerIdStr = populatedEmployer._id ? populatedEmployer._id.toString() : populatedEmployer.toString();
  }
  
  if (employerIdStr !== req.user._id.toString()) {
    throw new ValidationError('Access denied');
  }

  if (instantJob.status !== 'locked') {
    throw new ValidationError('Job is not in locked state');
  }

  // Use dispatcher to handle confirm/reject
  const { handleEmployerConfirm } = await import('../services/instantJob/dispatcher');
  const result = await handleEmployerConfirm(instantJob._id, req.user._id, action === 'confirm');

  if (!result.success) {
    throw new ValidationError(result.error || 'Failed to confirm/reject');
  }

  // Get updated job
  const updatedJob = await InstantJob.findById(jobId)
    .populate('acceptedBy', 'name email phone profilePicture')
    .populate('employerId', 'name email phone companyName');

  // Send Socket.IO notifications
  const socketManager = (global as any).socketManager;
  if (socketManager && socketManager.io && updatedJob) {
    if (action === 'confirm' && updatedJob.acceptedBy) {
      // Notify student that they're confirmed - include job location for navigation
      const studentRoom = `user:${(updatedJob.acceptedBy as any)._id.toString()}`;
      socketManager.io.to(studentRoom).emit('instant-job-confirmed', {
        jobId: instantJob._id.toString(),
        jobTitle: instantJob.jobTitle,
        jobLocation: {
          address: instantJob.location.address,
          latitude: instantJob.location.latitude,
          longitude: instantJob.location.longitude
        },
        employer: {
          name: (updatedJob.employerId as any).name || (updatedJob.employerId as any).companyName,
          phone: (updatedJob.employerId as any).phone,
          email: (updatedJob.employerId as any).email
        },
        timestamp: new Date()
      });

      // Get student's current location for tracking
      const studentUser = await User.findById(updatedJob.acceptedBy).select('locationCoordinates');
      const studentLocation = studentUser?.locationCoordinates || null;

      // Notify employer with student details for tracking
      // Get employerId string (handle populated or not)
    let employerIdForRoom: string;
    if (instantJob.employerId instanceof mongoose.Types.ObjectId) {
      employerIdForRoom = instantJob.employerId.toString();
    } else {
      const populatedEmployer = instantJob.employerId as any;
      employerIdForRoom = populatedEmployer._id ? populatedEmployer._id.toString() : populatedEmployer.toString();
    }
    const employerRoom = `user:${employerIdForRoom}`;
      socketManager.io.to(employerRoom).emit('instant-job-student-confirmed', {
        jobId: instantJob._id.toString(),
        jobTitle: instantJob.jobTitle,
        student: {
          studentId: (updatedJob.acceptedBy as any)._id.toString(),
          name: (updatedJob.acceptedBy as any).name,
          email: (updatedJob.acceptedBy as any).email,
          phone: (updatedJob.acceptedBy as any).phone,
          profilePicture: (updatedJob.acceptedBy as any).profilePicture,
          rating: (updatedJob.acceptedBy as any).rating || 0,
          completedJobs: (updatedJob.acceptedBy as any).completedJobs || 0,
          skills: (updatedJob.acceptedBy as any).skills || [],
          address: (updatedJob.acceptedBy as any).address,
          college: (updatedJob.acceptedBy as any).college,
          courseYear: (updatedJob.acceptedBy as any).courseYear,
          currentLocation: studentLocation // Student's current location for tracking
        },
        jobLocation: instantJob.location, // Job location (employer's work location)
        timestamp: new Date()
      });

      console.log(`✅ Notified student ${(updatedJob.acceptedBy as any)._id} about confirmation`);
      console.log(`✅ Notified employer ${instantJob.employerId} with student details for tracking`);
    } else if (action === 'reject' && instantJob.lockedBy) {
      // Notify student that they were rejected
      const studentRoom = `user:${(instantJob.lockedBy as any)._id.toString()}`;
      socketManager.io.to(studentRoom).emit('instant-job-rejected', {
        jobId: instantJob._id.toString(),
        jobTitle: instantJob.jobTitle,
        timestamp: new Date()
      });

      console.log(`❌ Notified student ${(instantJob.lockedBy as any)._id} about rejection`);
    }
  }

  res.json({
    success: true,
    data: updatedJob,
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

  const instantJob = await InstantJob.findById(jobId).populate('employerId acceptedBy lockedBy', 'name phone email');
  if (!instantJob) {
    throw new ValidationError('Instant job not found');
  }

  if (!instantJob.acceptedBy && !instantJob.lockedBy) {
    throw new ValidationError('Job must have an assigned student to access contact info');
  }

  // Authorization check based on user role
  const userId = req.user._id.toString();
  const userType = req.user.userType;
  
  // Handle both populated and non-populated employerId
  let employerIdStr: string;
  if (instantJob.employerId instanceof mongoose.Types.ObjectId) {
    employerIdStr = instantJob.employerId.toString();
  } else {
    const populatedEmployer = instantJob.employerId as any;
    employerIdStr = populatedEmployer._id ? populatedEmployer._id.toString() : populatedEmployer.toString();
  }

  if (userType === 'employer') {
    // Employer: can access only if they own the job
    if (employerIdStr !== userId) {
      console.error('❌ Employer access denied:', {
        jobId,
        employerId: employerIdStr,
        requestingUserId: userId
      });
      throw new AuthorizationError('You do not have permission to access this job');
    }
  } else if (userType === 'student') {
    // Student: can access if they are lockedBy OR acceptedBy
    const isLockedStudent = instantJob.lockedBy && instantJob.lockedBy.toString() === userId;
    const isAcceptedStudent = instantJob.acceptedBy && instantJob.acceptedBy.toString() === userId;
    
    if (!isLockedStudent && !isAcceptedStudent) {
      console.error('❌ Student access denied:', {
        jobId,
        lockedBy: instantJob.lockedBy ? instantJob.lockedBy.toString() : null,
        acceptedBy: instantJob.acceptedBy ? instantJob.acceptedBy.toString() : null,
        requestingUserId: userId
      });
      throw new AuthorizationError('You do not have permission to access this job');
    }
  } else {
    throw new AuthorizationError('Invalid user type');
  }

  console.log('✅ Contact Info Access granted:', { userId, userType, jobId });


  // Get contact info and location
  if (userType === 'employer') {
    // Employer gets student contact info + student location for tracking
    const studentId = instantJob.acceptedBy || instantJob.lockedBy;
    if (studentId) {
      const student = await User.findById(studentId).select('name phone email locationCoordinates');
      res.json({
        success: true,
        data: {
          contact: {
            name: (student as any)?.name || 'Student',
            phone: (student as any)?.phone || '',
            email: (student as any)?.email || ''
          },
          studentLocation: student?.locationCoordinates || null, // Student's current location for tracking
          jobLocation: instantJob.location // Job location
        },
        message: 'Contact info retrieved successfully'
      });
    } else {
      throw new ValidationError('No student assigned to job yet');
    }
  } else {
    // Student gets employer contact info + job location
    res.json({
      success: true,
      data: {
        contact: {
          name: (instantJob.employerId as any).name || (instantJob.employerId as any).companyName,
          phone: (instantJob.employerId as any).phone,
          email: (instantJob.employerId as any).email
        },
        jobLocation: instantJob.location // Job location for student to navigate to
      },
      message: 'Contact info retrieved successfully'
    });
  }
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

  // Populate acceptedBy and lockedBy with complete student information
  const instantJob = await InstantJob.findById(jobId)
    .populate('acceptedBy', 'name email phone profilePicture rating completedJobs skills address college courseYear')
    .populate('lockedBy', 'name email phone profilePicture rating completedJobs skills address college courseYear');
  
  if (!instantJob) {
    throw new ValidationError('Instant job not found');
  }

  // Allow tracking if student is either acceptedBy or lockedBy
  if (!instantJob.acceptedBy && !instantJob.lockedBy) {
    throw new ValidationError('Job must have an assigned student to track');
  }

  const userId = req.user._id.toString();
  
  // Handle both populated and non-populated employerId
  let employerIdStr: string;
  if (instantJob.employerId instanceof mongoose.Types.ObjectId) {
    employerIdStr = instantJob.employerId.toString();
  } else {
    const populatedEmployer = instantJob.employerId as any;
    employerIdStr = populatedEmployer._id ? populatedEmployer._id.toString() : populatedEmployer.toString();
  }
  
  const isEmployer = userId === employerIdStr;
  const isAcceptedStudent = instantJob.acceptedBy && userId === instantJob.acceptedBy.toString();
  const isLockedStudent = instantJob.lockedBy && userId === instantJob.lockedBy.toString();
  const isStudent = isAcceptedStudent || isLockedStudent;

  if (!isEmployer && !isStudent) {
    throw new ValidationError('Access denied');
  }

  // Allow tracking once locked or later
  if (!['locked', 'in_progress', 'completed'].includes(instantJob.status)) {
    throw new ValidationError('Job must be locked or in progress to track student');
  }

  // Get student's current location from User model - check both acceptedBy and lockedBy
  const studentId = instantJob.acceptedBy || instantJob.lockedBy;
  let studentCurrentLocation = null;
  let studentCompleteInfo: any = null;
  if (studentId) {
    const student = await User.findById(studentId)
      .select('name email phone profilePicture rating completedJobs skills address college courseYear locationCoordinates');
    studentCurrentLocation = student?.locationCoordinates || null;
    
    // Build complete student info
    if (student) {
      studentCompleteInfo = {
        _id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        profilePicture: student.profilePicture,
        rating: student.rating || 0,
        completedJobs: student.completedJobs || 0,
        skills: student.skills || [],
        address: student.address,
        college: student.college,
        courseYear: (student as any).courseYear,
        currentLocation: studentCurrentLocation
      };
    } else {
      // Fallback to populated data - use acceptedBy if available, otherwise lockedBy
      const populatedStudent = (instantJob.acceptedBy as any) || (instantJob.lockedBy as any);
      if (populatedStudent) {
        studentCompleteInfo = {
          _id: populatedStudent._id,
          name: populatedStudent.name,
          email: populatedStudent.email,
          phone: populatedStudent.phone,
          profilePicture: populatedStudent.profilePicture,
          rating: populatedStudent.rating || 0,
          completedJobs: populatedStudent.completedJobs || 0,
          skills: populatedStudent.skills || [],
          address: populatedStudent.address,
          college: populatedStudent.college,
          courseYear: populatedStudent.courseYear,
          currentLocation: studentCurrentLocation
        };
      }
    }
  }

  console.log('📊 Track Student Response:', {
    jobId: instantJob._id,
    status: instantJob.status,
    arrivalStatus: instantJob.arrivalStatus,
    arrivalConfirmedBy: (instantJob as any).arrivalConfirmedBy,
    startTime: instantJob.startTime
  });

  res.json({
    success: true,
    data: {
      job: {
        _id: instantJob._id,
        jobTitle: instantJob.jobTitle,
        jobType: instantJob.jobType,
        pay: instantJob.pay,
        duration: instantJob.duration,
        status: instantJob.status, // ✅ CRITICAL: Include status for employer page logic
        arrivalStatus: instantJob.arrivalStatus,
        arrivalConfirmedBy: (instantJob as any).arrivalConfirmedBy,
        startTime: instantJob.startTime, // ✅ Include for timer
        lastLocationUpdate: instantJob.lastLocationUpdate,
        locationHistory: instantJob.locationHistory,
        arrivalConfirmedAt: instantJob.arrivalConfirmedAt,
        location: instantJob.location // Include job location in job object too
      },
      student: studentCompleteInfo,
      jobLocation: instantJob.location // Job location (employer's work location)
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

  if (instantJob.status !== 'locked' && instantJob.status !== 'in_progress') {
    throw new ValidationError('Job must be locked or in progress to confirm arrival');
  }

  // Authorization check based on user role
  const userId = req.user._id.toString();
  const userType = req.user.userType;
  const employerIdStr = instantJob.employerId.toString();

  if (userType === 'employer') {
    // Employer: can access only if they own the job
    if (employerIdStr !== userId) {
      throw new AuthorizationError('You do not have permission to access this job');
    }
  } else if (userType === 'student') {
    // Student: can access if they are lockedBy OR acceptedBy
    const isLockedStudent = instantJob.lockedBy && instantJob.lockedBy.toString() === userId;
    const isAcceptedStudent = instantJob.acceptedBy && instantJob.acceptedBy.toString() === userId;
    
    if (!isLockedStudent && !isAcceptedStudent) {
      throw new AuthorizationError('You do not have permission to access this job');
    }
  } else {
    throw new AuthorizationError('Invalid user type');
  }

  const isEmployer = userType === 'employer';
  const isStudent = userType === 'student';

  // Idempotent arrival confirmation
  if (instantJob.arrivalStatus === 'arrived' && instantJob.status === 'in_progress') {
    res.json({
      success: true,
      data: instantJob,
      message: 'Arrival already confirmed'
    });
    return;
  }

  const now = new Date();
  const socketManager = (global as any).socketManager;

  // STUDENT confirms arrival (marks "I've Arrived")
  if (isStudent && !isEmployer) {
    console.log('\n' + '📍'.repeat(40));
    console.log('📍 STUDENT MARKED ARRIVAL');
    console.log('📍 Job ID:', jobId);
    console.log('📍 Student ID:', userId);
    console.log('📍 Status stays: locked (work not started yet)');
    console.log('📍'.repeat(40) + '\n');
    
    instantJob.arrivalStatus = 'arrived';
    instantJob.arrivalConfirmedAt = now;
    instantJob.arrivalConfirmedBy = 'student';
    // Status stays 'locked', work hasn't started yet
    await instantJob.save();

    // Notify employer that student has arrived
    const notifyPayload = {
      jobId: instantJob._id.toString(),
      status: instantJob.status,
      arrivalStatus: 'arrived',
      studentName: userId, // For debugging
      timestamp: new Date().toISOString(),
      version: 1
    };
    if (socketManager?.io) {
      const employerRoom = `user:${instantJob.employerId.toString()}`;
      const jobRoom = `job:${instantJob._id.toString()}`;
      
      console.log('\n' + '🔔'.repeat(50));
      console.log('🔔 BACKEND: Emitting student-arrived event');
      console.log('🔔 Employer ID:', instantJob.employerId.toString());
      console.log('🔔 Employer Room:', employerRoom);
      console.log('🔔 Job Room:', jobRoom);
      console.log('🔔 Payload:', JSON.stringify(notifyPayload, null, 2));
      console.log('🔔 Total connected clients:', socketManager.io.engine.clientsCount);
      
      // Get all connected sockets in the employer's room
      const employerSockets = await socketManager.io.in(employerRoom).fetchSockets();
      console.log('🔔 Sockets in employer room:', employerSockets.length);
      employerSockets.forEach((s: any) => {
        console.log('   - Socket ID:', s.id, 'Rooms:', Array.from(s.rooms));
      });
      
      socketManager.io.to(employerRoom).emit('student-arrived', notifyPayload);
      socketManager.io.to(jobRoom).emit('student-arrived', notifyPayload);
      console.log('✅ Events emitted successfully!');
      console.log('🔔'.repeat(50) + '\n');
    } else {
      console.error('❌ Socket manager not available!');
    }

    res.json({
      success: true,
      data: instantJob,
      message: 'Arrival marked. Waiting for employer confirmation.'
    });
    return;
  }

  // EMPLOYER confirms arrival (starts work)
  if (isEmployer) {
    console.log('\n' + '🎉'.repeat(40));
    console.log('🎉 EMPLOYER CONFIRMED ARRIVAL - WORK STARTING!');
    console.log('🎉 Job ID:', jobId);
    console.log('🎉 Employer ID:', userId);
    console.log('🎉 Student ID:', instantJob.acceptedBy?.toString());
    console.log('🎉 Status changing to: in_progress');
    console.log('🎉 Timer starting NOW!');
    console.log('🎉'.repeat(40) + '\n');
    
    instantJob.arrivalStatus = 'arrived';
    instantJob.arrivalConfirmedAt = now;
    instantJob.arrivalConfirmedBy = 'employer';
    instantJob.status = 'in_progress';
    // Set work start time
    instantJob.startTime = now;
    // Once in progress, clear lock timers
    instantJob.lockedBy = instantJob.acceptedBy;
    instantJob.lockExpiresAt = undefined;
    instantJob.lockedAt = undefined;
    await instantJob.save();

    console.log('✅ Job saved to database with startTime:', instantJob.startTime);

    // Calculate expected end time
    const expectedEndTime =
      instantJob.duration && typeof instantJob.duration === 'number'
        ? new Date(instantJob.startTime.getTime() + instantJob.duration * 60 * 60 * 1000)
        : undefined;

    // Emit realtime events to notify student work has started
    const basePayload: any = {
      jobId: instantJob._id.toString(),
      status: 'in_progress',
      startTime: instantJob.startTime,
      expectedEndTime,
      arrivalStatus: 'arrived',
      duration: instantJob.duration
    };
    
    if (socketManager?.io) {
      // Notify student work has started
      if (instantJob.acceptedBy) {
        console.log('🔔 Emitting to STUDENT:', instantJob.acceptedBy.toString());
        console.log('   - student:arrival_confirmed');
        console.log('   - job:in_progress');
        socketManager.io.to(`user:${instantJob.acceptedBy.toString()}`).emit('student:arrival_confirmed', {
          ...basePayload,
          timestamp: new Date().toISOString(),
          version: 1
        });
        socketManager.io.to(`user:${instantJob.acceptedBy.toString()}`).emit('job:in_progress', {
          ...basePayload,
          timestamp: new Date().toISOString(),
          version: 1
        });
      }
      // Notify employer
      console.log('🔔 Emitting to EMPLOYER:', instantJob.employerId.toString());
      socketManager.io.to(`user:${instantJob.employerId.toString()}`).emit('employer:arrival_confirmed', {
        ...basePayload,
        timestamp: new Date().toISOString(),
        version: 1
      });
      // Notify job room
      socketManager.io.to(`job:${instantJob._id.toString()}`).emit('job:in_progress', {
        ...basePayload,
        timestamp: new Date().toISOString(),
        version: 1
      });
      console.log('✅ All socket events emitted successfully!');
    } else {
      console.error('❌ Socket manager not available!');
    }

    res.json({
      success: true,
      data: instantJob,
      message: 'Arrival confirmed. Work has started!'
    });
    return;
  }

  // Fallback (shouldn't reach here)
  res.json({
    success: true,
    data: instantJob,
    message: 'Arrival confirmation processed'
  });
};

/**
 * Employer cancels instant job
 * @route POST /api/instant-jobs/:jobId/cancel
 * @access Private (Employers only)
 */
export const cancelInstantJob = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.userType !== 'employer') {
    throw new ValidationError('Only employers can cancel instant jobs');
  }

  const { jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ValidationError('Invalid job ID');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const instantJob = await InstantJob.findById(jobId).session(session);
    if (!instantJob) {
      throw new ValidationError('Instant job not found');
    }

    const employerIdStr = instantJob.employerId instanceof mongoose.Types.ObjectId
      ? instantJob.employerId.toString()
      : (instantJob.employerId as any)._id?.toString() || (instantJob.employerId as any).toString();

    if (employerIdStr !== req.user._id.toString()) {
      throw new ValidationError('Access denied');
    }

    if (['completed', 'expired', 'failed', 'cancelled'].includes(instantJob.status)) {
      throw new ValidationError('Job cannot be cancelled in its current state');
    }

    if (!instantJob.escrowId) {
      throw new ValidationError('Escrow record missing for this job');
    }

    await stopDispatch(instantJob._id);

    const penaltyPercent = 25; // between 20-30% as required
    let penaltyApplied = false;
    let feeAmount = 0;
    let refundAmount = 0;

    const isLockedFlow = instantJob.status === 'locked' || instantJob.status === 'in_progress' || !!instantJob.lockedBy || !!instantJob.acceptedBy;

    if (isLockedFlow) {
      const penaltyResult = await penalizeEmployerCancellation({
        escrowId: instantJob.escrowId,
        penaltyPercent,
        note: 'Employer cancellation after lock',
        session
      });
      penaltyApplied = !!penaltyResult.feeAmount;
      feeAmount = penaltyResult.feeAmount;
      refundAmount = penaltyResult.refundAmount;
    } else {
      const refunded = await refundEscrow({
        escrowId: instantJob.escrowId,
        note: 'Employer cancellation before lock',
        session
      });
      refundAmount = refunded?.amount || 0;
    }

    instantJob.status = 'cancelled';
    instantJob.lockedBy = undefined;
    instantJob.lockExpiresAt = undefined;
    instantJob.lockedAt = undefined;
    instantJob.acceptedBy = undefined;
    instantJob.acceptedAt = undefined;
    instantJob.completionRequestedAt = undefined;
    instantJob.completedAt = undefined;
    await instantJob.save({ session });

    await session.commitTransaction();

    // Clear any auto-complete timer
    const key = instantJob._id.toString();
    if (completionTimeouts.has(key)) {
      clearTimeout(completionTimeouts.get(key) as NodeJS.Timeout);
      completionTimeouts.delete(key);
    }

    res.json({
      success: true,
      data: {
        jobId: instantJob._id,
        penaltyApplied,
        feeAmount,
        refundAmount
      },
      message: penaltyApplied ? 'Job cancelled with penalty' : 'Job cancelled and refunded'
    });

    const payloadBase = {
      jobId: instantJob._id.toString(),
      status: 'cancelled',
      timestamp: new Date().toISOString(),
      version: 1
    };
    const socketManager = (global as any).socketManager;
    if (socketManager?.io) {
      socketManager.io.to(`job:${instantJob._id.toString()}`).emit('job:cancelled', payloadBase);
      socketManager.io.to(`user:${instantJob.employerId.toString()}`).emit('job:cancelled', payloadBase);
      if (instantJob.acceptedBy) {
        socketManager.io.to(`user:${(instantJob.acceptedBy as any)?.toString() ?? ''}`).emit('job:cancelled', payloadBase);
      }
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Student requests completion
 * @route POST /api/instant-jobs/:jobId/complete
 * @access Private (Students only)
 */
export const requestCompletion = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.userType !== 'student') {
    throw new ValidationError('Only students can mark completion');
  }

  const { jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ValidationError('Invalid job ID');
  }

  const instantJob = await InstantJob.findById(jobId);
  if (!instantJob) {
    throw new ValidationError('Instant job not found');
  }

  // Student: can access if they are lockedBy OR acceptedBy
  const userId = req.user._id.toString();
  const isLockedStudent = instantJob.lockedBy && instantJob.lockedBy.toString() === userId;
  const isAcceptedStudent = instantJob.acceptedBy && instantJob.acceptedBy.toString() === userId;
  
  if (!isLockedStudent && !isAcceptedStudent) {
    console.error('❌ Student completion request denied:', {
      jobId,
      lockedBy: instantJob.lockedBy ? instantJob.lockedBy.toString() : null,
      acceptedBy: instantJob.acceptedBy ? instantJob.acceptedBy.toString() : null,
      requestingUserId: userId
    });
    throw new AuthorizationError('You do not have permission to access this job');
  }

  if (instantJob.status !== 'in_progress') {
    throw new ValidationError('Job is not in progress');
  }

  if (!instantJob.completionRequestedAt) {
    instantJob.completionRequestedAt = new Date();
    await instantJob.save();
  }

  await scheduleAutoComplete(instantJob._id);

  const socketManager = (global as any).socketManager;
  const payloadBase = {
    jobId: instantJob._id.toString(),
    status: instantJob.status,
    timestamp: new Date().toISOString(),
    version: 1
  };
  if (socketManager?.io) {
    const employerRoom = `user:${instantJob.employerId.toString()}`;
    console.log('🔔 Sending completion request notification to employer room:', employerRoom);
    socketManager.io.to(employerRoom).emit('employer:completion_requested', payloadBase);
    console.log('✅ Notification sent with payload:', payloadBase);
  } else {
    console.warn('⚠️ Socket.IO not available - employer will not receive real-time notification');
  }

  const autoCompleteAt = new Date((instantJob.completionRequestedAt as Date).getTime() + COMPLETION_AUTO_MS);

  res.json({
    success: true,
    data: {
      jobId: instantJob._id,
      completionRequestedAt: instantJob.completionRequestedAt,
      autoCompleteAt
    },
    message: 'Completion requested. Employer will confirm or auto-complete will run in 10 minutes.'
  });
};

/**
 * Employer confirms completion
 * @route POST /api/instant-jobs/:jobId/confirm-completion
 * @access Private (Employers only)
 */
export const confirmCompletion = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.userType !== 'employer') {
    throw new ValidationError('Only employers can confirm completion');
  }

  const { jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ValidationError('Invalid job ID');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const instantJob = await InstantJob.findById(jobId).session(session);
    if (!instantJob) {
      throw new ValidationError('Instant job not found');
    }

    const employerIdStr = instantJob.employerId instanceof mongoose.Types.ObjectId
      ? instantJob.employerId.toString()
      : (instantJob.employerId as any)._id?.toString() || (instantJob.employerId as any).toString();

    if (employerIdStr !== req.user._id.toString()) {
      throw new ValidationError('Access denied');
    }

    if (instantJob.status !== 'in_progress') {
      throw new ValidationError('Job is not in progress');
    }

    if (!instantJob.acceptedBy) {
      throw new ValidationError('No student assigned to this job');
    }

    if (!instantJob.escrowId) {
      throw new ValidationError('Escrow record missing for this job');
    }

    const key = instantJob._id.toString();
    if (completionTimeouts.has(key)) {
      clearTimeout(completionTimeouts.get(key) as NodeJS.Timeout);
      completionTimeouts.delete(key);
    }

    await releaseToStudent({
      escrowId: instantJob.escrowId,
      studentId: instantJob.acceptedBy as any,
      note: 'Employer confirmed completion',
      session
    });

    instantJob.status = 'completed';
    instantJob.completedAt = new Date();
    instantJob.completionAutoCompleted = false;
    await instantJob.save({ session });

    await session.commitTransaction();

    const payloadBase = {
      jobId: instantJob._id.toString(),
      status: 'completed',
      timestamp: new Date().toISOString(),
      version: 1
    };
    const socketManager = (global as any).socketManager;
    if (socketManager?.io) {
      socketManager.io.to(`job:${instantJob._id.toString()}`).emit('job:completed', payloadBase);
      socketManager.io.to(`user:${instantJob.employerId.toString()}`).emit('job:completed', payloadBase);
      if (instantJob.acceptedBy) {
        socketManager.io.to(`user:${instantJob.acceptedBy.toString()}`).emit('job:completed', payloadBase);
      }
    }

    res.json({
      success: true,
      data: instantJob,
      message: 'Job completed and escrow released'
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
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

  // Find the most recent active instant job for this employer
  const instantJob = await InstantJob.findOne({
    employerId: req.user._id,
    status: { $in: ['pending', 'dispatching', 'locked', 'in_progress'] }
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

/**
 * Get current active instant job for student (accepted/locked)
 * @route GET /api/instant-jobs/current-student
 * @access Private (Students only)
 */
export const getCurrentInstantJobForStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.userType !== 'student') {
    throw new ValidationError('Only students can access this endpoint');
  }

  const instantJob = await InstantJob.findOne({
    acceptedBy: req.user._id,
    status: { $in: ['locked', 'in_progress'] }
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
      jobTitle: instantJob.jobTitle,
      pay: instantJob.pay,
      duration: instantJob.duration
    },
    message: 'Current instant job retrieved successfully'
  });
};

/**
 * Get student instant job history
 * @route GET /api/instant-jobs/history
 * @access Private (Students only)
 */
export const getStudentInstantHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.userType !== 'student') {
    throw new ValidationError('Only students can access this endpoint');
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const includeActive = String(req.query.includeActive || '').toLowerCase() === 'true';

  const baseStatuses = ['completed', 'cancelled', 'expired', 'failed'];
  const activeStatuses = ['in_progress', 'locked', 'dispatching'];
  const statuses = includeActive ? baseStatuses.concat(activeStatuses) : baseStatuses;

  // Include jobs where student is either acceptedBy OR lockedBy (for jobs not yet employer-confirmed)
  const filter = {
    $or: [
      { acceptedBy: req.user._id },
      { lockedBy: req.user._id }
    ],
    status: { $in: statuses }
  };

  const [items, total] = await Promise.all([
    InstantJob.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('jobTitle jobType pay duration status createdAt completedAt arrivalStatus location acceptedBy lockedBy'),
    InstantJob.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      jobs: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    },
    message: 'Student instant job history retrieved successfully'
  });
};
