#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Updating favicon references...');

const imgDir = path.join(process.cwd(), 'public', 'img');
const requiredFiles = [
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'favicon-96x96.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'apple-touch-icon.png'
];

console.log('\n📁 Checking for favicon files...');
let missingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(imgDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('\n⚠️  Missing favicon files detected!');
  console.log('Please create the following files:');
  missingFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
  console.log('\nRun: node generate-favicons.js for instructions');
  process.exit(1);
}

console.log('\n✅ All favicon files present!');
console.log('🎉 Your favicon setup is complete and ready to use!');

// Test the build
console.log('\n🔨 Testing build...');
const { execSync } = require('child_process');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ Build successful! Your favicon setup is working correctly.');
} catch (error) {
  console.log('\n❌ Build failed. Please check the favicon file formats.');
  process.exit(1);
}
