#!/usr/bin/env node

/**
 * Create a better favicon from the NoriX logo
 * This script provides instructions for creating a larger, higher-quality favicon
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Creating Better Favicon for NoriX');
console.log('====================================\n');

const logoPath = path.join(process.cwd(), 'public', 'img', 'norixlogo.png');
const faviconPath = path.join(process.cwd(), 'public', 'Favicon.ico');

if (!fs.existsSync(logoPath)) {
  console.log('⚠️  Logo file not found:', logoPath);
  console.log('📋 Available logo files:');
  const imgDir = path.join(process.cwd(), 'public', 'img');
  if (fs.existsSync(imgDir)) {
    const files = fs.readdirSync(imgDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    files.forEach(file => console.log(`   - ${file}`));
  }
  console.log('\n💡 Please use one of the available logos');
  process.exit(1);
}

console.log('✅ Logo file found:', logoPath);
console.log('\n📋 To create a larger, better-quality favicon:');
console.log('\n   1. Online Tool (Recommended - Easiest):');
console.log('      Visit: https://realfavicongenerator.net/');
console.log('      - Upload your logo file: public/img/norixlogo.png');
console.log('      - Configure options for better visibility');
console.log('      - Download the generated favicon package');
console.log('      - Extract and place files in public/ directory');
console.log('\n   2. Alternative Online Tools:');
console.log('      - https://favicon.io/');
console.log('      - https://www.favicon-generator.org/');
console.log('\n   3. Manual Method:');
console.log('      - Open your logo in an image editor');
console.log('      - Create a square version (preferably with padding)');
console.log('      - Export as ICO format with multiple sizes:');
console.log('        * 16x16 (minimum for favicon)');
console.log('        * 32x32 (recommended - this is what appears in tabs)');
console.log('        * 48x48 (for better quality on some browsers)');
console.log('      - Save as Favicon.ico in public/ directory');

console.log('\n💡 Tips for Larger/More Visible Favicon:');
console.log('   - Use a square design (or add padding to make it square)');
console.log('   - Keep the design simple and bold');
console.log('   - Use high contrast colors');
console.log('   - Test at 16x16 size to ensure it\'s still recognizable');
console.log('   - Consider using just the "X" or a simplified version for small sizes');

console.log('\n📝 Note: Browser tab favicons are typically 16x16 or 32x32 pixels.');
console.log('   Using higher resolution source images improves quality on high-DPI displays.');
console.log('   Your current configuration will use larger source images when available.');

console.log('\n✅ Current Configuration:');
console.log('   - Favicon.ico: public/Favicon.ico');
console.log('   - Larger icons: public/img/norixlogo.png (configured for 192x192 and 512x512)');
console.log('   - Apple touch icon: public/img/norixlogo.png');

console.log('\n🔄 After creating a new favicon, restart your Next.js dev server to see changes.');

