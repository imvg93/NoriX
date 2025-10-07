#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Clearing Next.js cache and rebuilding...');

// Directories to clean
const dirsToClean = [
  '.next',
  'node_modules/.cache',
  '.turbo'
];

// Clean directories
dirsToClean.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`Removing ${dir}...`);
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removed ${dir}`);
    } catch (error) {
      console.log(`⚠️ Could not remove ${dir}:`, error.message);
    }
  } else {
    console.log(`ℹ️ ${dir} does not exist, skipping...`);
  }
});

// Clear npm cache
console.log('Clearing npm cache...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ npm cache cleared');
} catch (error) {
  console.log('⚠️ Could not clear npm cache:', error.message);
}

// Reinstall dependencies
console.log('Reinstalling dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies reinstalled');
} catch (error) {
  console.log('❌ Failed to reinstall dependencies:', error.message);
  process.exit(1);
}

console.log('🎉 Cache clearing complete! You can now run "npm run dev"');
