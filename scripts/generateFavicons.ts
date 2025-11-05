import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const FAVICON_SOURCE = path.join(process.cwd(), 'public/assets/brand/favicon.png');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

const SIZES = [16, 32, 64, 128, 192, 256, 512];

async function generateFavicons() {
  try {
    console.log('🎨 Generating favicons...');

    // Ensure source exists
    try {
      await fs.access(FAVICON_SOURCE);
    } catch {
      throw new Error(`Favicon source not found: ${FAVICON_SOURCE}`);
    }

    // Generate favicon.ico (using 64x64 as base)
    await sharp(FAVICON_SOURCE)
      .resize(64, 64, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(path.join(PUBLIC_DIR, 'favicon.ico'));
    console.log('✓ Generated favicon.ico (64x64)');

    // Generate apple-touch-icon
    await sharp(FAVICON_SOURCE)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
    console.log('✓ Generated apple-touch-icon.png (180x180)');

    // Generate various sized favicons
    for (const size of SIZES) {
      await sharp(FAVICON_SOURCE)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toFile(path.join(PUBLIC_DIR, `favicon-${size}x${size}.png`));
      console.log(`✓ Generated favicon-${size}x${size}.png`);
    }

    // Generate manifest.json
    const manifest = {
      name: 'Hearaway',
      short_name: 'Hearaway',
      description: 'Ambient soundscapes by location',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#1a1a1a',
      icons: SIZES.map(size => ({
        src: `/favicon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose: size >= 192 ? 'any maskable' : 'any'
      }))
    };

    await fs.writeFile(
      path.join(PUBLIC_DIR, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    console.log('✓ Generated manifest.json');

    console.log('\n✨ Favicon generation complete!');
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
