// ... existing code ...

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
