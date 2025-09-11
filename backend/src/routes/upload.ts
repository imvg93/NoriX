import express from 'express';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, sendSuccessResponse, ValidationError } from '../middleware/errorHandler';
import { UploadService, uploadJobPoster, uploadCompanyLogo, uploadKYCDocument } from '../services/uploadService';
import User from '../models/User';
import Job from '../models/Job';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// @route   POST /api/upload/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', authenticateToken, upload.single('avatar'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new ValidationError('User not found');
  }

  try {
    // Delete old avatar if exists
    if (user.cloudinaryPublicId) {
      await UploadService.deleteImage(user.cloudinaryPublicId);
    }

    // Upload new avatar
    const result = await UploadService.uploadSingleImage(req.file, 'studentjobs/avatars');
    
    // Update user in MongoDB
    user.profilePicture = result.secure_url;
    user.cloudinaryPublicId = result.public_id;
    await user.save();

    // Get different sized URLs for frontend
    const avatarUrls = {
      original: result.secure_url,
      small: UploadService.getProfilePictureUrl(result.public_id, 'small'),
      medium: UploadService.getProfilePictureUrl(result.public_id, 'medium'),
      large: UploadService.getProfilePictureUrl(result.public_id, 'large')
    };

    sendSuccessResponse(res, { 
      avatarUrls,
      publicId: result.public_id 
    }, 'Avatar uploaded successfully');
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw new ValidationError('Failed to upload avatar');
  }
}));

// @route   POST /api/upload/job-poster
// @desc    Upload job poster image
// @access  Private (Employers only)
router.post('/job-poster', authenticateToken, upload.single('poster'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const { jobId } = req.body;
  if (!jobId) {
    throw new ValidationError('Job ID is required');
  }

  // Verify job belongs to user
  const job = await Job.findOne({ _id: jobId, employer: req.user!._id });
  if (!job) {
    throw new ValidationError('Job not found or unauthorized');
  }

  try {
    // Delete old poster if exists
    if (job.posterImagePublicId) {
      await UploadService.deleteImage(job.posterImagePublicId);
    }

    // Upload new poster
    const result = await uploadJobPoster(req.file, jobId);
    
    // Update job in MongoDB
    job.posterImage = result.secure_url;
    job.posterImagePublicId = result.public_id;
    await job.save();

    sendSuccessResponse(res, { 
      posterImage: result.secure_url,
      publicId: result.public_id 
    }, 'Job poster uploaded successfully');
  } catch (error) {
    console.error('Job poster upload error:', error);
    throw new ValidationError('Failed to upload job poster');
  }
}));

// @route   POST /api/upload/company-logo
// @desc    Upload company logo
// @access  Private (Employers only)
router.post('/company-logo', authenticateToken, upload.single('logo'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const user = await User.findById(req.user!._id);
  if (!user || user.userType !== 'employer') {
    throw new ValidationError('Only employers can upload company logos');
  }

  try {
    // Delete old logo if exists
    if (user.companyLogoPublicId) {
      await UploadService.deleteImage(user.companyLogoPublicId);
    }

    // Upload new logo
    const result = await uploadCompanyLogo(req.file, (user._id as any).toString());
    
    // Update user in MongoDB
    user.companyLogo = result.secure_url;
    user.companyLogoPublicId = result.public_id;
    await user.save();

    // Get optimized logo URLs
    const logoUrls = {
      original: result.secure_url,
      thumbnail: UploadService.getThumbnailUrl(result.public_id, 100),
      medium: UploadService.getOptimizedImageUrl(result.public_id, {
        width: 200,
        height: 200,
        crop: 'fill',
        quality: 'auto'
      })
    };

    sendSuccessResponse(res, { 
      logoUrls,
      publicId: result.public_id 
    }, 'Company logo uploaded successfully');
  } catch (error) {
    console.error('Company logo upload error:', error);
    throw new ValidationError('Failed to upload company logo');
  }
}));

// @route   POST /api/upload/kyc-document
// @desc    Upload KYC document
// @access  Private
router.post('/kyc-document', authenticateToken, upload.single('document'), asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const { documentType } = req.body;
  if (!documentType || !['aadhar', 'pan', 'passport', 'driving_license'].includes(documentType)) {
    throw new ValidationError('Valid document type is required');
  }

  try {
    // Upload KYC document
    const result = await uploadKYCDocument(req.file, req.user!._id.toString(), documentType);
    
    // Here you would typically update a KYC model or user's KYC status
    // For this example, we'll just return the upload result
    
    sendSuccessResponse(res, { 
      documentUrl: result.secure_url,
      publicId: result.public_id,
      documentType
    }, 'KYC document uploaded successfully');
  } catch (error) {
    console.error('KYC document upload error:', error);
    throw new ValidationError('Failed to upload KYC document');
  }
}));

// @route   DELETE /api/upload/:publicId
// @desc    Delete image from Cloudinary
// @access  Private
router.delete('/:publicId', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { publicId } = req.params;
  
  if (!publicId) {
    throw new ValidationError('Public ID is required');
  }

  try {
    const success = await UploadService.deleteImage(publicId);
    
    if (success) {
      sendSuccessResponse(res, {}, 'Image deleted successfully');
    } else {
      throw new ValidationError('Failed to delete image');
    }
  } catch (error) {
    console.error('Image deletion error:', error);
    throw new ValidationError('Failed to delete image');
  }
}));

export default router;
