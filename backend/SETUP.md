# StudentJobs Backend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env
   ```

3. **Configure Gmail SMTP for OTP System**
   - Follow the detailed Gmail setup instructions below
   - Update your `.env` file with the correct values

4. **Start the Server**
   ```bash
   npm run dev
   ```

## Gmail SMTP Configuration for OTP System

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to "Security"
3. Enable "2-Step Verification" if not already enabled

### Step 2: Generate App Password
1. In Security settings, find "App passwords"
2. Click "App passwords"
3. Select "Mail" as the app
4. Select "Other" as the device
5. Enter a name like "StudentJobs OTP"
6. Click "Generate"
7. **Copy the 16-character password** (you'll only see it once!)

### Step 3: Update Environment Variables
Edit your `.env` file with these values:

```env
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_ALLOW_SELF_SIGNED=false
```

### Step 4: Test Email Configuration
1. Start the server: `npm run dev`
2. Check the console output for email configuration status
3. You should see: "✅ Email configuration verified successfully"

## Database Setup

### MongoDB Local Installation
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Create database: `studentjobs`

### MongoDB Atlas (Cloud)
1. Create account at https://cloud.mongodb.com
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/send-otp` - Send OTP for verification
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/forgot-password` - Send password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/avatar` - Upload avatar

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get specific job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Applications
- `POST /api/applications` - Apply to job
- `GET /api/applications/user` - Get user applications
- `GET /api/applications/job/:id` - Get job applications

## Troubleshooting

### Email Issues
1. **"Invalid credentials" error**
   - Ensure you're using App Password, not regular password
   - Regenerate App Password if needed

2. **"Connection timeout" error**
   - Check internet connection
   - Verify Gmail SMTP settings
   - Try port 465 with SSL if 587 fails

3. **"Authentication failed" error**
   - Ensure 2-Factor Authentication is enabled
   - Use the correct App Password
   - Check if Gmail account is not locked

### Database Issues
1. **Connection failed**
   - Check MongoDB service status
   - Verify connection string
   - Check network connectivity

### CORS Issues
1. **Frontend can't connect**
   - Ensure frontend is running on http://localhost:3000
   - Check CORS configuration in backend
   - Verify API URL in frontend

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studentjobs
JWT_SECRET=your-super-secret-jwt-key-here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-production-app-password
```

### Security Considerations
1. Use strong JWT secrets
2. Enable HTTPS in production
3. Set up proper CORS origins
4. Use environment-specific MongoDB URIs
5. Implement rate limiting
6. Set up proper logging

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Seed database
npm run seed
```

## File Structure

```
src/
├── config/
│   └── database.ts          # Database configuration
├── middleware/
│   ├── auth.ts             # Authentication middleware
│   ├── errorHandler.ts     # Error handling
│   └── notFound.ts         # 404 handler
├── models/
│   ├── User.ts             # User model
│   ├── Job.ts              # Job model
│   ├── Application.ts      # Application model
│   └── OTP.ts              # OTP model
├── routes/
│   ├── auth.ts             # Authentication routes
│   ├── users.ts            # User routes
│   ├── jobs.ts             # Job routes
│   ├── applications.ts     # Application routes
│   └── admin.ts            # Admin routes
├── services/
│   └── emailService.ts     # Email service for OTP
└── index.ts                # Main server file
```

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Test email configuration with the provided verification
5. Check CORS settings if frontend can't connect

