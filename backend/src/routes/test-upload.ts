import express from 'express';
import multer from 'multer';
import { uploadImage } from '../config/cloudinary';
import { asyncHandler, sendSuccessResponse, ValidationError } from '../middleware/errorHandler';

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
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// @route   POST /api/test-upload/cloudinary
// @desc    Test Cloudinary upload functionality
// @access  Public (for testing only)
router.post('/cloudinary', upload.single('image'), asyncHandler(async (req: express.Request, res: express.Response) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    console.log('🔍 Test Upload - File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Upload to Cloudinary in private mode
    const result = await uploadImage(req.file, 'studentjobs/test-uploads');
    
    console.log('🔍 Test Upload - Cloudinary response:', {
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    });

    // Verify upload success
    if (!result.secure_url) {
      throw new ValidationError('Image not uploaded. Please try again.');
    }

    sendSuccessResponse(res, { 
      message: 'Image uploaded successfully',
      secure_url: result.secure_url,
      public_id: result.public_id,
      file_info: {
        original_name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    }, 'Cloudinary upload test successful');
  } catch (error) {
    console.error('❌ Test Upload Error:', error);
    throw new ValidationError('Image not uploaded. Please try again.');
  }
}));

// @route   GET /api/test-upload/status
// @desc    Check Cloudinary configuration status
// @access  Public (for testing only)
router.get('/status', asyncHandler(async (req: express.Request, res: express.Response) => {
  const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
    api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
    api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'
  };

  const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                      process.env.CLOUDINARY_API_KEY && 
                      process.env.CLOUDINARY_API_SECRET;

  sendSuccessResponse(res, { 
    cloudinary_config: cloudinaryConfig,
    is_configured: isConfigured,
    message: isConfigured ? 'Cloudinary is properly configured' : 'Cloudinary configuration is incomplete'
  }, 'Cloudinary status check complete');
}));

export default router;
