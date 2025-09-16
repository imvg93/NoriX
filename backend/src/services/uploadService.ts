import { uploadImage, deleteImage, getImageUrl } from '../config/cloudinary';
import { Request } from 'express';

export interface UploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export class UploadService {
  /**
   * Upload a single image to Cloudinary
   */
  static async uploadSingleImage(file: any, folder: string = 'studentjobs'): Promise<UploadResult> {
    try {
      const result = await uploadImage(file, folder);
      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('Upload service error:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Upload multiple images to Cloudinary
   */
  static async uploadMultipleImages(files: any[], folder: string = 'studentjobs'): Promise<UploadResult[]> {
    try {
      const uploadPromises = files.map(file => this.uploadSingleImage(file, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple upload service error:', error);
      throw new Error('Failed to upload images');
    }
  }

  /**
   * Delete an image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await deleteImage(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Delete service error:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedImageUrl(publicId: string, options: {
    width?: number;
    height?: number;
    quality?: string | number;
    format?: string;
    crop?: string;
  } = {}): string {
    const transformations: any = {
      quality: options.quality || 'auto',
      fetch_format: options.format || 'auto',
    };

    if (options.width || options.height) {
      transformations.width = options.width;
      transformations.height = options.height;
      transformations.crop = options.crop || 'fill';
    }

    return getImageUrl(publicId, transformations);
  }

  /**
   * Get thumbnail URL
   */
  static getThumbnailUrl(publicId: string, size: number = 150): string {
    return this.getOptimizedImageUrl(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      quality: 'auto'
    });
  }

  /**
   * Get profile picture URL with different sizes
   */
  static getProfilePictureUrl(publicId: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const sizes = {
      small: 100,
      medium: 200,
      large: 400
    };

    return this.getOptimizedImageUrl(publicId, {
      width: sizes[size],
      height: sizes[size],
      crop: 'fill',
      quality: 'auto'
    });
  }
}

// Example usage functions for different scenarios

/**
 * Example: Upload job poster image
 */
export async function uploadJobPoster(file: any, jobId: string): Promise<UploadResult> {
  return await UploadService.uploadSingleImage(file, `studentjobs/jobs/${jobId}`);
}

/**
 * Example: Upload company logo
 */
export async function uploadCompanyLogo(file: any, companyId: string): Promise<UploadResult> {
  return await UploadService.uploadSingleImage(file, `studentjobs/companies/${companyId}`);
}

/**
 * Example: Upload KYC documents
 */
export async function uploadKYCDocument(file: any, userId: string, documentType: string): Promise<UploadResult> {
  return await UploadService.uploadSingleImage(file, `studentjobs/kyc/${userId}/${documentType}`);
}

/**
 * Example: Upload multiple job images
 */
export async function uploadJobImages(files: any[], jobId: string): Promise<UploadResult[]> {
  return await UploadService.uploadMultipleImages(files, `studentjobs/jobs/${jobId}/gallery`);
}
