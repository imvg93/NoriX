# 🚀 Deployment Guide for Render

This guide will help you deploy your StudentJobs application to Render.

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be pushed to GitHub
2. **MongoDB Atlas**: Set up a MongoDB Atlas cluster
3. **Gmail Account**: For OTP email functionality
4. **Render Account**: Sign up at [render.com](https://render.com)

## 🔧 Step 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Set up database access (username/password)
4. Set up network access (allow all IPs: 0.0.0.0/0)
5. Get your connection string

### 1.2 Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/studentjobs
```

## 📧 Step 2: Gmail SMTP Setup

### 2.1 Enable 2-Factor Authentication
1. Go to Google Account Settings
2. Navigate to "Security"
3. Enable "2-Step Verification"

### 2.2 Generate App Password
1. In Security settings, find "App passwords"
2. Click "App passwords"
3. Select "Mail" as the app
4. Select "Other" as the device
5. Enter a name like "StudentJobs OTP"
6. Click "Generate"
7. **Copy the 16-character password**

## 🚀 Step 3: Deploy to Render

### 3.1 Deploy Backend First

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Connect your GitHub repository
   - Select the repository: `imvg93/MeWork`

3. **Configure Backend Service**
   ```
   Name: studentjobs-backend
   Environment: Node
   Build Command: cd backend && npm install && npm run build
   Start Command: cd backend && npm start
   ```

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
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

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the URL: `https://studentjobs-backend.onrender.com`

### 3.2 Deploy Frontend

1. **Create Another Web Service**
   - Click "New +" → "Web Service"
   - Connect the same repository

2. **Configure Frontend Service**
   ```
   Name: studentjobs-frontend
   Environment: Node
   Build Command: cd frontend && npm install && npm run build
   Start Command: cd frontend && npm start
   ```

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=3000
   NEXT_PUBLIC_API_URL=https://studentjobs-backend.onrender.com/api
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the URL: `https://studentjobs-frontend.onrender.com`

## 🔍 Step 4: Verify Deployment

### 4.1 Test Backend Health
```bash
curl https://studentjobs-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "StudentJobs API is running",
  "timestamp": "2025-08-30T14:00:00.000Z",
  "environment": "production"
}
```

### 4.2 Test API Documentation
```bash
curl https://studentjobs-backend.onrender.com/api
```

### 4.3 Test Frontend
- Visit: `https://studentjobs-frontend.onrender.com`
- Try registering a new user
- Test login functionality

## 🛠️ Step 5: Troubleshooting

### 5.1 Common Issues

**Build Failures**
- Check if all dependencies are in package.json
- Verify Node.js version compatibility
- Check build logs in Render dashboard

**Database Connection Issues**
- Verify MongoDB Atlas connection string
- Check network access settings
- Ensure database user has correct permissions

**Email Issues**
- Verify Gmail App Password is correct
- Check if 2-Factor Authentication is enabled
- Test email configuration locally first

**CORS Issues**
- Verify CORS origins in backend configuration
- Check if frontend URL is included in allowed origins

### 5.2 Environment Variables Checklist

**Backend Required Variables:**
- ✅ `MONGODB_URI`
- ✅ `JWT_SECRET`
- ✅ `EMAIL_USER`
- ✅ `EMAIL_PASS`

**Frontend Required Variables:**
- ✅ `NEXT_PUBLIC_API_URL`

### 5.3 Monitoring

1. **Check Logs**
   - Go to your service in Render dashboard
   - Click on "Logs" tab
   - Monitor for errors

2. **Health Checks**
   - Backend: `https://studentjobs-backend.onrender.com/health`
   - Frontend: `https://studentjobs-frontend.onrender.com`

## 🔄 Step 6: Auto-Deployment

### 6.1 Enable Auto-Deploy
- In Render dashboard, go to your service
- Enable "Auto-Deploy" option
- Every push to main branch will trigger deployment

### 6.2 Manual Deployment
- Go to service dashboard
- Click "Manual Deploy"
- Select branch and commit

## 📊 Step 7: Performance Optimization

### 7.1 Database Optimization
- Create indexes for frequently queried fields
- Monitor database performance
- Consider connection pooling

### 7.2 Frontend Optimization
- Enable Next.js image optimization
- Use CDN for static assets
- Implement caching strategies

## 🔒 Step 8: Security

### 8.1 Environment Variables
- Never commit sensitive data to Git
- Use Render's environment variable system
- Rotate JWT secrets regularly

### 8.2 CORS Configuration
- Only allow necessary origins
- Use HTTPS in production
- Implement rate limiting

## 📞 Support

If you encounter issues:

1. Check Render documentation: [docs.render.com](https://docs.render.com)
2. Check application logs in Render dashboard
3. Verify all environment variables are set correctly
4. Test locally before deploying

## 🎉 Success!

Once deployed, your application will be available at:
- **Frontend**: `https://studentjobs-frontend.onrender.com`
- **Backend API**: `https://studentjobs-backend.onrender.com`

Your StudentJobs platform is now live and ready to connect students with part-time job opportunities! 🚀
