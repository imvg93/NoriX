# Deployment Guide for Render

## Overview
This guide explains how to deploy the StudentJobs platform on Render.com.

## Prerequisites
1. A Render.com account
2. A MongoDB database (MongoDB Atlas recommended)
3. Gmail account with App Password for email functionality

## Environment Variables Setup

### Backend Service (`studentjobs-backend`)
Set these environment variables in your Render dashboard:

**Required Variables:**
- `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/studentjobs`)
- `JWT_SECRET`: A secure random string for JWT token signing
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASS`: Your Gmail App Password (not regular password)

**Optional Variables (already set):**
- `NODE_ENV`: production
- `PORT`: 10000
- `JWT_EXPIRES_IN`: 7d
- `FRONTEND_URL`: https://studentjobs-frontend.onrender.com
- `EMAIL_HOST`: smtp.gmail.com
- `EMAIL_PORT`: 587
- `EMAIL_SECURE`: false
- `EMAIL_ALLOW_SELF_SIGNED`: false

### Frontend Service (`studentjobs-frontend`)
Set these environment variables:

**Required Variables:**
- `NEXT_PUBLIC_API_URL`: https://studentjobs-backend.onrender.com/api

## Deployment Steps

### 1. Connect Your Repository
1. Go to your Render dashboard
2. Click "New +" and select "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file

### 2. Configure Environment Variables
1. For each service, go to "Environment" tab
2. Add the required environment variables listed above
3. Make sure to mark sensitive variables as "Sync: false"

### 3. Deploy
1. Render will automatically build and deploy both services
2. The backend will be available at: `https://studentjobs-backend.onrender.com`
3. The frontend will be available at: `https://studentjobs-frontend.onrender.com`

## Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
- Ensure your `MONGODB_URI` is correct
- Check that your MongoDB Atlas cluster allows connections from all IPs (0.0.0.0/0)
- Verify your MongoDB user has the correct permissions

**2. Email Configuration Error**
- Make sure you're using a Gmail App Password, not your regular password
- Enable 2-factor authentication on your Gmail account
- Generate an App Password specifically for this application

**3. Frontend Build Error**
- Check that all dependencies are properly installed
- Ensure the `NEXT_PUBLIC_API_URL` is set correctly

**4. CORS Errors**
- Verify that `FRONTEND_URL` is set correctly in the backend service
- Check that the frontend URL matches exactly (including protocol)

### Logs and Debugging
1. Check the logs in your Render dashboard for each service
2. Use the health check endpoint: `https://studentjobs-backend.onrender.com/health`
3. Monitor the build logs for any compilation errors

## Security Notes
- Never commit sensitive environment variables to your repository
- Use strong, unique values for `JWT_SECRET`
- Regularly rotate your Gmail App Password
- Consider using environment-specific MongoDB databases

## Performance Optimization
- The free tier has limitations on build time and runtime
- Consider upgrading to paid plans for production use
- Monitor your service usage in the Render dashboard

## Support
If you encounter issues:
1. Check the Render documentation
2. Review the logs in your Render dashboard
3. Verify all environment variables are set correctly
4. Test your MongoDB connection locally first
