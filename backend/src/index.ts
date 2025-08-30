import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import nodemailer from 'nodemailer';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import jobRoutes from './routes/jobs';
import applicationRoutes from './routes/applications';
import adminRoutes from './routes/admin';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// MongoDB connection is now handled in config/database.ts

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
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
