import express from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { Job } from '../models/Job';
import { User } from '../models/User';
import { CustomError } from '../middleware/errorHandler';

const router = express.Router();

// Get all jobs with filters
router.get('/', async (req, res, next) => {
  try {
    const {
      location,
      type,
      category,
      salaryMin,
      salaryMax,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const filter: any = { status: 'active' };

    if (location) filter.location = { $regex: location, $options: 'i' };
    if (type) filter.type = type;
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (salaryMin || salaryMax) {
      filter.salary = {};
      if (salaryMin) filter.salary.$gte = parseInt(salaryMin as string);
      if (salaryMax) filter.salary.$lte = parseInt(salaryMax as string);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const jobs = await Job.find(filter)
      .populate('employer', 'name company industry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Job.countDocuments(filter);

    res.json({
      jobs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single job by ID
router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name company industry location description');

    if (!job) {
      throw new CustomError('Job not found', 404);
    }

    // Increment view count
    job.views += 1;
    await job.save();

    res.json(job);
  } catch (error) {
    next(error);
  }
});

// Create new job (employers only)
router.post('/', authenticateToken, requireRole(['employer']), async (req: AuthRequest, res, next) => {
  try {
    const {
      title,
      description,
      requirements,
      location,
      type,
      category,
      salary,
      benefits,
      schedule,
      startDate
    } = req.body;

    const job = new Job({
      title,
      description,
      requirements,
      location,
      type,
      category,
      salary,
      benefits,
      schedule,
      startDate,
      employer: req.user!.id,
      status: 'pending' // Requires admin approval
    });

    await job.save();

    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
});

// Update job (employer who created it or admin)
router.put('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      throw new CustomError('Job not found', 404);
    }

    // Check if user can edit this job
    if (req.user!.userType !== 'admin' && job.employer.toString() !== req.user!._id) {
      throw new CustomError('Not authorized to edit this job', 403);
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedJob);
  } catch (error) {
    next(error);
  }
});

// Delete job (employer who created it or admin)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      throw new CustomError('Job not found', 404);
    }

    // Check if user can delete this job
    if (req.user!.userType !== 'admin' && job.employer.toString() !== req.user!._id) {
      throw new CustomError('Not authorized to delete this job', 403);
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get jobs by employer
router.get('/employer/my-jobs', authenticateToken, requireRole(['employer']), async (req: AuthRequest, res, next) => {
  try {
    const jobs = await Job.find({ employer: req.user!._id })
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

// Get jobs by category
router.get('/category/:category', async (req, res, next) => {
  try {
    const jobs = await Job.find({
      category: { $regex: req.params.category, $options: 'i' },
      status: 'active'
    })
      .populate('employer', 'name company')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

// Get jobs by location
router.get('/location/:location', async (req, res, next) => {
  try {
    const jobs = await Job.find({
      location: { $regex: req.params.location, $options: 'i' },
      status: 'active'
    })
      .populate('employer', 'name company')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

// Admin: Update job status
router.patch('/:id/status', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'active', 'rejected', 'expired'].includes(status)) {
      throw new CustomError('Invalid status', 400);
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!job) {
      throw new CustomError('Job not found', 404);
    }

    res.json(job);
  } catch (error) {
    next(error);
  }
});

// Get job statistics
router.get('/stats/overview', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const stats = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'active' });
    const pendingJobs = await Job.countDocuments({ status: 'pending' });

    res.json({
      totalJobs,
      activeJobs,
      pendingJobs,
      statusBreakdown: stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;
