import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/database';
import nodemailer from 'nodemailer';
import path from 'path';
import SocketManager from './utils/socketManager';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import jobRoutes from './routes/jobs';
import applicationRoutes from './routes/applications';
import adminRoutes from './routes/admin';
import kycRoutes from './routes/kyc';
import uploadRoutes from './routes/upload';
import testUploadRoutes from './routes/test-upload';
import debugUploadRoutes from './routes/debug-upload';
import enhancedJobRoutes from './routes/enhanced-jobs';
import notificationRoutes from './routes/notifications';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5001;

// Initialize Socket.IO
const socketManager = new SocketManager(server);

// Make socketManager available globally for use in routes
(global as any).socketManager = socketManager;

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'https://me-work.vercel.app', // Vercel deployment
      'https://studenting.vercel.app', // Alternative Vercel URL
      'https://studentjobs-frontend.onrender.com', // Render frontend
    ];
    
    // Allow all Vercel subdomains
    if (origin.includes('.vercel.app')) {
      console.log('✅ CORS: Allowing Vercel origin:', origin);
      return callback(null, true);
    }
    
    // Allow all Render subdomains
    if (origin.includes('.onrender.com')) {
      console.log('✅ CORS: Allowing Render origin:', origin);
      return callback(null, true);
    }
    
    // Allow all Railway subdomains
    if (origin.includes('.railway.app')) {
      console.log('✅ CORS: Allowing Railway origin:', origin);
      return callback(null, true);
    }
    
    // Allow Railway preview deployments
    if (origin.includes('.up.railway.app')) {
      console.log('✅ CORS: Allowing Railway preview origin:', origin);
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'StudentJobs API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: 'enabled',
    allowedOrigins: [
      'http://localhost:3000',
      'https://me-work.vercel.app',
      '*.vercel.app',
      '*.railway.app',
      '*.onrender.com'
    ],
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/test-upload', testUploadRoutes);
app.use('/api/debug-upload', debugUploadRoutes);
app.use('/api/enhanced-jobs', enhancedJobRoutes);
app.use('/api/notifications', notificationRoutes);

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
      console.log(`🔒 CORS: ENABLED - Supports Vercel, Railway, Render`);
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