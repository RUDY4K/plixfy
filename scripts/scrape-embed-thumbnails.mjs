#!/usr/bin/env node
/**
 * Scrape og:image from each GameDistribution embed URL and save locally.
 *
 * The iframe page (https://html5.gamedistribution.com/<id>/) serves an
 * HTML shell with proper Open Graph meta tags. The og:image URL points
 * at img.gamedistribution.com which 403s on hotlinks unless a Referer
 * header is supplied — so we set one when downloading the image.
 *
 * Output: public/assets/thumbnails/embed-<slug>.jpg
 *
 * Usage:
 *   node scripts/scrape-embed-thumbnails.mjs            # all games
 *   node scripts/scrape-embed-thumbnails.mjs --limit 5  # first N (smoke test)
 *   node scripts/scrape-embed-thumbnails.mjs --slug moto-x3m  # one game
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'assets', 'thumbnails');
const REGISTRY_PATH = join(ROOT, 'games', 'registry-embed.ts');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const PAGE_REFERER = 'https://html5.gamedistribution.com/';

function parseArgs(argv) {
  const args = { limit: Infinity, slug: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--limit') args.limit = Number(argv[++i]);
    else if (a === '--slug') args.slug = argv[++i];
  }
  return args;
}

/**
 * Parse registry-embed.ts heuristically (no TypeScript runtime needed).
 * We extract { slug, embedUrl } pairs from the source text. Robust to
 * arbitrary order of fields within each entry.
 */
async function loadEmbedGames() {
  const src = await readFile(REGISTRY_PATH, 'utf8');
  const entries = [];
  const entryRe = /\{\s*kind:\s*'embed',[\s\S]*?\}/g;
  for (const match of src.matchAll(entryRe)) {
    const block = match[0];
    const slugMatch = block.match(/slug:\s*'([^']+)'/);
    const gdIdMatch = block.match(/embedUrl:\s*gd\('([^']+)'\)/);
    if (!slugMatch || !gdIdMatch) continue;
    entries.push({
      slug: slugMatch[1],
      embedUrl: `https://html5.gamedistribution.com/${gdIdMatch[1]}/`,
    });
  }
  return entries;
}

async function fetchOgImage(pageUrl) {
  const res = await fetch(pageUrl, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`page fetch ${res.status} for ${pageUrl}`);
  }
  const html = await res.text();
  // og:image meta — handle both quoted and unquoted attr values
  const re = /<meta\s+property=["']?og:image["']?\s+content=["']?([^"'>\s]+)["']?/i;
  const m = html.match(re);
  if (!m) throw new Error(`no og:image in ${pageUrl}`);
  return m[1];
}

async function downloadImage(imgUrl, destPath) {
  const res = await fetch(imgUrl, {
    headers: {
      'User-Agent': UA,
      Referer: PAGE_REFERER,
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`image fetch ${res.status} for ${imgUrl}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  return buf.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  let games = await loadEmbedGames();
  if (args.slug) games = games.filter((g) => g.slug === args.slug);
  if (Number.isFinite(args.limit)) games = games.slice(0, args.limit);

  console.log(`Scraping ${games.length} game(s) → ${OUT_DIR}`);

  const results = { ok: [], fail: [] };
  for (const g of games) {
    try {
      const ogUrl = await fetchOgImage(g.embedUrl);
      const ext = (ogUrl.match(/\.(jpe?g|png|webp|avif)(?:\?|$)/i)?.[1] ?? 'jpg').toLowerCase();
      const normalisedExt = ext === 'jpeg' ? 'jpg' : ext;
      const dest = join(OUT_DIR, `embed-${g.slug}.${normalisedExt}`);
      const bytes = await downloadImage(ogUrl, dest);
      console.log(`  ✓ ${g.slug.padEnd(32)} ${(bytes / 1024).toFixed(0).padStart(4)} KB  ${normalisedExt}`);
      results.ok.push({ slug: g.slug, ext: normalisedExt, bytes });
    } catch (err) {
      console.error(`  ✗ ${g.slug.padEnd(32)} ${err.message}`);
      results.fail.push({ slug: g.slug, error: err.message });
    }
  }

  console.log(`\nDone. ok=${results.ok.length} fail=${results.fail.length}`);
  if (results.fail.length) {
    console.log('Failed slugs:', results.fail.map((r) => r.slug).join(', '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
