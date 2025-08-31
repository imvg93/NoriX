const { spawn } = require('child_process');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Check if required environment variables are set
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET'
];

// Optional but recommended environment variables
const optionalEnvVars = [
  'EMAIL_USER',
  'EMAIL_PASS'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Please set these variables in your Render dashboard:');
  console.error('   Environment → Environment Variables');
  console.error('\n📁 Or check your local .env file at:', path.join(__dirname, '.env'));
  process.exit(1);
}

// Check optional environment variables
const missingOptionalVars = optionalEnvVars.filter(varName => !process.env[varName]);
if (missingOptionalVars.length > 0) {
  console.warn('⚠️ Missing optional environment variables:');
  missingOptionalVars.forEach(varName => {
    console.warn(`   - ${varName}`);
  });
  console.warn('📧 Email functionality will be disabled without these variables');
}

console.log('✅ All required environment variables are set');
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
  console.log('Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});
