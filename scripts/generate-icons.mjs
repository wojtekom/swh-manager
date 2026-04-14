import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const appDir = join(__dirname, '..', 'src', 'app');

const svgBuffer = readFileSync(join(publicDir, 'icon.svg'));

// Generate PNG icons
await sharp(svgBuffer).resize(192, 192).png().toFile(join(publicDir, 'icon-192.png'));
console.log('✅ icon-192.png');

await sharp(svgBuffer).resize(512, 512).png().toFile(join(publicDir, 'icon-512.png'));
console.log('✅ icon-512.png');

await sharp(svgBuffer).resize(180, 180).png().toFile(join(publicDir, 'apple-touch-icon.png'));
console.log('✅ apple-touch-icon.png');

// Generate favicon.ico (32x32 PNG, saved as .ico — browsers accept PNG favicons)
await sharp(svgBuffer).resize(32, 32).png().toFile(join(appDir, 'favicon.ico'));
console.log('✅ favicon.ico');

console.log('\n🏒 All SWH icons generated!');
