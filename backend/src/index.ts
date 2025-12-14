import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/database';
import nodemailer from 'nodemailer';
import path from 'path';
import SocketManager from './utils/socketManager';
import EmailNotificationService from './services/emailNotificationService';
import NotificationService from './services/notificationService';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import jobRoutes, { setJobServices } from './routes/jobs';
import applicationRoutes, { setApplicationServices } from './routes/applications';
import adminRoutes from './routes/admin';
import adminReportsRoutes from './routes/admin-reports';
import kycRoutes from './routes/kyc';
import uploadRoutes from './routes/upload';
import testUploadRoutes from './routes/test-upload';
import debugUploadRoutes from './routes/debug-upload';
import enhancedJobRoutes from './routes/enhanced-jobs';
import notificationRoutes, { setNotificationService as setNotificationRouteService } from './routes/notifications';
import savedJobsRoutes from './routes/saved-jobs';
import profileRoutes from './routes/profile';
import studentsRoutes from './routes/students';
import verificationRoutesNew from './routes/verificationRoutes';
import verificationRoutes from './routes/verification';
import adminVerificationRoutes from './routes/admin-verification';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { botFilter } from './middleware/botFilter';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;
// Initialize Socket.IO
const socketManager = new SocketManager(server);

// Make socketManager available globally for use in routes
(global as any).socketManager = socketManager;

// Initialize services
const emailService = new EmailNotificationService();
const notificationService = new NotificationService();

// Set socket manager for notification service
notificationService.setSocketManager(socketManager);

// Inject services into routes
setJobServices(socketManager, emailService);
setApplicationServices(socketManager, emailService);
setNotificationRouteService(notificationService);

// Make notification service available globally
(global as any).notificationService = notificationService;

// Environment-aware CORS configuration
const isProduction = process.env.NODE_ENV === 'production';

// Define allowed origins with support for environment variable override
const allowedOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'https://me-work.vercel.app',
  'https://norixconnects.vercel.app',
  'https://studenting.vercel.app',
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : []),
];

const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel, Railway, and Render subdomains in production
    if (isProduction && (
      origin.includes('.vercel.app') || 
      origin.includes('.railway.app') || 
      origin.includes('.onrender.com')
    )) {
      console.log('✅ CORS: Allowing deployment origin:', origin);
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Allowing configured origin:', origin);
      return callback(null, true);
    }
    
    console.log('🚫 CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root endpoint for Railway health checks
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'StudentJobs API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'StudentJobs API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: 'enabled',
    allowedOrigins: allowedOrigins,
    origin: req.headers.origin || 'no-origin'
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    origin: req.headers.origin || 'no-origin',
    headers: {
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
});

// Bot filter middleware - should be applied before API routes
app.use(botFilter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/reports', adminReportsRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/test-upload', testUploadRoutes);
app.use('/api/debug-upload', debugUploadRoutes);
app.use('/api/enhanced-jobs', enhancedJobRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/saved-jobs', savedJobsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/students', studentsRoutes);

// Register verification routes - IMPORTANT: Register new route FIRST so it matches /status before the old route
console.log('🔧 Registering verification routes...');
app.use('/api/verification', verificationRoutesNew);
console.log('✅ verificationRoutesNew registered at /api/verification');
app.use('/api/verification', verificationRoutes);
console.log('✅ verificationRoutes registered at /api/verification');
app.use('/api/admin/verification', adminVerificationRoutes);
console.log('✅ adminVerificationRoutes registered at /api/admin/verification');

// Debug: Log saved-jobs route registration
console.log('✅ Saved jobs routes registered at /api/saved-jobs');
console.log('✅ Profile routes registered at /api/profile');

// Debug: Print registered routes only when enabled via env flag
if (process.env.LOG_ROUTES === 'true') {
  console.log('🔍 Registered Routes:');
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      console.log(`  ${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          console.log(`  ${Object.keys(handler.route.methods).join(',').toUpperCase()} ${middleware.regexp.source.replace(/\\/g, '').replace(/\^|\$/, '')}${handler.route.path}`);
        }
      });
    }
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
      console.log(`🔌 Socket.IO enabled for real-time updates`);
      console.log(`🔒 CORS: ENABLED - Environment-aware configuration`);
      console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
    });

    // Verify email configuration
    const { getEmailConfigStatus } = await import('./services/emailService');
    const emailConfig = getEmailConfigStatus();
    
    if (!emailConfig.configured) {
      console.error('❌ Email configuration missing:');
      console.error('   EMAIL_USER:', emailConfig.user);
      console.error('   EMAIL_PASS:', emailConfig.pass);
      console.error('   Please set these environment variables in your .env file');
    } else {
      console.log('📧 Email configuration found:');
      console.log('   Host:', emailConfig.host);
      console.log('   Port:', emailConfig.port);
      console.log('   Secure:', emailConfig.secure);
      console.log('   User:', emailConfig.user);
      console.log('   Pass:', emailConfig.pass);
      
      // Test email configuration
      try {
        const { createTransporter } = await import('./services/emailService');
        const testTransporter = createTransporter({
          host: emailConfig.host,
          port: Number(emailConfig.port),
          secure: emailConfig.secure === 'true',
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        });
        await testTransporter.verify();
        console.log('✅ Email configuration verified successfully');
      } catch (emailErr: any) {
        console.error('❌ Email configuration verification failed:', emailErr.message);
        console.error('   Please check your Gmail App Password and settings');
      }
    }
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();