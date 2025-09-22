#!/usr/bin/env node

// Railway-compatible start script for Next.js
const { spawn } = require('child_process');
const path = require('path');

// Get port from environment variable
const port = process.env.PORT || process.env.RAILWAY_STATIC_PORT || 3000;

console.log('🚀 Starting Next.js application...');
console.log('📍 Port:', port);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Start Next.js server
const nextProcess = spawn('npx', ['next', 'start', '-p', port.toString()], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: port.toString()
  }
});

nextProcess.on('error', (error) => {
  console.error('❌ Failed to start Next.js:', error.message);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  console.log(`Next.js server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  nextProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  nextProcess.kill('SIGINT');
});
