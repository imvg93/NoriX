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
    fileSize: 10 * 1024 * 1024, // 10MB limit (Cloudinary free plan limit)
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Multer file filter - File received:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.error('❌ Multer file filter - Invalid file type:', file.mimetype);
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// @route   POST /api/debug-upload/test
// @desc    Simple test endpoint for Cloudinary upload debugging
// @access  Public (for debugging only)
router.post('/test', upload.single('image'), asyncHandler(async (req: express.Request, res: express.Response) => {
  try {
    console.log('🔍 Debug Upload - Request received');
    console.log('  Body:', req.body);
    console.log('  File:', req.file ? 'Present' : 'Not present');
    
    if (!req.file) {
      console.error('❌ Debug Upload - No file received');
      throw new ValidationError('No file uploaded');
    }

    console.log('🔍 Debug Upload - File details:');
    console.log('  Original name:', req.file.originalname);
    console.log('  Mimetype:', req.file.mimetype);
    console.log('  Size:', req.file.size, 'bytes');
    console.log('  Path:', req.file.path);
    console.log('  Fieldname:', req.file.fieldname);
    console.log('  Encoding:', req.file.encoding);

    // Check file size (Cloudinary free plan limit)
    if (req.file.size > 10 * 1024 * 1024) {
      console.error('❌ Debug Upload - File too large:', req.file.size, 'bytes');
      throw new ValidationError('File is too large (max 10MB for Cloudinary free plan)');
    }

    // Check if file exists on disk
    const fs = require('fs');
    if (!fs.existsSync(req.file.path)) {
      console.error('❌ Debug Upload - File does not exist at path:', req.file.path);
      throw new ValidationError('File does not exist on disk');
    }

    console.log('🔍 Debug Upload - Starting Cloudinary upload...');
    
    // Upload to Cloudinary with simple folder structure
    const result = await uploadImage(req.file, 'debug-uploads');
    
    console.log('🔍 Debug Upload - Cloudinary response received');
    
    // Verify upload success
    if (!result.secure_url) {
      console.error('❌ Debug Upload - No secure_url in response');
      throw new ValidationError('Image not uploaded. Please try again.');
    }

    console.log('✅ Debug Upload - Upload successful!');
    console.log('✅ Secure URL:', result.secure_url);

    sendSuccessResponse(res, { 
      message: 'Upload success',
      secure_url: result.secure_url,
      public_id: result.public_id,
      file_info: {
        original_name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    }, '✅ Upload success');
  } catch (error) {
    console.error('❌ Debug Upload Error:', error);
    throw new ValidationError('Image not uploaded. Please try again.');
  }
}));

// @route   GET /api/debug-upload/check
// @desc    Check environment and configuration
// @access  Public (for debugging only)
router.get('/check', asyncHandler(async (req: express.Request, res: express.Response) => {
  console.log('🔍 Debug Check - Environment variables:');
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing');
  console.log('  CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing');
  console.log('  CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing');

  const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                      process.env.CLOUDINARY_API_KEY && 
                      process.env.CLOUDINARY_API_SECRET;

  sendSuccessResponse(res, { 
    environment: {
      node_env: process.env.NODE_ENV,
      cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
      cloudinary_api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
      cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
    },
    is_configured: isConfigured,
    message: isConfigured ? 'Cloudinary is properly configured' : 'Cloudinary configuration is incomplete'
  }, 'Configuration check complete');
}));

export default router;
