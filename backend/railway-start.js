#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

console.log('🚂 Railway Deployment Starting...');
console.log('📍 Working Directory:', __dirname);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Check if dist/index.js exists
const distPath = path.join(__dirname, 'dist', 'index.js');
if (!fs.existsSync(distPath)) {
  console.error('❌ Compiled application not found at:', distPath);
  console.error('💡 Running TypeScript compilation...');
  
  // Try to build if dist doesn't exist
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  buildProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error('❌ Build failed with code:', code);
      process.exit(1);
    }
    
    // Check again after build
    if (!fs.existsSync(distPath)) {
      console.error('❌ Build completed but dist/index.js still not found');
      process.exit(1);
    }
    
    console.log('✅ Build successful, starting server...');
    startServer();
  });
} else {
  console.log('✅ Compiled application found');
  startServer();
}

function startServer() {
  // Check required environment variables
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please set these variables in your Railway dashboard');
    process.exit(1);
  }

  // Check optional environment variables
  const optionalEnvVars = ['EMAIL_USER', 'EMAIL_PASS'];
  const missingOptionalVars = optionalEnvVars.filter(varName => !process.env[varName]);
  
  if (missingOptionalVars.length > 0) {
    console.warn('⚠️ Missing optional environment variables:');
    missingOptionalVars.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('📧 Email functionality will be disabled');
  }

  console.log('✅ Environment variables validated');
  console.log('🚀 Starting backend server...');

  // Start the compiled application
  const server = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });

  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });

  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    server.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    server.kill('SIGINT');
  });
}