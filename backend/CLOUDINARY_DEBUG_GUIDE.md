# Cloudinary Upload Debug Guide

## 🔍 **Debugging Steps Added**

### 1. **Cloudinary Credentials Check** ✅
- Added console logs in `backend/src/config/cloudinary.ts`
- Shows if CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are loaded
- Verifies Cloudinary configuration after setup

### 2. **File Upload Debugging** ✅
- Added detailed console logs in `backend/src/config/cloudinary.ts` upload function
- Added detailed console logs in `backend/src/routes/kyc.ts` upload route
- Logs file path, size, mimetype, and full Cloudinary response

### 3. **Test Endpoint** ✅
- Created `backend/src/routes/debug-upload.ts`
- Simple endpoint: `POST /api/debug-upload/test`
- Configuration check: `GET /api/debug-upload/check`

## 🧪 **How to Debug**

### **Step 1: Check Configuration**
```bash
curl http://localhost:5000/api/debug-upload/check
```
**Expected Response:**
```json
{
  "success": true,
  "data": {
    "environment": {
      "cloudinary_cloud_name": "Set",
      "cloudinary_api_key": "Set", 
      "cloudinary_api_secret": "Set"
    },
    "is_configured": true,
    "message": "Cloudinary is properly configured"
  }
}
```

### **Step 2: Test Simple Upload**
```bash
curl -X POST -F "image=@test-image.jpg" http://localhost:5000/api/debug-upload/test
```

### **Step 3: Check Server Logs**
Look for these debug messages in your server console:

#### **✅ Good Logs (Success):**
```
🔍 Cloudinary Credentials Check:
  CLOUDINARY_CLOUD_NAME: ✅ Set
  CLOUDINARY_API_KEY: ✅ Set
  CLOUDINARY_API_SECRET: ✅ Set

🔍 Starting Cloudinary Upload:
  File path: uploads/image-1234567890.jpg
  File size: 123456
  File mimetype: image/jpeg
  Upload folder: debug-uploads

✅ Cloudinary upload successful!
✅ Secure URL: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/debug-uploads/image-1234567890.jpg
```

#### **❌ Bad Logs (Failure):**
```
🔍 Cloudinary Credentials Check:
  CLOUDINARY_CLOUD_NAME: ❌ Missing
  CLOUDINARY_API_KEY: ❌ Missing
  CLOUDINARY_API_SECRET: ❌ Missing
```

## 🔍 **Common Issues & Solutions**

### **Issue 1: Credentials Not Loaded**
**Symptoms:**
- Console shows "❌ Missing" for credentials
- Upload fails with authentication error

**Solutions:**
1. Check `.env` file exists in backend directory
2. Verify `.env` file has correct format:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```
3. Restart server after adding credentials

### **Issue 2: File Path Issues**
**Symptoms:**
- Error: "File does not exist at path"
- Multer not saving files correctly

**Solutions:**
1. Check `uploads/` directory exists
2. Verify file permissions
3. Check Multer configuration

### **Issue 3: Private Uploads Not Visible**
**Symptoms:**
- Upload succeeds but images not visible in Cloudinary Media Library
- This is **EXPECTED BEHAVIOR** for private uploads

**Explanation:**
- Private uploads (`type: 'private'`) are **NOT visible** in Media Library
- They are accessible only via secure URLs
- This is a security feature, not a bug

### **Issue 4: File Size Limits**
**Symptoms:**
- Upload fails with size error
- Cloudinary free plan has 10MB limit

**Solutions:**
1. Check file size in logs
2. Compress images if needed
3. Use smaller test files

### **Issue 5: Wrong File Type**
**Symptoms:**
- Error: "Only image files are allowed"
- Upload fails at Multer level

**Solutions:**
1. Check file mimetype in logs
2. Use proper image files (JPG, PNG, GIF)
3. Verify file extension matches content

## 🎯 **Debugging Checklist**

### **Environment Check:**
- [ ] `.env` file exists in backend directory
- [ ] `dotenv.config()` is called in `index.ts`
- [ ] Server restarted after adding credentials
- [ ] Credentials are correct (no typos)

### **File Upload Check:**
- [ ] `uploads/` directory exists
- [ ] File is saved by Multer (check `req.file.path`)
- [ ] File exists on disk before Cloudinary upload
- [ ] File size is under 10MB
- [ ] File is a valid image

### **Cloudinary Check:**
- [ ] Credentials are loaded (check console logs)
- [ ] Upload options are correct
- [ ] `secure_url` is returned in response
- [ ] Public ID is generated

### **Folder Structure Check:**
- [ ] Upload folder: `studentjobs/kyc/{userId}/{documentType}`
- [ ] Private uploads won't show in Media Library (this is normal)
- [ ] Images accessible via secure URLs

## 🚨 **Important Notes**

### **Private Uploads Behavior:**
- **Private uploads (`type: 'private'`) are NOT visible in Cloudinary Media Library**
- This is **EXPECTED BEHAVIOR** for security
- Images are accessible only via secure URLs
- If you want to see uploads in Media Library, remove `type: 'private'` temporarily

### **Folder Structure:**
- Uploads go to: `studentjobs/kyc/{userId}/{documentType}/`
- This creates nested folders in Cloudinary
- Images won't appear in root Media Library

### **Free Plan Limits:**
- Maximum file size: 10MB
- Maximum storage: 25GB
- Maximum bandwidth: 25GB/month

## 🧪 **Test Commands**

### **1. Check Configuration:**
```bash
curl http://localhost:5000/api/debug-upload/check
```

### **2. Test Upload:**
```bash
curl -X POST -F "image=@test-image.jpg" http://localhost:5000/api/debug-upload/test
```

### **3. Test KYC Upload (with auth):**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@test-image.jpg" \
  -F "documentType=aadhar" \
  http://localhost:5000/api/kyc/upload-document
```

## 📊 **Expected Results**

### **Success Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "documentUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/studentjobs/kyc/user123/aadhar/image.jpg",
    "publicId": "studentjobs/kyc/user123/aadhar/image",
    "documentType": "aadhar",
    "message": "Image uploaded successfully"
  }
}
```

### **Error Response:**
```json
{
  "success": false,
  "message": "Image not uploaded. Please try again.",
  "error": "ValidationError"
}
```

## 🎉 **Next Steps**

1. **Run the debug endpoints** to check configuration
2. **Check server console logs** for detailed debugging info
3. **Test with simple upload** first
4. **Verify credentials** are loaded correctly
5. **Check file paths** and permissions

The debugging logs will show you exactly where the issue is occurring!
