# StudentJobs Backend API

Backend API server for the StudentJobs platform built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Features

- **User Authentication**: JWT-based authentication for students, employers, and admins
- **User Management**: Complete CRUD operations for user profiles
- **Job Management**: Post, search, and manage job listings
- **Application System**: Handle job applications with status tracking
- **Admin Panel**: User verification and platform management
- **Security**: Rate limiting, input validation, and error handling
- **File Upload**: Profile pictures and resume uploads
- **Email Integration**: Password reset and notifications

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Custom validation middleware
- **Error Handling**: Custom error classes and middleware

## 📁 Project Structure

```
backend/
├── src/
│   ├── models/          # Database models
│   ├── routes/          # API route handlers
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   └── index.ts         # Main server file
├── uploads/             # File upload directory
├── dist/                # Compiled JavaScript (after build)
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── env.example          # Environment variables template
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 🔧 Environment Variables

Create a `.env` file based on `env.example`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/studentjobs

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password with token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-avatar` - Upload profile picture

### Jobs
- `GET /api/jobs` - Get all jobs (with filters)
- `POST /api/jobs` - Create new job (employers only)
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job (owner only)
- `DELETE /api/jobs/:id` - Delete job (owner only)

### Applications
- `POST /api/applications` - Apply for a job (students only)
- `GET /api/applications/my-applications` - Get user's applications
- `GET /api/applications/job/:jobId` - Get applications for a job (employer only)
- `PUT /api/applications/:id/status` - Update application status

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `PUT /api/admin/users/:id/verify` - Verify employer account
- `PUT /api/admin/jobs/:id/verify` - Verify job posting
- `GET /api/admin/users` - Get all users
- `GET /api/admin/jobs` - Get all jobs

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: Prevent abuse with configurable limits
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses
- **CORS Protection**: Configurable cross-origin requests

## 📊 Database Models

### User
- Basic info (name, email, phone, password)
- User type (student/employer/admin)
- Student-specific fields (college, skills, availability)
- Employer-specific fields (company, business type, address)
- Verification status and ratings

### Job
- Job details (title, description, requirements)
- Company and location information
- Pay and timing details
- Status tracking and analytics
- Verification and premium features

### Application
- Job application details
- Status tracking (applied, shortlisted, hired, etc.)
- Communication notes
- Rating and feedback system

## 🚀 Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests (to be implemented)

### Code Style
- TypeScript strict mode enabled
- ESLint configuration (to be added)
- Prettier formatting (to be added)
- Consistent error handling patterns

## 🔮 Future Enhancements

- **Real-time Features**: WebSocket integration for chat and notifications
- **Payment Integration**: Stripe/PayPal for premium features
- **Advanced Search**: Elasticsearch for better job matching
- **Analytics**: Detailed platform analytics and insights
- **Mobile API**: Optimized endpoints for mobile apps
- **Testing**: Comprehensive test suite with Jest
- **Documentation**: Swagger/OpenAPI documentation
- **Monitoring**: Health checks and performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For backend-related issues:
- Check the API documentation
- Review error logs
- Contact the development team

---

**StudentJobs Backend** - Powering the student job platform 🚀
