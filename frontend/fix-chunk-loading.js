#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing chunk loading issues...');

// Clear all cache directories
const dirsToClean = [
  '.next',
  'node_modules/.cache',
  '.turbo',
  'out',
  'dist'
];

console.log('🧹 Clearing cache directories...');
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

// Clear browser cache instructions
console.log('\n🌐 Browser Cache Instructions:');
console.log('1. Open your browser developer tools (F12)');
console.log('2. Right-click on the refresh button');
console.log('3. Select "Empty Cache and Hard Reload"');
console.log('4. Or use Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)');

// Clear npm cache
console.log('\n📦 Clearing npm cache...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ npm cache cleared');
} catch (error) {
  console.log('⚠️ Could not clear npm cache:', error.message);
}

// Reinstall dependencies
console.log('\n📥 Reinstalling dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies reinstalled');
} catch (error) {
  console.log('❌ Failed to reinstall dependencies:', error.message);
  process.exit(1);
}

console.log('\n🎉 Chunk loading fix complete!');
console.log('\n📋 Next Steps:');
console.log('1. Run "npm run dev" to start the development server');
console.log('2. Hard refresh your browser (Ctrl+Shift+R)');
console.log('3. Check the browser console for any remaining errors');
console.log('4. The app should now load without chunk loading errors');

console.log('\n🔍 If issues persist:');
console.log('- Check your network connection');
console.log('- Try a different browser or incognito mode');
console.log('- Verify your Next.js version is compatible');
console.log('- Check for any proxy or firewall issues');
