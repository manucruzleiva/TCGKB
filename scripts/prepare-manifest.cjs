#!/usr/bin/env node

/**
 * Prepare Manifest for Environment
 *
 * This script:
 * 1. Copies the appropriate manifest.json for the target environment
 * 2. For staging, creates grayscale versions of icons
 *
 * Usage:
 *   node scripts/prepare-manifest.js [production|staging]
 */

const fs = require('fs');
const path = require('path');

const env = process.argv[2] || 'production';
const publicDir = path.join(__dirname, '../frontend/public');
const iconsDir = path.join(publicDir, 'icons');

console.log(`📦 Preparing manifest for: ${env}`);

if (env === 'staging') {
  // Copy staging manifest
  const stagingManifest = path.join(publicDir, 'manifest.staging.json');
  const targetManifest = path.join(publicDir, 'manifest.json');

  if (fs.existsSync(stagingManifest)) {
    fs.copyFileSync(stagingManifest, targetManifest);
    console.log('✅ Copied manifest.staging.json → manifest.json');
  } else {
    console.error('❌ manifest.staging.json not found');
    process.exit(1);
  }

  // Create grayscale icons for staging
  // Note: This requires ImageMagick or similar tool installed
  // For now, we'll just copy the regular icons and add a note
  // In production, you'd use sharp or jimp to convert to grayscale

  console.log('📝 Note: To create grayscale icons for staging, run:');
  console.log('   convert frontend/public/icons/icon-192.png -colorspace Gray frontend/public/icons/icon-192-staging.png');
  console.log('   convert frontend/public/icons/icon-512.png -colorspace Gray frontend/public/icons/icon-512-staging.png');
  console.log('');
  console.log('   Or use online tools like: https://www.imgonline.com.ua/eng/make-grayscale-image.php');

  // For now, just copy the icons (user should manually create grayscale versions)
  const icon192 = path.join(iconsDir, 'icon-192.png');
  const icon512 = path.join(iconsDir, 'icon-512.png');
  const icon192staging = path.join(iconsDir, 'icon-192-staging.png');
  const icon512staging = path.join(iconsDir, 'icon-512-staging.png');

  // Only copy if staging versions don't exist
  if (!fs.existsSync(icon192staging) && fs.existsSync(icon192)) {
    fs.copyFileSync(icon192, icon192staging);
    console.log('⚠️  Copied icon-192.png → icon-192-staging.png (should be grayscale)');
  }

  if (!fs.existsSync(icon512staging) && fs.existsSync(icon512)) {
    fs.copyFileSync(icon512, icon512staging);
    console.log('⚠️  Copied icon-512.png → icon-512-staging.png (should be grayscale)');
  }

} else {
  console.log('✅ Using production manifest (default)');
  // Production uses the existing manifest.json as-is
}

console.log('✨ Manifest preparation complete');
