#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 Favicon Generator for NoriX');
console.log('================================');

console.log('\n📋 Instructions to create larger favicons:');
console.log('1. Take your NoriX logo (norixgreen.png or norixlogo.png)');
console.log('2. Resize it to the following dimensions:');
console.log('   - 16x16 pixels (favicon-16x16.png)');
console.log('   - 32x32 pixels (favicon-32x32.png)');
console.log('   - 48x48 pixels (favicon-48x48.png)');
console.log('   - 96x96 pixels (favicon-96x96.png)');
console.log('   - 192x192 pixels (android-chrome-192x192.png)');
console.log('   - 512x512 pixels (android-chrome-512x512.png)');
console.log('   - 180x180 pixels (apple-touch-icon.png)');

console.log('\n🛠️ Recommended tools:');
console.log('   - Online: https://realfavicongenerator.net/');
console.log('   - Online: https://favicon.io/');
console.log('   - Photoshop/GIMP: Resize and export as PNG');
console.log('   - Canva: Create and download in different sizes');

console.log('\n📁 Files to create in public/img/:');
const faviconFiles = [
  'favicon-16x16.png',
  'favicon-32x32.png', 
  'favicon-48x48.png',
  'favicon-96x96.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'apple-touch-icon.png'
];

faviconFiles.forEach(file => {
  console.log(`   - ${file}`);
});

console.log('\n✅ After creating the files, run: npm run update-favicon');
console.log('\n💡 Benefits of larger favicons:');
console.log('   - Better quality on high-DPI displays');
console.log('   - Better visibility on mobile devices');
console.log('   - Support for PWA (Progressive Web App)');
console.log('   - Better bookmark appearance');
console.log('   - Support for various browser requirements');

// Create a sample manifest.json for PWA support
const manifest = {
  "name": "NoriX - Student Jobs Platform",
  "short_name": "NoriX",
  "description": "Find the perfect job opportunities for students",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#10b981",
  "icons": [
    {
      "src": "/img/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/img/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
};

const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('\n📱 Created manifest.json for PWA support');
