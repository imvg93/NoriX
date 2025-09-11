import express from 'express';
import { authenticateToken, requireRole, AuthRequest, requireEmployer, optionalAuth } from '../middleware/auth';
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

    const filter: any = { 
      status: 'active',
      approvalStatus: 'approved' // Only show approved jobs to public
    };

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

// Create new job (completely public - no auth required)
router.post('/', async (req: AuthRequest, res, next) => {
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
      startDate,
      company,
      contactEmail,
      contactPhone,
      skills,
      workHours,
      shiftType,
      immediateStart,
      experience,
      education
    } = req.body;

    // Validate required fields
    if (!title || !description || !location || !salary || !company || !contactEmail) {
      throw new CustomError('Missing required fields: title, description, location, salary, company, contactEmail', 400);
    }

    // Always create/find employer by contactEmail (no auth required)
    let employer = await User.findOne({ email: contactEmail });
    if (!employer) {
      // Create a minimal employer with sensible defaults for required fields
      const tempPassword = `Temp${Math.random().toString(36).slice(2, 8)}!aA`;
      employer = new User({
        name: company,
        email: contactEmail,
        phone: contactPhone && contactPhone.replace(/\D/g, '').length >= 10 ? contactPhone : '9990000000',
        password: tempPassword,
        userType: 'employer',
        companyName: company,
        businessType: 'Other',
        address: location || 'N/A',
        isVerified: true,
        emailVerified: true
      });
      await employer.save();
    }

    // Derive and map fields required by Job schema
    const parseSalary = (salaryStr: string): { pay: number; payType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'per_task' } => {
      const normalized = String(salaryStr).toLowerCase();
      const digits = normalized.replace(/[^0-9]/g, '');
      const pay = digits ? parseInt(digits, 10) : 0;
      let payType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'per_task' = 'hourly';
      if (normalized.includes('month')) payType = 'monthly';
      else if (normalized.includes('week')) payType = 'weekly';
      else if (normalized.includes('day') || normalized.includes('daily')) payType = 'daily';
      else if (normalized.includes('hour') || normalized.includes('hr')) payType = 'hourly';
      else if (normalized.includes('task')) payType = 'per_task';
      return { pay, payType };
    };

    const { pay, payType } = parseSalary(salary);

    const now = new Date();
    const defaultExpiry = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    // Coerce requirements to string as Job schema expects string
    const requirementsString = Array.isArray(requirements)
      ? requirements.filter((r: string) => r).join(', ')
      : (requirements || '');

    // Ensure skills is an array of strings
    const skillsArray = Array.isArray(skills)
      ? skills
      : (skills ? String(skills).split(',').map((s: string) => s.trim()).filter((s: string) => s) : []);

    const job = new Job({
      title,
      description,
      requirements: requirementsString,
      location,
      type, // Full-time / Part-time etc (optional field in schema)
      category: category || 'non-it',
      salary,
      benefits,
      schedule: workHours || schedule,
      startDate: immediateStart ? now : startDate,
      employer: (employer as any)._id,
      status: 'pending', // Jobs need admin approval before going active
      approvalStatus: 'pending', // All new jobs need admin approval
      submittedAt: new Date(),
      // Additional fields
      skills: skillsArray,
      workHours,
      shiftType,
      experience,
      education,
      contactEmail,
      contactPhone,
      company,
      // Fields required by Job schema but not provided by form
      businessType: (employer as any).businessType || 'Other',
      jobType: 'Other',
      pay,
      payType,
      timing: 'Flexible',
      positions: 1,
      expiryDate: defaultExpiry
    });

    await job.save();
    
    // Populate employer info
    await job.populate('employer', 'name company email');

    res.status(201).json({
      success: true,
      job,
      message: 'Job posted successfully!'
    });
  } catch (error) {
    console.error('Error creating job:', error);
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

// Get jobs by employer (public - no authentication required for now)
router.get('/employer', async (req, res, next) => {
  try {
    // Return only approved jobs for public viewing
    const jobs = await Job.find({ 
      status: 'active',
      approvalStatus: 'approved' 
    })
      .populate('employer', 'name company email')
      .sort({ createdAt: -1 });

    res.json({ jobs });
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
