#!/usr/bin/env node

/**
 * Create Grayscale Icons for Staging
 *
 * This script creates grayscale versions of the app icons for staging environment.
 *
 * Requirements:
 *   npm install sharp --save-dev
 *
 * Usage:
 *   node scripts/create-staging-icons.js
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../frontend/public/icons');
const icon192 = path.join(iconsDir, 'icon-192.png');
const icon512 = path.join(iconsDir, 'icon-512.png');
const icon192staging = path.join(iconsDir, 'icon-192-staging.png');
const icon512staging = path.join(iconsDir, 'icon-512-staging.png');

async function createGrayscaleIcons() {
  try {
    // Try to require sharp
    const sharp = require('sharp');

    console.log('📦 Creating grayscale icons for staging...\n');

    // Convert icon-192.png
    if (fs.existsSync(icon192)) {
      await sharp(icon192)
        .grayscale()
        .toFile(icon192staging);
      console.log('✅ Created icon-192-staging.png (grayscale)');
    } else {
      console.error('❌ icon-192.png not found');
    }

    // Convert icon-512.png
    if (fs.existsSync(icon512)) {
      await sharp(icon512)
        .grayscale()
        .toFile(icon512staging);
      console.log('✅ Created icon-512-staging.png (grayscale)');
    } else {
      console.error('❌ icon-512.png not found');
    }

    console.log('\n✨ Grayscale icons created successfully!');

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠️  Sharp not installed. You have 3 options:\n');
      console.log('Option 1 (Recommended): Install sharp and run this script');
      console.log('  npm install --save-dev sharp');
      console.log('  node scripts/create-staging-icons.js\n');

      console.log('Option 2: Use the HTML tool (open in browser)');
      console.log('  Open scripts/create-grayscale-icons.html in your browser\n');

      console.log('Option 3: Use ImageMagick (if installed)');
      console.log('  convert frontend/public/icons/icon-192.png -colorspace Gray frontend/public/icons/icon-192-staging.png');
      console.log('  convert frontend/public/icons/icon-512.png -colorspace Gray frontend/public/icons/icon-512-staging.png\n');

      console.log('Option 4: Use online tool');
      console.log('  https://www.imgonline.com.ua/eng/make-grayscale-image.php');
      console.log('  Upload icon-192.png and icon-512.png');
      console.log('  Download as icon-192-staging.png and icon-512-staging.png');
      console.log('  Place them in frontend/public/icons/\n');

      // Create copies as fallback (not grayscale)
      if (fs.existsSync(icon192) && !fs.existsSync(icon192staging)) {
        fs.copyFileSync(icon192, icon192staging);
        console.log('📋 Copied icon-192.png → icon-192-staging.png (NOT grayscale yet)');
      }

      if (fs.existsSync(icon512) && !fs.existsSync(icon512staging)) {
        fs.copyFileSync(icon512, icon512staging);
        console.log('📋 Copied icon-512.png → icon-512-staging.png (NOT grayscale yet)');
      }

      console.log('\n⚠️  Staging icons exist but are not grayscale. Please convert them manually.');

    } else {
      console.error('❌ Error creating grayscale icons:', error);
      process.exit(1);
    }
  }
}

createGrayscaleIcons();
