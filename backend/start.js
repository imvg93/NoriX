#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

console.log('🚀 Starting Backend Server...');
console.log('📍 Working Directory:', __dirname);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Check if dist/index.js exists
const distPath = path.join(__dirname, 'dist', 'index.js');
if (!fs.existsSync(distPath)) {
  console.log('📦 Compiled application not found');
  console.log('🔨 Building TypeScript...');
  
  // Build the application
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  buildProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error('❌ Build failed');
      process.exit(1);
    }
    
    // Start server after build
    console.log('✅ Build successful');
    startServer();
  });
} else {
  console.log('✅ Using compiled application');
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
    console.error('\n💡 Please create a .env file with these variables');
    console.error('💡 Copy env.template to .env and fill in the values');
    process.exit(1);
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

