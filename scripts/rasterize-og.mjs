import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const svgPath = join(repoRoot, 'public', 'og-default.svg');
const pngPath = join(repoRoot, 'public', 'og-default.png');

const svg = readFileSync(svgPath);
const png = await sharp(svg, { density: 144 })
  .resize(1200, 630, { fit: 'cover' })
  .png({ quality: 90, compressionLevel: 9 })
  .toBuffer();

writeFileSync(pngPath, png);
console.log(`OG PNG written: ${pngPath} (${png.length} bytes)`);
