#!/usr/bin/env node
/**
 * Generate SVG placeholder thumbnails for custom (non-embed) games.
 *
 * Custom games have no upstream URL to scrape, so we build a clean
 * gradient + title placeholder using each game's `color` field. SVGs
 * are written to public/assets/thumbnails/<slug>.svg.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'assets', 'thumbnails');
const REGISTRY_PATH = join(ROOT, 'games', 'registry-custom.ts');

const WIDTH = 512;
const HEIGHT = 384;

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c],
  );
}

/**
 * Lighten/darken a hex color by `amount` in [-1, 1]. Uses HSL adjustment
 * via a quick approximation good enough for gradient stops.
 */
function shade(hex, amount) {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  const adj = (v) =>
    Math.max(0, Math.min(255, Math.round(v + (amount > 0 ? (255 - v) * amount : v * amount))));
  r = adj(r);
  g = adj(g);
  b = adj(b);
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function buildSvg({ title, color, status }) {
  const top = shade(color, 0.2);
  const bottom = shade(color, -0.35);
  const badge = status === 'live' ? '' : `
  <g transform="translate(${WIDTH - 24}, 24)">
    <rect x="-110" y="-2" width="108" height="28" rx="14" fill="rgba(0,0,0,0.55)"/>
    <text x="-56" y="17" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#fff" letter-spacing="0.05em">COMING SOON</text>
  </g>`;

  const safeTitle = escapeXml(title);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${top}"/>
      <stop offset="100%" stop-color="${bottom}"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="40%" r="65%">
      <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.4)"/>
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#vignette)"/>
  <text x="${WIDTH / 2}" y="${HEIGHT / 2 + 12}" text-anchor="middle"
        font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-size="56" font-weight="800" fill="#ffffff"
        style="text-shadow: 0 2px 8px rgba(0,0,0,0.4)">${safeTitle}</text>${badge}
</svg>
`;
}

async function loadCustomGames() {
  const src = await readFile(REGISTRY_PATH, 'utf8');
  const entries = [];
  const re = /\{\s*kind:\s*'custom',[\s\S]*?\}/g;
  for (const m of src.matchAll(re)) {
    const block = m[0];
    const slug = block.match(/slug:\s*'([^']+)'/)?.[1];
    const title = block.match(/title:\s*'([^']+)'/)?.[1];
    const color = block.match(/color:\s*'([^']+)'/)?.[1];
    const status = block.match(/status:\s*'([^']+)'/)?.[1] ?? 'live';
    if (!slug || !title || !color) continue;
    entries.push({ slug, title, color, status });
  }
  return entries;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const games = await loadCustomGames();
  console.log(`Generating ${games.length} SVG placeholder(s) → ${OUT_DIR}`);

  for (const g of games) {
    const svg = buildSvg(g);
    const slugFile = g.slug === 'puzzle-2048' ? '2048' : g.slug;
    const dest = join(OUT_DIR, `${slugFile}.svg`);
    await writeFile(dest, svg);
    console.log(`  ✓ ${slugFile}.svg`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
