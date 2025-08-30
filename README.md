# StudentJobs Platform

A full-stack MERN application connecting students with part-time job opportunities. Features include user authentication with Gmail OTP verification, job posting, application management, and role-based access control.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Gmail account with 2-Factor Authentication enabled

### 1. Clone and Install
```bash
git clone <repository-url>
cd studenting
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Backend Setup
```bash
cd backend
cp env.example .env
```

**Configure your `.env` file:**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/studentjobs
# OR for Atlas: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studentjobs

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail SMTP) - REQUIRED FOR OTP SYSTEM
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_ALLOW_SELF_SIGNED=false
```

### 3. Gmail SMTP Setup (Required for OTP)

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to "Security"
3. Enable "2-Step Verification"

#### Step 2: Generate App Password
1. In Security settings, find "App passwords"
2. Click "App passwords"
3. Select "Mail" as the app
4. Select "Other" as the device
5. Enter a name like "StudentJobs OTP"
6. Click "Generate"
7. **Copy the 16-character password** (you'll only see it once!)

#### Step 3: Update Environment Variables
Add your Gmail credentials to `backend/.env`:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### 4. Test Email Configuration
```bash
cd backend
npm run test:email
```

You should see: "✅ Test email sent successfully!"

### 5. Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

Visit: http://localhost:3000

## 🔧 Gmail OTP System

The application uses Gmail SMTP for sending OTP (One-Time Password) emails for:
- Email verification during signup
- Password reset functionality

### Troubleshooting Email Issues

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

## 📁 Project Structure

```
studenting/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Auth, error handling
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Email service (OTP)
│   │   └── index.ts        # Server entry point
│   ├── test-otp.js         # Email configuration test
│   └── SETUP.md            # Detailed setup guide
├── frontend/               # Next.js React app
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API service
│   │   └── lib/           # Utilities
│   └── package.json
└── README.md
```

## 🛠️ Features

### Authentication & Security
- ✅ Gmail OTP email verification
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (Student/Employer/Admin)
- ✅ Rate limiting and security middleware

### User Management
- ✅ Student registration with college/skills
- ✅ Employer registration with company details
- ✅ Email verification via OTP
- ✅ Password reset via OTP
- ✅ Profile management

### Job Management
- ✅ Job posting (Employers)
- ✅ Job browsing and filtering (Students)
- ✅ Application system
- ✅ Status tracking

### Admin Features
- ✅ User management
- ✅ Job moderation
- ✅ Platform analytics

## 🔌 API Endpoints

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

## 🚀 Production Deployment

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

## 🧪 Testing

### Test Email Configuration
```bash
cd backend
npm run test:email
```

### Health Check
```bash
curl http://localhost:5000/health
```

## 📚 Documentation

- [Backend Setup Guide](backend/SETUP.md) - Detailed backend configuration
- [Gmail SMTP Setup](backend/SETUP.md#gmail-smtp-configuration-for-otp-system) - Email configuration
- [API Documentation](backend/SETUP.md#api-endpoints) - Complete API reference

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Test email configuration with `npm run test:email`
5. Check CORS settings if frontend can't connect

For additional help, create an issue in the project repository.
