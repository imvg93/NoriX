import { v2 as cloudinary } from 'cloudinary';

// Debug: Check Cloudinary credentials
console.log('🔍 Cloudinary Credentials Check:');
console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
console.log('  CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('  CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify configuration
console.log('🔍 Cloudinary Configuration Status:');
console.log('  Cloud Name:', cloudinary.config().cloud_name || '❌ Not set');
console.log('  API Key:', cloudinary.config().api_key || '❌ Not set');
console.log('  API Secret:', cloudinary.config().api_secret ? '✅ Set' : '❌ Not set');

// Export the configured Cloudinary instance
export default cloudinary;

// Helper function to upload image
export const uploadImage = async (file: any, folder: string = 'studentjobs') => {
  try {
    console.log('🔍 Starting Cloudinary Upload:');
    console.log('  File path:', file.path);
    console.log('  File size:', file.size);
    console.log('  File mimetype:', file.mimetype);
    console.log('  File originalname:', file.originalname);
    console.log('  Upload folder:', folder);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(file.path)) {
      throw new Error(`File does not exist at path: ${file.path}`);
    }
    
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto' as const,
      quality: 'auto' as const,
      fetch_format: 'auto' as const,
      // Upload in private mode for security
      type: 'private' as const,
      // Add access control
      access_mode: 'authenticated' as const,
    };
    
    console.log('🔍 Upload options:', uploadOptions);
    
    const result = await cloudinary.uploader.upload(file.path, uploadOptions);
    
    console.log('🔍 Full Cloudinary Response:');
    console.log('  Result object keys:', Object.keys(result));
    console.log('  secure_url:', result.secure_url);
    console.log('  public_id:', result.public_id);
    console.log('  width:', result.width);
    console.log('  height:', result.height);
    console.log('  format:', result.format);
    console.log('  bytes:', result.bytes);
    console.log('  folder:', result.folder);
    console.log('  type:', result.type);
    console.log('  access_mode:', result.access_mode);
    
    // Verify upload success
    if (!result.secure_url) {
      console.error('❌ Upload failed: No secure URL returned from Cloudinary');
      console.error('❌ Full result object:', JSON.stringify(result, null, 2));
      throw new Error('Upload failed: No secure URL returned from Cloudinary');
    }
    
    console.log('✅ Cloudinary upload successful!');
    console.log('✅ Secure URL:', result.secure_url);
    console.log('✅ Public ID:', result.public_id);
    
    return result;
  } catch (error: any) {
    console.error('❌ Cloudinary Upload Error Details:');
    console.error('  Error message:', error.message);
    console.error('  Error stack:', error.stack);
    console.error('  File path attempted:', file.path);
    console.error('  Folder attempted:', folder);
    throw error;
  }
};

// Helper function to delete image
export const deleteImage = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper function to get image URL with transformations
export const getImageUrl = (publicId: string, transformations?: any) => {
  return cloudinary.url(publicId, transformations);
};
