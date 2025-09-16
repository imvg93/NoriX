#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🚀 StudentJobs Platform Setup\n');
  console.log('This script will help you configure your environment for the StudentJobs platform.\n');

  // Check if .env file exists
  const envPath = path.join(__dirname, 'backend', '.env');
  const envExists = fs.existsSync(envPath);

  if (envExists) {
    const overwrite = await question('A .env file already exists. Do you want to overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('Setup cancelled. Your existing .env file will be preserved.');
      rl.close();
      return;
    }
  }

  console.log('\n📧 Gmail SMTP Configuration (Required for OTP System)');
  console.log('You need to set up Gmail App Password for email verification.\n');
  
  const emailUser = await question('Enter your Gmail address: ');
  const emailPass = await question('Enter your Gmail App Password (16 characters): ');

  if (!emailPass || emailPass.length !== 16) {
    console.log('\n❌ App Password must be exactly 16 characters.');
    console.log('Please generate a new App Password from your Google Account settings.');
    rl.close();
    return;
  }

  console.log('\n🗄️ Database Configuration');
  const useAtlas = await question('Do you want to use MongoDB Atlas? (y/N): ');
  
  let mongoUri;
  if (useAtlas.toLowerCase() === 'y' || useAtlas.toLowerCase() === 'yes') {
    mongoUri = await question('Enter your MongoDB Atlas connection string: ');
  } else {
    mongoUri = 'mongodb://localhost:27017/studentjobs';
  }

  console.log('\n🔐 JWT Configuration');
  const jwtSecret = await question('Enter a JWT secret (or press Enter for default): ') || 'your-super-secret-jwt-key-here-change-this-in-production';

  // Create .env content
  const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=${mongoUri}

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=${emailUser}
EMAIL_PASS=${emailPass}
EMAIL_ALLOW_SELF_SIGNED=false

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Admin Configuration
ADMIN_EMAIL=admin@studentjobs.com
ADMIN_PASSWORD=admin123

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
`;

  // Write .env file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test your email configuration:');
    console.log('   cd backend && npm run test:email');
    console.log('');
    console.log('2. Start the backend server:');
    console.log('   cd backend && npm run dev');
    console.log('');
    console.log('3. Start the frontend server:');
    console.log('   cd frontend && npm run dev');
    console.log('');
    console.log('4. Visit http://localhost:3000');
    
    console.log('\n📚 For detailed setup instructions, see:');
    console.log('- README.md');
    console.log('- backend/SETUP.md');
    
  } catch (error) {
    console.error('\n❌ Error creating .env file:', error.message);
  }

  rl.close();
}

setup().catch(console.error);

