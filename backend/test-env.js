const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variables Debug:');
console.log('================================');

// Check all environment variables
const envVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'FRONTEND_URL'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    if (varName.includes('SECRET') || varName.includes('PASS') || varName.includes('URI')) {
      console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🔍 MongoDB Connection Test:');
console.log('============================');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.log('❌ MONGODB_URI is not set');
  process.exit(1);
}

console.log('📡 Attempting to connect to MongoDB...');

// MongoDB connection options
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000, // Increased timeout
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  w: 'majority',
  ...(MONGODB_URI.includes('mongodb+srv://') && {
    ssl: true,
  }),
};

// Test connection
mongoose.connect(MONGODB_URI, options)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Connection details:');
    console.log(`   - Host: ${mongoose.connection.host}`);
    console.log(`   - Port: ${mongoose.connection.port}`);
    console.log(`   - Database: ${mongoose.connection.name}`);
    console.log(`   - Ready State: ${mongoose.connection.readyState}`);
    
    // Close connection after test
    mongoose.connection.close()
      .then(() => {
        console.log('✅ Test completed successfully');
        process.exit(0);
      })
      .catch(err => {
        console.error('❌ Error closing connection:', err);
        process.exit(1);
      });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('🔍 Error details:', err);
    process.exit(1);
  });

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected event fired');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error event:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected event fired');
});
