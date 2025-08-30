const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up .env file for StudentJobs Backend...\n');

const envPath = path.join(__dirname, 'backend', '.env');
const templatePath = path.join(__dirname, 'backend', 'env.template');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('📁 Location:', envPath);
  console.log('\n💡 You can either:');
  console.log('   1. Edit the existing .env file directly');
  console.log('   2. Delete it and run this script again');
  console.log('   3. Copy from env.template manually');
  return;
}

// Check if template exists
if (!fs.existsSync(templatePath)) {
  console.error('❌ env.template not found!');
  console.log('📁 Expected location:', templatePath);
  return;
}

// Copy template to .env
try {
  fs.copyFileSync(templatePath, envPath);
  console.log('✅ .env file created successfully!');
  console.log('📁 Location:', envPath);
  console.log('\n📝 Next steps:');
  console.log('   1. Open the .env file in your editor');
  console.log('   2. Replace the placeholder values with your actual credentials');
  console.log('   3. Save the file');
  console.log('\n🔑 Required values to update:');
  console.log('   - MONGODB_URI: Your MongoDB connection string');
  console.log('   - JWT_SECRET: A secure random string');
  console.log('   - EMAIL_USER: Your Gmail address');
  console.log('   - EMAIL_PASS: Your Gmail App Password (16 characters)');
  console.log('\n💡 For Gmail setup:');
  console.log('   1. Enable 2-Factor Authentication');
  console.log('   2. Generate App Password');
  console.log('   3. Use the 16-character password (not your regular password)');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}
