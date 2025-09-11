# Cloudinary Setup Summary

## ✅ What's Been Installed and Configured

### 1. Package Installation
- ✅ Installed `cloudinary` package in backend
- ✅ Package added to dependencies in `package.json`

### 2. Configuration Files Created
- ✅ `backend/src/config/cloudinary.ts` - Main Cloudinary configuration
- ✅ `backend/src/services/uploadService.ts` - Upload service with helper functions
- ✅ `backend/src/routes/upload.ts` - Upload API routes
- ✅ Updated `backend/src/index.ts` to include upload routes

### 3. Database Models Updated
- ✅ `User` model: Added `cloudinaryPublicId`, `companyLogo`, `companyLogoPublicId` fields
- ✅ `Job` model: Added `posterImage`, `posterImagePublicId`, `galleryImages`, `galleryImagePublicIds` fields

### 4. Environment Variables
- ✅ Added Cloudinary variables to `backend/env.template`
- ✅ Variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## 🚀 How to Use

### 1. Set Up Environment Variables
Create a `.env` file in the backend directory with:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2. Available Upload Endpoints

#### Upload User Avatar
```bash
POST /api/upload/avatar
Content-Type: multipart/form-data
Authorization: Bearer <token>
Body: { avatar: <file> }
```

#### Upload Job Poster
```bash
POST /api/upload/job-poster
Content-Type: multipart/form-data
Authorization: Bearer <token>
Body: { poster: <file>, jobId: <job_id> }
```

#### Upload Company Logo
```bash
POST /api/upload/company-logo
Content-Type: multipart/form-data
Authorization: Bearer <token>
Body: { logo: <file> }
```

#### Upload KYC Document
```bash
POST /api/upload/kyc-document
Content-Type: multipart/form-data
Authorization: Bearer <token>
Body: { document: <file>, documentType: <type> }
```

#### Delete Image
```bash
DELETE /api/upload/:publicId
Authorization: Bearer <token>
```

### 3. Frontend Usage Example

```typescript
// Upload avatar
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
```

### 4. MongoDB Integration

Images are automatically stored in MongoDB with:
- **URL**: The secure Cloudinary URL
- **Public ID**: For easy deletion and management

Example User document:
```json
{
  "_id": "...",
  "name": "John Doe",
  "profilePicture": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/studentjobs/avatars/avatar-123.jpg",
  "cloudinaryPublicId": "studentjobs/avatars/avatar-123"
}
```

## 📁 File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── cloudinary.ts          # Cloudinary configuration
│   ├── services/
│   │   └── uploadService.ts       # Upload service utilities
│   ├── routes/
│   │   └── upload.ts              # Upload API routes
│   ├── models/
│   │   ├── User.ts                # Updated with image fields
│   │   └── Job.ts                 # Updated with image fields
│   └── index.ts                   # Updated with upload routes
├── CLOUDINARY_EXAMPLES.md         # Comprehensive examples
└── CLOUDINARY_SETUP_SUMMARY.md    # This file
```

## 🔧 Key Features

### 1. Automatic Image Optimization
- Images are automatically optimized for web delivery
- Multiple size variants (small, medium, large)
- Automatic format conversion (WebP, AVIF when supported)

### 2. Organized Storage
- Images stored in organized folders:
  - `studentjobs/avatars/` - User profile pictures
  - `studentjobs/jobs/{jobId}/` - Job posters
  - `studentjobs/companies/{companyId}/` - Company logos
  - `studentjobs/kyc/{userId}/{documentType}/` - KYC documents

### 3. Easy Management
- Public IDs stored in MongoDB for easy deletion
- Automatic cleanup of old images when uploading new ones
- Helper functions for getting optimized URLs

### 4. Security
- File type validation (images only)
- File size limits (5-10MB)
- Authentication required for all uploads
- Proper error handling

## 📚 Documentation

- **Comprehensive Examples**: See `CLOUDINARY_EXAMPLES.md` for detailed usage examples
- **API Documentation**: All endpoints are documented with examples
- **Error Handling**: Proper error handling and validation included

## 🎯 Next Steps

1. **Get Cloudinary Account**: Sign up at [cloudinary.com](https://cloudinary.com)
2. **Get API Credentials**: Copy your cloud name, API key, and API secret
3. **Update Environment Variables**: Add credentials to your `.env` file
4. **Test Upload**: Use the provided endpoints to test image uploads
5. **Frontend Integration**: Use the examples to integrate with your frontend

## 🚨 Important Notes

- **File Size Limit**: 5-10MB per image
- **Supported Formats**: JPG, PNG, GIF, WebP, AVIF
- **Authentication**: All upload endpoints require valid JWT token
- **Cleanup**: Old images are automatically deleted when uploading new ones
- **Costs**: Monitor your Cloudinary usage to avoid unexpected charges

Your Cloudinary integration is now ready to use! 🎉
