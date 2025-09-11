# Cloudinary Integration Examples

This document provides comprehensive examples of how to use Cloudinary in your StudentJobs application.

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2. Installation

```bash
npm install cloudinary
```

## Basic Usage Examples

### 1. Upload User Avatar

```typescript
// Frontend (React/Next.js)
const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('/api/upload/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const result = await response.json();
  console.log('Avatar URLs:', result.data.avatarUrls);
  // Returns: { original, small, medium, large }
};

// Backend API Route
router.post('/upload/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  const result = await UploadService.uploadSingleImage(req.file, 'studentjobs/avatars');
  
  // Update user in MongoDB
  await User.findByIdAndUpdate(req.user._id, {
    profilePicture: result.secure_url,
    cloudinaryPublicId: result.public_id
  });

  res.json({ success: true, data: result });
});
```

### 2. Upload Job Poster Image

```typescript
// Frontend
const uploadJobPoster = async (jobId: string, file: File) => {
  const formData = new FormData();
  formData.append('poster', file);
  formData.append('jobId', jobId);

  const response = await fetch('/api/upload/job-poster', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return await response.json();
};

// Backend
router.post('/upload/job-poster', authenticateToken, upload.single('poster'), async (req, res) => {
  const { jobId } = req.body;
  
  // Verify job ownership
  const job = await Job.findOne({ _id: jobId, employer: req.user._id });
  if (!job) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Delete old poster if exists
  if (job.posterImagePublicId) {
    await UploadService.deleteImage(job.posterImagePublicId);
  }

  // Upload new poster
  const result = await uploadJobPoster(req.file, jobId);
  
  // Update job in MongoDB
  await Job.findByIdAndUpdate(jobId, {
    posterImage: result.secure_url,
    posterImagePublicId: result.public_id
  });

  res.json({ success: true, data: result });
});
```

### 3. Upload Company Logo

```typescript
// Frontend
const uploadCompanyLogo = async (file: File) => {
  const formData = new FormData();
  formData.append('logo', file);

  const response = await fetch('/api/upload/company-logo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const result = await response.json();
  console.log('Logo URLs:', result.data.logoUrls);
  // Returns: { original, thumbnail, medium }
};

// Backend
router.post('/upload/company-logo', authenticateToken, upload.single('logo'), async (req, res) => {
  const user = await User.findById(req.user._id);
  
  // Delete old logo if exists
  if (user.companyLogoPublicId) {
    await UploadService.deleteImage(user.companyLogoPublicId);
  }

  // Upload new logo
  const result = await uploadCompanyLogo(req.file, user._id.toString());
  
  // Update user in MongoDB
  await User.findByIdAndUpdate(req.user._id, {
    companyLogo: result.secure_url,
    companyLogoPublicId: result.public_id
  });

  res.json({ success: true, data: result });
});
```

### 4. Upload Multiple Images (Job Gallery)

```typescript
// Frontend
const uploadJobGallery = async (jobId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('gallery', file);
  });
  formData.append('jobId', jobId);

  const response = await fetch('/api/upload/job-gallery', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return await response.json();
};

// Backend
router.post('/upload/job-gallery', authenticateToken, upload.array('gallery', 5), async (req, res) => {
  const { jobId } = req.body;
  const files = req.files as Express.Multer.File[];

  // Upload multiple images
  const results = await UploadService.uploadMultipleImages(files, `studentjobs/jobs/${jobId}/gallery`);
  
  // Extract URLs and public IDs
  const imageUrls = results.map(r => r.secure_url);
  const publicIds = results.map(r => r.public_id);

  // Update job in MongoDB
  await Job.findByIdAndUpdate(jobId, {
    $push: {
      galleryImages: { $each: imageUrls },
      galleryImagePublicIds: { $each: publicIds }
    }
  });

  res.json({ success: true, data: results });
});
```

### 5. Upload KYC Documents

```typescript
// Frontend
const uploadKYCDocument = async (documentType: string, file: File) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', documentType);

  const response = await fetch('/api/upload/kyc-document', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return await response.json();
};

// Backend
router.post('/upload/kyc-document', authenticateToken, upload.single('document'), async (req, res) => {
  const { documentType } = req.body;
  
  // Upload KYC document
  const result = await uploadKYCDocument(req.file, req.user._id.toString(), documentType);
  
  // Update KYC record in MongoDB
  await KYC.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: {
        [`documents.${documentType}`]: {
          url: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date()
        }
      }
    },
    { upsert: true }
  );

  res.json({ success: true, data: result });
});
```

## Advanced Usage Examples

### 1. Image Optimization and Transformation

```typescript
// Get optimized image URLs
const getOptimizedImageUrl = (publicId: string) => {
  return UploadService.getOptimizedImageUrl(publicId, {
    width: 800,
    height: 600,
    crop: 'fill',
    quality: 'auto',
    format: 'webp'
  });
};

// Get thumbnail
const getThumbnail = (publicId: string) => {
  return UploadService.getThumbnailUrl(publicId, 150);
};

// Get profile picture in different sizes
const getProfilePicture = (publicId: string, size: 'small' | 'medium' | 'large') => {
  return UploadService.getProfilePictureUrl(publicId, size);
};
```

### 2. Delete Images

```typescript
// Delete single image
const deleteImage = async (publicId: string) => {
  const success = await UploadService.deleteImage(publicId);
  if (success) {
    // Remove from MongoDB
    await User.updateOne(
      { cloudinaryPublicId: publicId },
      { $unset: { profilePicture: 1, cloudinaryPublicId: 1 } }
    );
  }
  return success;
};

// Delete multiple images
const deleteMultipleImages = async (publicIds: string[]) => {
  const deletePromises = publicIds.map(id => UploadService.deleteImage(id));
  const results = await Promise.all(deletePromises);
  return results.every(r => r);
};
```

### 3. Frontend Integration Examples

```typescript
// React component for image upload
import React, { useState } from 'react';

const ImageUpload = ({ onUpload, folder = 'studentjobs' }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!preview) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', preview);
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      onUpload(result.data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
      <input type="file" onChange={handleFileChange} accept="image/*" />
      {preview && (
        <div>
          <img src={preview} alt="Preview" style={{ maxWidth: '200px' }} />
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
    </div>
  );
};
```

### 4. Next.js API Route Example

```typescript
// pages/api/upload/image.ts
import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { UploadService } from '../../../backend/src/services/uploadService';

const upload = multer({ dest: 'uploads/' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle file upload
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: 'Upload failed' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Upload to Cloudinary
      const result = await UploadService.uploadSingleImage(req.file, 'studentjobs');
      
      res.json({ 
        success: true, 
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          thumbnail: UploadService.getThumbnailUrl(result.public_id)
        }
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}
```

## MongoDB Integration Examples

### 1. User Model with Image Fields

```typescript
// User model already includes:
interface IUser {
  profilePicture?: string;
  cloudinaryPublicId?: string;
  companyLogo?: string;
  companyLogoPublicId?: string;
}

// Update user with new image
const updateUserImage = async (userId: string, imageUrl: string, publicId: string) => {
  return await User.findByIdAndUpdate(userId, {
    profilePicture: imageUrl,
    cloudinaryPublicId: publicId
  });
};
```

### 2. Job Model with Image Fields

```typescript
// Job model already includes:
interface IJob {
  posterImage?: string;
  posterImagePublicId?: string;
  galleryImages?: string[];
  galleryImagePublicIds?: string[];
}

// Update job with poster image
const updateJobPoster = async (jobId: string, imageUrl: string, publicId: string) => {
  return await Job.findByIdAndUpdate(jobId, {
    posterImage: imageUrl,
    posterImagePublicId: publicId
  });
};

// Add gallery images to job
const addJobGalleryImages = async (jobId: string, imageUrls: string[], publicIds: string[]) => {
  return await Job.findByIdAndUpdate(jobId, {
    $push: {
      galleryImages: { $each: imageUrls },
      galleryImagePublicIds: { $each: publicIds }
    }
  });
};
```

### 3. KYC Model Example

```typescript
// KYC model for document storage
interface IKYC {
  user: mongoose.Types.ObjectId;
  documents: {
    aadhar?: {
      url: string;
      publicId: string;
      uploadedAt: Date;
    };
    pan?: {
      url: string;
      publicId: string;
      uploadedAt: Date;
    };
    passport?: {
      url: string;
      publicId: string;
      uploadedAt: Date;
    };
  };
  status: 'pending' | 'approved' | 'rejected';
}

// Update KYC document
const updateKYCDocument = async (userId: string, documentType: string, imageUrl: string, publicId: string) => {
  return await KYC.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        [`documents.${documentType}`]: {
          url: imageUrl,
          publicId: publicId,
          uploadedAt: new Date()
        }
      }
    },
    { upsert: true }
  );
};
```

## Error Handling

```typescript
// Comprehensive error handling
const uploadWithErrorHandling = async (file: any, folder: string) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File too large');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Only images allowed');
    }

    // Upload to Cloudinary
    const result = await UploadService.uploadSingleImage(file, folder);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up temporary file
    if (file && file.path) {
      fs.unlinkSync(file.path);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};
```

## Best Practices

1. **Always validate files** before uploading
2. **Set appropriate file size limits** (5-10MB for images)
3. **Use organized folder structure** in Cloudinary
4. **Store public IDs** in MongoDB for easy deletion
5. **Implement proper error handling**
6. **Use image transformations** for optimization
7. **Clean up temporary files** after upload
8. **Implement proper authentication** for upload endpoints
9. **Use HTTPS** for secure uploads
10. **Monitor Cloudinary usage** and costs

## Security Considerations

1. **Validate file types** on both frontend and backend
2. **Implement file size limits**
3. **Use authentication** for upload endpoints
4. **Sanitize file names**
5. **Implement rate limiting** for upload endpoints
6. **Use secure URLs** from Cloudinary
7. **Regularly clean up** unused images
