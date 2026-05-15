#!/usr/bin/env node
/**
 * Bulk-harvest GameDistribution embed games from the public sitemap.
 *
 * Strategy:
 *   1. Read game IDs from scripts/gd-ids.txt (pre-extracted from sitemap).
 *   2. Sample N candidates, skipping IDs already in our registry.
 *   3. In parallel batches, fetch each iframe page and parse og:title,
 *      og:description, og:image, and the keywords meta tag.
 *   4. Drop entries missing core metadata, non-English, or duplicates.
 *   5. Download each thumbnail with a Referer header (image CDN is hot-link
 *      protected) to public/assets/thumbnails/embed-<slug>.jpg.
 *   6. Auto-categorize via keyword match and emit a JSON manifest the
 *      registry generator (generate-embed-registry.mjs) consumes.
 *
 * Usage:
 *   node scripts/harvest-embed-games.mjs --target 200 --pool 280
 *   node scripts/harvest-embed-games.mjs --resume   # continue from manifest
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const IDS_PATH = join(__dirname, 'gd-ids.txt');
const MANIFEST_PATH = join(__dirname, 'harvest-manifest.json');
const REGISTRY_PATH = join(ROOT, 'games', 'registry-embed.ts');
const THUMBS_DIR = join(ROOT, 'public', 'assets', 'thumbnails');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const PAGE_REFERER = 'https://html5.gamedistribution.com/';
const CONCURRENCY = 16;
const REQUEST_TIMEOUT_MS = 12_000;

const CATEGORY_RULES = [
  // order matters — first match wins
  { cat: 'racing', kws: ['race', 'racing', 'drift', 'drive', 'driving', 'car', 'truck', 'bike', 'motorcycle', 'highway', 'traffic', 'parking', 'formula'] },
  { cat: 'sports', kws: ['soccer', 'football', 'basketball', 'baseball', 'tennis', 'golf', 'pool', 'billiard', 'snooker', 'volleyball', 'cricket', 'bowling', 'boxing', 'mma', 'wrestling', 'hockey', 'rugby', 'skate', 'surf', 'ski', 'archery', 'darts'] },
  { cat: 'shooting', kws: ['shoot', 'shooter', 'gun', 'sniper', 'fps', 'pistol', 'weapon', 'army', 'military', 'tank battle', 'war'] },
  { cat: 'puzzle', kws: ['puzzle', 'match 3', 'match-3', 'match three', 'jewel', 'gem', 'solitaire', 'mahjong', 'sudoku', 'crossword', 'jigsaw', 'block', 'tetris', 'connect', 'merge', 'tile', '2048', 'memory', 'hidden object', 'logic', 'sliding'] },
  { cat: 'word', kws: ['word', 'spelling', 'typing', 'wpm', 'crossword', 'vocabulary', 'anagram', 'scrabble'] },
  { cat: 'board', kws: ['chess', 'checkers', 'backgammon', 'domino', 'card', 'poker', 'blackjack', 'uno', 'rummy', 'go fish'] },
  { cat: 'strategy', kws: ['strategy', 'tower defense', 'td ', 'rts', 'kingdom', 'empire', 'civilization', 'tactic', 'tactical', 'war game'] },
  { cat: 'io', kws: ['.io', ' io ', 'agar', 'slither.io', 'paper.io', 'krunker', 'mope', 'multiplayer io'] },
  { cat: 'simulation', kws: ['simulator', 'simulation', 'tycoon', 'farm', 'restaurant', 'business', 'manage', 'manager', 'truck simulator'] },
  { cat: 'clicker', kws: ['clicker', 'idle', 'incremental', 'tap to'] },
  { cat: 'adventure', kws: ['adventure', 'quest', 'rpg', 'role play', 'mystery', 'escape', 'explore', 'dungeon'] },
  { cat: 'girls', kws: ['girls', 'dress up', 'dress-up', 'makeup', 'makeover', 'fashion', 'princess', 'wedding', 'salon', 'beauty', 'cooking', 'baking', 'cake', 'pizza', 'burger'] },
  { cat: 'action', kws: ['action', 'fight', 'fighting', 'ninja', 'samurai', 'stickman', 'zombie', 'survival', 'monster', 'beat em up'] },
  { cat: 'skill', kws: ['skill', 'balance', 'aim', 'precision', 'reaction'] },
  { cat: 'arcade', kws: ['arcade', 'runner', 'endless', 'jump', 'jumping', 'platform', 'flap', 'snake', 'classic', 'retro', 'pacman', 'breakout', 'ball', 'flappy'] },
  { cat: 'casual', kws: ['casual', 'cute', 'fun', 'family', 'kids', 'children'] },
];
const DEFAULT_CATEGORY = 'casual';

function parseArgs(argv) {
  const a = { target: 200, pool: 320, resume: false, seed: 0xc0ffee };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--target') a.target = Number(argv[++i]);
    else if (x === '--pool') a.pool = Number(argv[++i]);
    else if (x === '--seed') a.seed = Number(argv[++i]);
    else if (x === '--resume') a.resume = true;
  }
  return a;
}

// Deterministic shuffle so re-runs hit the same candidates first.
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function pickCategory(title, description, keywords) {
  const blob = (title + ' ' + description + ' ' + keywords).toLowerCase();
  for (const { cat, kws } of CATEGORY_RULES) {
    if (kws.some((k) => blob.includes(k))) return cat;
  }
  return DEFAULT_CATEGORY;
}

function isLikelyEnglish(s) {
  if (!s) return false;
  // Reject if mostly non-ASCII letters (Chinese, Arabic, etc.)
  const ascii = s.replace(/[^\x00-\x7f]/g, '');
  return ascii.length / s.length > 0.7;
}

function colorFromSlug(slug) {
  const palette = [
    '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#facc15',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
    '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
    '#d946ef', '#ec4899', '#f472b6',
  ];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function decodeHtmlEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function extractMeta(html) {
  const get = (re) => {
    const m = html.match(re);
    return m ? decodeHtmlEntities(m[1].trim()) : null;
  };
  // og:property has no quotes around the attribute value in GD pages
  const title = get(/<meta\s+property=["']?og:title["']?\s+content=["']([^"']+)["']/i)
    || get(/<title>([^<]+)<\/title>/i);
  const description = get(/<meta\s+property=["']?og:description["']?\s+content=["']([^"']+)["']/i)
    || get(/<meta\s+name=["']?description["']?\s+content=["']([^"']+)["']/i);
  const image = get(/<meta\s+property=["']?og:image["']?\s+content=["']?([^"'\s>]+)/i);
  const keywords = get(/<meta\s+name=["']?keywords["']?\s+content=["']([^"']+)["']/i) ?? '';
  return { title, description, image, keywords };
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function scrapeOne(id) {
  const pageUrl = `https://html5.gamedistribution.com/${id}/`;
  const res = await fetchWithTimeout(pageUrl, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const meta = extractMeta(html);
  if (!meta.title || !meta.image) throw new Error('missing title or og:image');
  if (!isLikelyEnglish(meta.title)) throw new Error('non-english title');
  return { id, ...meta, pageUrl };
}

async function downloadImage(url, dest) {
  const res = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': UA,
      Referer: PAGE_REFERER,
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) throw new Error('image too small');
  await writeFile(dest, buf);
  return buf.length;
}

async function pMap(items, fn, concurrency) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      try {
        results[i] = { ok: true, value: await fn(items[i], i) };
      } catch (e) {
        results[i] = { ok: false, error: e.message ?? String(e) };
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function loadExistingSlugs() {
  if (!existsSync(REGISTRY_PATH)) return new Set();
  const src = await readFile(REGISTRY_PATH, 'utf8');
  const slugs = new Set();
  for (const m of src.matchAll(/slug:\s*'([^']+)'/g)) slugs.add(m[1]);
  // Also capture existing GD IDs so we don't re-harvest them
  const ids = new Set();
  for (const m of src.matchAll(/gd\('([a-f0-9]{32})'\)/g)) ids.add(m[1]);
  return { slugs, ids };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(THUMBS_DIR, { recursive: true });

  const allIds = (await readFile(IDS_PATH, 'utf8')).split(/\r?\n/).filter(Boolean);
  const { slugs: existingSlugs, ids: existingIds } = await loadExistingSlugs();
  console.log(`Loaded ${allIds.length} candidate IDs; ${existingIds.size} already in registry.`);

  let manifest = { games: [], rejected: [], started: new Date().toISOString() };
  if (args.resume && existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
    console.log(`Resuming — ${manifest.games.length} kept so far.`);
  }

  const have = new Set([...manifest.games.map((g) => g.id), ...existingIds]);
  const candidates = shuffle(allIds, mulberry32(args.seed)).filter((id) => !have.has(id));
  const pool = candidates.slice(0, args.pool);

  console.log(`Scraping ${pool.length} games at concurrency=${CONCURRENCY}…`);

  let inFlight = 0;
  let done = 0;
  const startTs = Date.now();
  const tick = () => {
    const elapsed = ((Date.now() - startTs) / 1000).toFixed(0);
    process.stdout.write(`\r  progress: ${done}/${pool.length} done, ${manifest.games.length} kept, ${elapsed}s   `);
  };

  await pMap(
    pool,
    async (id) => {
      inFlight++;
      try {
        const meta = await scrapeOne(id);
        const baseSlug = slugify(meta.title);
        if (!baseSlug) throw new Error('empty slug');
        let slug = baseSlug;
        let n = 2;
        while (existingSlugs.has(slug) || manifest.games.some((g) => g.slug === slug)) {
          slug = `${baseSlug}-${n++}`;
        }
        const dest = join(THUMBS_DIR, `embed-${slug}.jpg`);
        const bytes = await downloadImage(meta.image, dest);
        const game = {
          id,
          slug,
          title: meta.title,
          description: (meta.description ?? '').slice(0, 220),
          keywords: meta.keywords,
          imageUrl: meta.image,
          imageBytes: bytes,
          embedUrl: `https://html5.gamedistribution.com/${id}/`,
          category: pickCategory(meta.title, meta.description ?? '', meta.keywords),
          color: colorFromSlug(slug),
        };
        manifest.games.push(game);
        existingSlugs.add(slug); // reserve to prevent races
      } catch (e) {
        manifest.rejected.push({ id, error: e.message ?? String(e) });
      } finally {
        inFlight--;
        done++;
        if (done % 5 === 0 || done === pool.length) tick();
        // periodic checkpoint so a crash doesn't lose progress
        if (done % 25 === 0) {
          await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
        }
      }
    },
    CONCURRENCY,
  );

  console.log();
  manifest.finished = new Date().toISOString();
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  const byCat = manifest.games.reduce((acc, g) => {
    acc[g.category] = (acc[g.category] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`\nKept ${manifest.games.length} games. Rejected ${manifest.rejected.length}.`);
  console.log('By category:', byCat);
  if (manifest.games.length < args.target) {
    console.log(`Below target ${args.target}; re-run with --resume to fetch more.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
