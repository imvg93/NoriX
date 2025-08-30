# 🚀 Render Deployment Guide

This guide will help you deploy your StudentJobs application to Render.

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be pushed to GitHub
2. **MongoDB Atlas Account**: For production database
3. **Gmail Account**: For email OTP functionality
4. **Render Account**: Sign up at [render.com](https://render.com)

## 🔧 Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Replace `<username>`, `<password>`, and `<cluster>` with your values

## 📧 Step 2: Gmail SMTP Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings → Security
   - Find "App passwords"
   - Select "Mail" and "Other"
   - Copy the 16-character password

## 🌐 Step 3: Render Deployment

### Option A: Using render.yaml (Recommended)

1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository: `https://github.com/imvg93/MeWork.git`

2. **Configure Environment Variables**:
   - After connecting, you'll see both services
   - For **Backend Service**, add these environment variables:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/studentjobs
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_ALLOW_SELF_SIGNED=false
```

3. **For Frontend Service**, add:
```
NEXT_PUBLIC_API_URL=https://your-backend-service-name.onrender.com/api
```

### Option B: Manual Deployment

#### Backend Service
1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `studentjobs-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

#### Frontend Service
1. Click "New" → "Static Site"
2. Configure:
   - **Name**: `studentjobs-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/out`

## 🔑 Environment Variables Reference

### Backend Required Variables:
```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studentjobs
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_ALLOW_SELF_SIGNED=false
```

### Frontend Required Variables:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-service-name.onrender.com/api
```

## 🚀 Deployment Steps

1. **Push Latest Code**:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin master
   ```

2. **Deploy on Render**:
   - Render will automatically detect the `render.yaml` file
   - It will create both services automatically
   - Set the environment variables as shown above

3. **Wait for Build**:
   - Backend build: ~5-10 minutes
   - Frontend build: ~3-5 minutes

## 🔍 Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Verify TypeScript compilation

2. **Database Connection Issues**:
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has correct permissions

3. **Email Not Working**:
   - Verify Gmail App Password
   - Check if 2FA is enabled
   - Test email configuration locally first

4. **Frontend Can't Connect to Backend**:
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check CORS settings in backend
   - Ensure backend service is running

## 📊 Monitoring

- **Backend URL**: `https://your-backend-service-name.onrender.com`
- **Frontend URL**: `https://your-frontend-service-name.onrender.com`
- **Health Check**: `https://your-backend-service-name.onrender.com/health`

## 🔄 Updates

To update your deployed application:
1. Push changes to GitHub
2. Render will automatically redeploy
3. Monitor build logs for any issues

## 📞 Support

If you encounter issues:
1. Check Render build logs
2. Verify environment variables
3. Test locally first
4. Check MongoDB Atlas connection
5. Verify Gmail SMTP settings
