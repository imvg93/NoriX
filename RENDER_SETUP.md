# 🚀 Render Environment Variables Setup Guide

## ⚠️ Current Issue
Your backend is failing because these environment variables are missing in Render:
- `MONGODB_URI`
- `JWT_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`

## 🔧 Step-by-Step Fix

### Step 1: Access Render Dashboard
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Log into your account
3. Find your `studentjobs-backend` service

### Step 2: Add Environment Variables
1. **Click on your `studentjobs-backend` service**
2. **Click the "Environment" tab**
3. **Click "Add Environment Variable"**
4. **Add these variables one by one:**

#### Required Variables:

**1. MONGODB_URI**
```
Key: MONGODB_URI
Value: mongodb+srv://your-username:your-password@your-cluster.mongodb.net/studentjobs
```

**2. JWT_SECRET**
```
Key: JWT_SECRET
Value: your-super-secret-jwt-key-here-make-it-long-and-random
```

**3. EMAIL_USER**
```
Key: EMAIL_USER
Value: webresfolio@gmail.com
```

**4. EMAIL_PASS**
```
Key: EMAIL_PASS
Value: your-gmail-app-password-16-characters
```

### Step 3: Get Your Values

#### For MongoDB URI:
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster if you don't have one
3. Click "Connect" on your cluster
4. Choose "Connect your application"
5. Copy the connection string
6. Replace `<username>`, `<password>`, and `<database>` with your values

#### For Gmail App Password:
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings → Security → App Passwords
3. Generate an App Password for "Mail"
4. Use this 16-character password (NOT your regular Gmail password)

#### For JWT Secret:
- Generate a random string (you can use an online generator)
- Example: `my-super-secret-jwt-key-2024-studentjobs-platform-secure-123`

### Step 4: Save and Redeploy
1. After adding all variables, click **"Save Changes"**
2. Render will automatically redeploy your service
3. Wait for the deployment to complete

### Step 5: Verify Deployment
Once deployed, check:
- Backend health: `https://mework.onrender.com/health`
- Frontend: `https://mework.onrender.com`

## 🔍 Expected Success Logs

After setting the variables, you should see:
```
✅ All required environment variables are set
🚀 Starting backend server...
✅ MongoDB connected successfully
📧 Email configuration found
🚀 Server running on port 10000
```

## 🚨 Common Issues

### Issue 1: Variable Names
Make sure the variable names are exactly:
- `MONGODB_URI` (not `MONGODB_URL`)
- `JWT_SECRET` (not `JWT_TOKEN`)
- `EMAIL_USER` (not `GMAIL_USER`)

### Issue 2: Special Characters
If your values contain special characters, make sure they're properly escaped.

### Issue 3: Gmail App Password
- Don't use your regular Gmail password
- Use the 16-character App Password
- Make sure 2FA is enabled

## 📞 Need Help?

If you're still having issues:
1. Check the Render logs for specific error messages
2. Verify all environment variables are set correctly
3. Test your MongoDB connection locally first
4. Make sure your Gmail App Password is correct

## 🎯 Quick Test Values

For testing purposes, you can temporarily use:
```
MONGODB_URI=mongodb+srv://test:test@cluster0.mongodb.net/test
JWT_SECRET=test-jwt-secret-key-2024
EMAIL_USER=test@gmail.com
EMAIL_PASS=testpassword123
```

But for production, use your real values!
