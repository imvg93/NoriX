# 🔍 KYC Image Upload Debugging Guide

## 🚨 Common Issues and Solutions

### 1. **Authentication Error (401 Unauthorized)**
**Symptoms:** "Access token is required" or "Invalid token"
**Solutions:**
- Make sure you're logged in as a student
- Check if the token is expired (try logging out and back in)
- Verify the backend server is running on port 5000

### 2. **File Validation Errors**
**Symptoms:** "Only image files are allowed" or "File is too large"
**Solutions:**
- Use only image files: JPG, PNG, GIF
- Keep file size under 5MB
- Make sure the file is not corrupted

### 3. **Cloudinary Upload Errors**
**Symptoms:** "Image not uploaded. Please try again."
**Solutions:**
- Check internet connection
- Verify Cloudinary credentials are correct
- Try uploading a different image

### 4. **Network/CORS Issues**
**Symptoms:** Network errors or CORS errors in browser console
**Solutions:**
- Make sure both frontend (port 3000) and backend (port 5000) are running
- Check browser console for detailed error messages

## 🧪 Step-by-Step Testing

### Step 1: Verify Login
1. Go to: `http://localhost:3000/login`
2. Login with: `john.student@university.edu` / `password123`
3. Check if you're redirected to student dashboard

### Step 2: Access KYC Profile
1. Navigate to KYC Profile page
2. Check if the page loads without errors
3. Look for any error messages in browser console

### Step 3: Test Image Upload
1. Go to the "Documents" section
2. Try uploading a small image (under 1MB)
3. Watch both browser console and backend terminal for errors

### Step 4: Check Backend Logs
Look for these log messages in the backend terminal:
- `🔍 KYC Upload - Starting upload:`
- `✅ KYC Upload - Cloudinary upload successful:`
- `❌ KYC Upload Error:` (if there's an error)

## 🔧 Quick Fixes

### Fix 1: Restart Servers
```bash
# Stop all Node processes
taskkill /f /im node.exe

# Restart backend
cd backend
npm run dev

# Restart frontend (in new terminal)
cd frontend
npm run dev
```

### Fix 2: Clear Browser Cache
- Press Ctrl+Shift+R to hard refresh
- Or clear browser cache and cookies

### Fix 3: Check File Requirements
- File type: JPG, PNG, or GIF only
- File size: Under 5MB
- File should be a valid image

## 📞 Getting Help

If you're still having issues:
1. **Copy the exact error message** you see
2. **Check browser console** (F12 → Console tab) for errors
3. **Check backend terminal** for error logs
4. **Try with a different image file**

## 🎯 Test Credentials

**Student Login:**
- Email: `john.student@university.edu`
- Password: `password123`

**Admin Login:**
- Email: `admin@studentjobs.com`
- Password: `password123`

