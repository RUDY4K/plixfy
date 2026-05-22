import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Rasterize the Plixfy icon SVG into PWA icons:
 *   - icon-192.png            standard launcher icon (192×192)
 *   - icon-512.png            high-res launcher icon (512×512)
 *   - icon-maskable-512.png   maskable icon with safe-zone padding
 *   - apple-touch-icon.png    iOS home-screen icon (180×180)
 *
 * Maskable spec: the icon must remain readable when cropped to any
 * mask shape. We achieve that by adding a solid background + 10%
 * padding around the inner icon so the brand mark sits inside the
 * "safe zone" (40% inner radius).
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const svgPath = join(repoRoot, 'public', 'logo-icon.svg');
const outDir = join(repoRoot, 'public', 'icons');

mkdirSync(outDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);

async function emit(name, size, options = {}) {
  const { padded = false, background = '#0B0F1A' } = options;
  let pipeline;
  if (padded) {
    // Maskable: render the icon at 80% of the canvas so we have a 10%
    // safe-zone gutter on every side, then composite onto a solid
    // background of the brand color.
    const innerSize = Math.round(size * 0.8);
    const inner = await sharp(svgBuffer, { density: 384 })
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pipeline = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background,
      },
    }).composite([{ input: inner, gravity: 'center' }]);
  } else {
    pipeline = sharp(svgBuffer, { density: 384 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }
  const png = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  const out = join(outDir, name);
  writeFileSync(out, png);
  // eslint-disable-next-line no-console
  console.log(`wrote ${out} (${png.length} bytes)`);
}

await emit('icon-192.png', 192);
await emit('icon-512.png', 512);
await emit('icon-maskable-512.png', 512, { padded: true });
await emit('apple-touch-icon.png', 180);
