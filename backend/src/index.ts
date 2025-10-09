import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/database';
import nodemailer from 'nodemailer';
import path from 'path';
import SocketManager from './utils/socketManager';
import EmailNotificationService from './services/emailNotificationService';

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
import notificationRoutes from './routes/notifications';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { botFilter } from './middleware/botFilter';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT || '5001', 10);
// Initialize Socket.IO
const socketManager = new SocketManager(server);

// Make socketManager available globally for use in routes
(global as any).socketManager = socketManager;

// Initialize services
const emailService = new EmailNotificationService();

// Inject services into routes
setJobServices(socketManager, emailService);
setApplicationServices(socketManager, emailService);

// Environment-aware CORS configuration
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction 
  ? ['https://me-work.vercel.app']
  : ['http://localhost:3000'];

const corsOptions = {
  origin: allowedOrigins,
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

// Debug: Print all registered routes
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

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Helper function to find available port
const findAvailablePort = async (startPort: number): Promise<number> => {
  const net = require('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address()?.port;
      server.close(() => {
        resolve(port || startPort);
      });
    });
    
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
};

// Helper function to kill processes on specific port
const killProcessOnPort = async (port: number): Promise<void> => {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  try {
    // Find process using the port
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n');
    
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        
        if (pid && !isNaN(parseInt(pid))) {
          console.log(`🔧 Killing process ${pid} using port ${port}`);
          try {
            await execAsync(`taskkill /PID ${pid} /F`);
            console.log(`✅ Process ${pid} terminated`);
          } catch (killErr: any) {
            console.log(`⚠️ Could not kill process ${pid}:`, killErr.message);
          }
        }
      }
    }
  } catch (error) {
    // No process found or command failed - that's okay
    console.log(`ℹ️ No process found on port ${port}`);
  }
};

// Start server with automatic port handling
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    
    let actualPort = PORT;
    
    // Try to start on the preferred port
    const serverInstance = server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${actualPort}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${actualPort}/health`);
      console.log(`📚 API Documentation: http://localhost:${actualPort}/api`);
      console.log(`🔌 Socket.IO enabled for real-time updates`);
      console.log(`🔒 CORS: ENABLED - Environment-aware configuration`);
      console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
    });
    
    serverInstance.on('error', async (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${PORT} is already in use`);
        
        // Try to kill existing process
        await killProcessOnPort(PORT);
        
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find next available port
        try {
          actualPort = await findAvailablePort(PORT);
          console.log(`🔄 Trying port ${actualPort}...`);
          
          // Start server on new port
          server.listen(actualPort, () => {
            console.log(`✅ Server started successfully on port ${actualPort}`);
            console.log(`🔗 Health check: http://localhost:${actualPort}/health`);
            console.log(`📚 API Documentation: http://localhost:${actualPort}/api`);
          });
        } catch (portError) {
          console.error('❌ Failed to find available port:', portError);
          process.exit(1);
        }
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
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