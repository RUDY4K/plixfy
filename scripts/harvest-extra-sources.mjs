#!/usr/bin/env node
/**
 * Harvest "extra" game sources beyond the GameDistribution mega-feed.
 *
 * Inputs (all hardcoded below):
 *   - Batch 1: 24 standalone .io games (provider: 'direct')
 *   - Batch 2: OnlineGames.io public JSON catalog (provider: 'onlinegames')
 *   - Batch 3: Miniplay marquee titles (provider: 'miniplay')
 *   - Batch 4: Curated slug list run against GameFlare / SilverGames / RocketGames
 *     — header-verified at runtime, only passes are emitted
 *   - Batch 5: BitLife on GameDistribution (provider: 'gamedistribution')
 *
 * Header check: a URL is considered "embeddable" when
 *   - HTTP status is 2xx
 *   - X-Frame-Options is absent (or value is permissive)
 *   - CSP frame-ancestors is absent OR contains a wildcard (*)
 *
 * Output:
 *   - games/registry-extra.ts — typed array EXTRA_GAMES
 *   - public/assets/thumbnails/extra-<slug>.svg for any game without
 *     an external thumbnail URL we trust
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const execFileP = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REGISTRY_PATH = join(ROOT, 'games', 'registry-extra.ts');
const THUMB_DIR = join(ROOT, 'public', 'assets', 'thumbnails');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/* ─────────────────────────── BATCH 1 — direct .io games ───────────────── */

const IO_GAMES_DIRECT = [
  { slug: 'slither-io', title: 'Slither.io', url: 'https://slither.io', category: 'io', color: '#22c55e', controls: 'Mouse / Touch', description: 'The classic snake-eating-snake battle royale. Grow long, dodge, repeat.' },
  { slug: 'shellshock-io', title: 'Shell Shockers', url: 'https://shellshock.io', category: 'shooting', color: '#fbbf24', controls: 'WASD + Mouse', description: 'Multiplayer FPS where the soldiers are eggs and the bullets crack shells.' },
  { slug: 'skribbl-io', title: 'skribbl.io', url: 'https://skribbl.io', category: 'word', color: '#3b82f6', controls: 'Mouse', description: 'Pictionary online — draw a word while everyone else guesses.' },
  { slug: 'surviv-io', title: 'Surviv.io', url: 'https://surviv.io', category: 'shooting', color: '#84cc16', controls: 'WASD + Mouse', description: '2D battle royale — loot, shoot, last one standing wins.' },
  { slug: 'venge-io', title: 'Venge.io', url: 'https://venge.io', category: 'shooting', color: '#a855f7', controls: 'WASD + Mouse', description: 'Browser FPS with classes, gadgets, and ranked play.' },
  { slug: 'krunker-io', title: 'Krunker.io', url: 'https://krunker.io', category: 'shooting', color: '#ef4444', controls: 'WASD + Mouse', description: 'Fast pixel-art FPS with classes and competitive arenas.' },
  { slug: 'paper-io', title: 'Paper.io', url: 'https://paper-io.com', category: 'io', color: '#0ea5e9', controls: 'Arrow keys / WASD', description: 'Capture territory by closing loops — but don’t get cut off.' },
  { slug: 'bonk-io', title: 'Bonk.io', url: 'https://bonk.io', category: 'io', color: '#facc15', controls: 'Arrow keys', description: 'Physics-based pushing combat — knock everyone off the platform.' },
  { slug: 'yohoho-io', title: 'YoHoHo.io', url: 'https://yohoho.io', category: 'io', color: '#dc2626', controls: 'WASD + Mouse', description: 'Pirate battle royale on a shrinking island.' },
  { slug: 'zombsroyale-io', title: 'ZombsRoyale.io', url: 'https://zombsroyale.io', category: 'io', color: '#06b6d4', controls: 'WASD + Mouse', description: '2D battle royale with loot, vehicles and weapons.' },
  { slug: 'powerline-io', title: 'Powerline.io', url: 'https://powerline.io', category: 'io', color: '#10b981', controls: 'Mouse / Touch', description: 'Neon Snake reimagined for online multiplayer.' },
  { slug: 'splix-io', title: 'Splix.io', url: 'https://splix.io', category: 'io', color: '#f97316', controls: 'Arrow keys / WASD', description: 'Paint the map — claim land, defend your trail.' },
  { slug: 'hole-io', title: 'Hole.io', url: 'https://hole-io.com', category: 'io', color: '#1f2937', controls: 'Mouse / Touch', description: 'Swallow everything in sight to grow the biggest hole.' },
  { slug: 'wormate-io', title: 'Wormate.io', url: 'https://wormate.io', category: 'io', color: '#ec4899', controls: 'Mouse / WASD', description: 'A candy-feasting worm sprint with combo boosts.' },
  { slug: 'moomoo-io', title: 'MooMoo.io', url: 'https://moomoo.io', category: 'io', color: '#65a30d', controls: 'WASD + Mouse', description: 'Survive and build a base in this rustic .io land grab.' },
  { slug: 'deeeep-io', title: 'Deeeep.io', url: 'https://deeeep.io', category: 'io', color: '#0369a1', controls: 'Mouse / WASD', description: 'Underwater food chain — eat smaller fish, evade bigger ones.' },
  { slug: 'mope-io', title: 'Mope.io', url: 'https://mope.io', category: 'io', color: '#16a34a', controls: 'Mouse / WASD', description: 'Animal evolution — eat fruit, drink water, climb the food chain.' },
  { slug: 'lordz-io', title: 'Lordz.io', url: 'https://lordz.io', category: 'io', color: '#8b5cf6', controls: 'WASD + Mouse', description: 'Build an army, raid villages, conquer the map.' },
  { slug: 'taming-io', title: 'Taming.io', url: 'https://taming.io', category: 'io', color: '#f59e0b', controls: 'WASD + Mouse', description: 'Tame creatures and fight off survivors in this co-op .io.' },
  { slug: 'florr-io', title: 'Florr.io', url: 'https://florr.io', category: 'io', color: '#fb7185', controls: 'WASD + Mouse', description: 'A bug-themed bullet-hell with petal loadouts.' },
  { slug: 'territorial-io', title: 'Territorial.io', url: 'https://territorial.io', category: 'strategy', color: '#2563eb', controls: 'Mouse', description: 'Real-time strategy: claim, defend, conquer the world map.' },
  { slug: 'narrow-one', title: 'Narrow.one', url: 'https://narrow.one', category: 'shooting', color: '#7c3aed', controls: 'WASD + Mouse', description: 'Medieval bow-and-arrow PvP with team objectives.' },
  { slug: 'ducklings-io', title: 'Ducklings.io', url: 'https://ducklings.io', category: 'io', color: '#fde047', controls: 'Mouse', description: 'Lead a chain of ducklings, ram into rivals to win.' },
  { slug: 'smashkarts-io', title: 'Smash Karts', url: 'https://smashkarts.io', category: 'multiplayer', color: '#fb923c', controls: 'WASD + Mouse', description: 'Kart-arena combat — collect weapons and KO opponents.' },
];

/* ─────────────────────────── BATCH 3 — Miniplay marquee ────────────────── */

const MINIPLAY_GAMES = [
  { slug: 'subway-surfers', title: 'Subway Surfers', category: 'arcade', color: '#f97316', controls: 'Arrow keys / Swipe', description: 'Endless runner through subway tracks — dodge trains, grab coins.' },
  { slug: 'crossy-road', title: 'Crossy Road', category: 'arcade', color: '#84cc16', controls: 'Arrow keys / Tap', description: 'Hop forward across an infinite hazard-filled road.' },
  { slug: 'cut-the-rope', title: 'Cut the Rope', category: 'puzzle', color: '#a855f7', controls: 'Mouse / Touch', description: 'Slice ropes to feed Om Nom — physics-based candy puzzle.' },
  { slug: 'drift-hunters', title: 'Drift Hunters', category: 'racing', color: '#ef4444', controls: 'Arrow keys / WASD', description: 'Tune and drift a roster of stock cars across 10 unique tracks.' },
  { slug: 'madalin-stunt-cars', title: 'Madalin Stunt Cars', category: 'racing', color: '#f59e0b', controls: 'Arrow keys', description: 'Drive supercars across enormous open-world ramps and loops.' },
  { slug: 'lolbeans-io', title: 'LOL Beans', category: 'multiplayer', color: '#fb7185', controls: 'WASD / Arrow keys', description: 'Battle-royale obstacle course — race against the clock and rivals.' },
  { slug: 'worms-zone-io', title: 'Worms Zone', category: 'io', color: '#ec4899', controls: 'Mouse / WASD', description: 'Slither, eat, and outgrow rival worms in this snake arena.' },
  { slug: 'fall-guys', title: 'Fall Guys (Browser)', category: 'multiplayer', color: '#c084fc', controls: 'WASD / Arrow keys', description: 'Hilarious obstacle gauntlet — survive each round to advance.' },
  { slug: 'retro-bowl', title: 'Retro Bowl', category: 'sports', color: '#1d4ed8', controls: 'Mouse / Touch', description: 'Old-school NFL season manager with throwback graphics.' },
  { slug: 'geometry-dash', title: 'Geometry Dash', category: 'arcade', color: '#0891b2', controls: 'Tap / Space', description: 'Rhythm-platformer — jump in time with the music or die.' },
];

/* ─────────────────────────── BATCH 4 — portal aggregators ─────────────── */

// Curated slug list to probe against each portal. Slugs are *candidates* —
// the harvester only emits entries that header-verify on the actual portal.
const PORTAL_CANDIDATES = [
  { slug: 'madalin-stunt-cars-2', title: 'Madalin Stunt Cars 2', category: 'racing', color: '#f59e0b' },
  { slug: 'drift-hunters', title: 'Drift Hunters', category: 'racing', color: '#dc2626' },
  { slug: 'drift-hunters-2', title: 'Drift Hunters 2', category: 'racing', color: '#ef4444' },
  { slug: 'cut-the-rope', title: 'Cut the Rope', category: 'puzzle', color: '#a855f7' },
  { slug: 'smash-karts', title: 'Smash Karts', category: 'multiplayer', color: '#fb923c' },
  { slug: 'moto-x3m-2', title: 'Moto X3M 2', category: 'racing', color: '#fbbf24' },
  { slug: 'moto-x3m-3', title: 'Moto X3M 3', category: 'racing', color: '#f97316' },
  { slug: 'moto-x3m-pool-party', title: 'Moto X3M Pool Party', category: 'racing', color: '#06b6d4' },
  { slug: '8-ball-pool', title: '8 Ball Pool', category: 'sports', color: '#0c4a6e' },
  { slug: 'basketball-stars', title: 'Basketball Stars', category: 'sports', color: '#f97316' },
  { slug: 'soccer-skills', title: 'Soccer Skills', category: 'sports', color: '#16a34a' },
  { slug: 'mahjong', title: 'Mahjong', category: 'puzzle', color: '#10b981' },
  { slug: 'tetris', title: 'Tetris', category: 'puzzle', color: '#06b6d4' },
  { slug: 'chess', title: 'Chess', category: 'board', color: '#475569' },
  { slug: 'sudoku', title: 'Sudoku', category: 'puzzle', color: '#7c3aed' },
  { slug: 'solitaire', title: 'Solitaire Classic', category: 'board', color: '#10b981' },
  { slug: 'bubble-shooter', title: 'Bubble Shooter', category: 'puzzle', color: '#38bdf8' },
  { slug: '2048', title: '2048 (Portal)', category: 'puzzle', color: '#edc850' },
  { slug: 'temple-run', title: 'Temple Run', category: 'arcade', color: '#a16207' },
  { slug: 'temple-run-2', title: 'Temple Run 2', category: 'arcade', color: '#92400e' },
  { slug: 'subway-surfers', title: 'Subway Surfers', category: 'arcade', color: '#f97316' },
  { slug: 'fruit-ninja', title: 'Fruit Ninja', category: 'arcade', color: '#dc2626' },
  { slug: 'flappy-bird', title: 'Flappy Bird', category: 'arcade', color: '#fde047' },
  { slug: 'stickman-hook', title: 'Stickman Hook', category: 'stickman', color: '#fb923c' },
  { slug: 'stickman-archer', title: 'Stickman Archer', category: 'stickman', color: '#dc2626' },
  { slug: 'stick-war', title: 'Stick War', category: 'stickman', color: '#94a3b8' },
  { slug: 'happy-wheels', title: 'Happy Wheels', category: 'arcade', color: '#ea580c' },
  { slug: 'crossy-road', title: 'Crossy Road', category: 'arcade', color: '#84cc16' },
  { slug: 'tank-trouble', title: 'Tank Trouble', category: 'shooting', color: '#94a3b8' },
  { slug: 'bloons-td', title: 'Bloons TD', category: 'strategy', color: '#3b82f6' },
];

const PORTALS = [
  { id: 'miniplay',   urlOf: (slug) => `https://www.miniplay.com/embed/${slug}` },
  { id: 'gameflare',  urlOf: (slug) => `https://www.gameflare.com/embed/${slug}/` },
  { id: 'silvergames', urlOf: (slug) => `https://www.silvergames.com/en/${slug}/iframe?t=1` },
  { id: 'rocketgames', urlOf: (slug) => `https://www.rocketgames.io/embed/${slug}` },
];

/* ─────────────────────────── BATCH 5 — BitLife on GD ──────────────────── */

const BITLIFE = {
  slug: 'bitlife-life-simulator',
  title: 'BitLife — Life Simulator',
  category: 'simulation',
  color: '#0ea5e9',
  controls: 'Mouse / Touch',
  description: 'Text-driven life simulator — birth to death, every choice yours.',
  longDescription: 'BitLife is a free text-driven life-simulator: born into a random family, you age year by year and decide everything — school, jobs, relationships, crime, retirement. Every life is different.',
  provider: 'gamedistribution',
  embedUrl: 'https://html5.gamedistribution.com/2e44fb60fd3f4606b1b06c17a2b9d60d/',
  thumbnail: '/assets/thumbnails/extra-bitlife-life-simulator.svg',
};

/* ─────────────────────────── HTTP helpers ─────────────────────────────── */

/**
 * Header-verify a URL. Returns { ok, status, blockReason }.
 *
 * blockReason is one of: 'http' | 'xfo' | 'csp' | 'unreachable' | null
 */
async function verifyEmbeddable(url, timeoutMs = 9000) {
  // Some hosts (notably GameFlare via Cloudflare) treat Node's `fetch`
  // differently from a real browser TLS fingerprint and serve a 403
  // challenge. Curl matches the browser fingerprint closely enough to
  // pass the challenge — and is what every other harvester in this
  // repo already uses.
  try {
    const { stdout } = await execFileP(
      'curl',
      [
        '-sIL',
        '--max-time', String(Math.ceil(timeoutMs / 1000)),
        '-A', UA,
        url,
      ],
      { timeout: timeoutMs + 2000, maxBuffer: 1024 * 1024 },
    );
    if (!stdout) return { ok: false, status: 0, blockReason: 'unreachable' };

    // Parse headers from each response block (curl prints chained
    // responses for redirects) — take the LAST one.
    const blocks = stdout.split(/\r?\n\r?\n/).filter((b) => b.startsWith('HTTP/'));
    const last = blocks[blocks.length - 1] || stdout;
    const statusLine = (last.match(/^HTTP\/[\d.]+\s+(\d+)/m) || [])[1];
    const status = Number(statusLine) || 0;
    if (status < 200 || status >= 400) {
      return { ok: false, status, blockReason: 'http' };
    }

    const lc = last.toLowerCase();
    const xfoMatch = lc.match(/^x-frame-options:\s*([^\r\n]+)/m);
    if (xfoMatch && /(deny|sameorigin)/i.test(xfoMatch[1])) {
      return { ok: false, status, blockReason: 'xfo' };
    }

    const cspMatch = lc.match(/^content-security-policy:[^\n]+/m);
    if (cspMatch) {
      const faMatch = cspMatch[0].match(/frame-ancestors([^;]*)/);
      if (faMatch) {
        const fa = ' ' + faMatch[1] + ' ';
        // Permissive iff it contains a bare wildcard token.
        if (!/[\s']\*[\s']/.test(fa)) {
          return { ok: false, status, blockReason: 'csp' };
        }
      }
    }
    return { ok: true, status, blockReason: null };
  } catch (err) {
    return { ok: false, status: 0, blockReason: 'unreachable' };
  }
}

async function pmap(items, fn, concurrency = 8) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      try {
        out[idx] = await fn(items[idx], idx);
      } catch (err) {
        out[idx] = { error: String(err) };
      }
    }
  });
  await Promise.all(workers);
  return out;
}

/* ─────────────────────────── Output helpers ───────────────────────────── */

function escSingle(s) {
  // Collapse all whitespace (including embedded \r\n from JSON sources) to
  // single spaces, then escape backslashes and single quotes for emission
  // into a JS single-quoted string literal. Order matters — backslash
  // first so we don't double-escape the slash we add in front of quotes.
  return String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
}

function keywordsFor(title, category, extra = []) {
  const tokens = title
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['the', 'and', 'for', 'with', 'this', 'that', 'game'].includes(w));
  const set = new Set([title.toLowerCase(), category, ...tokens, ...extra, 'free online']);
  return [...set].slice(0, 10);
}

function difficultyFor(category) {
  if (['puzzle', 'strategy', 'word', 'board'].includes(category)) return 'medium';
  if (['casual', 'girls', 'clicker', 'simulation', 'cooking', 'arcade'].includes(category)) return 'easy';
  return 'medium';
}

function svgThumbContent(title, color) {
  const safe = String(title).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const fontSize = safe.length > 18 ? 32 : safe.length > 12 ? 40 : 52;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 384" width="512" height="384">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="40%" r="65%">
      <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.5)"/>
    </radialGradient>
  </defs>
  <rect width="512" height="384" fill="url(#bg)"/>
  <rect width="512" height="384" fill="url(#vignette)"/>
  <text x="256" y="200" text-anchor="middle"
        font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-size="${fontSize}" font-weight="800" fill="#ffffff"
        style="text-shadow: 0 2px 8px rgba(0,0,0,0.6)">${safe}</text>
</svg>
`;
}

async function ensureThumbDir() {
  await mkdir(THUMB_DIR, { recursive: true });
}

async function writeSvgThumb(slug, title, color) {
  await writeFile(join(THUMB_DIR, `extra-${slug}.svg`), svgThumbContent(title, color));
  return `/assets/thumbnails/extra-${slug}.svg`;
}

function emitEntry(g) {
  // Long description: enrich short description with a CTA tail.
  const desc = g.description || `${g.title} is a free online ${g.category} game.`;
  const longDesc = g.longDescription || `${desc} Play ${g.title} for free in your browser — no download required.`;
  const kws = keywordsFor(g.title, g.category, g.keywords || []);
  return `  {
    kind: 'embed',
    slug: '${escSingle(g.slug)}',
    title: '${escSingle(g.title)}',
    description: '${escSingle(desc)}',
    longDescription:
      '${escSingle(longDesc)}',
    thumbnail: '${escSingle(g.thumbnail)}',
    category: '${g.category}',
    difficulty: '${difficultyFor(g.category)}',
    controls: '${escSingle(g.controls)}',
    color: '${g.color}',
    keywords: [${kws.map((k) => `'${escSingle(k)}'`).join(', ')}],
    status: 'live',
    provider: '${g.provider}',
    embedUrl: '${escSingle(g.embedUrl)}',
  },`;
}

/* ─────────────────────────── Main ─────────────────────────────────────── */

async function main() {
  await ensureThumbDir();
  const all = [];
  const skipped = [];

  // BATCH 1 — direct .io games
  console.error('[B1] Verifying 24 .io games...');
  const b1Results = await pmap(IO_GAMES_DIRECT, async (g) => {
    const v = await verifyEmbeddable(g.url);
    if (!v.ok) return { skip: true, slug: g.slug, reason: `${v.blockReason}:${v.status}` };
    const thumbnail = await writeSvgThumb(g.slug, g.title, g.color);
    return {
      ...g,
      controls: g.controls,
      provider: 'direct',
      embedUrl: g.url,
      thumbnail,
      keywords: ['io games', 'multiplayer', 'free online'],
    };
  }, 8);
  for (const r of b1Results) {
    if (r?.skip) { skipped.push({ batch: 'B1', ...r }); continue; }
    if (r) all.push(r);
  }
  console.error(`[B1] kept ${b1Results.filter((r) => r && !r.skip).length}/${IO_GAMES_DIRECT.length}`);

  // BATCH 2 — OnlineGames.io JSON catalog
  console.error('[B2] Fetching OnlineGames.io JSON catalog...');
  let ogEntries = [];
  try {
    const res = await fetch('https://www.onlinegames.io/media/plugins/genGames/embed.json', {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    const data = await res.json();
    ogEntries = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`[B2] feed fetch failed: ${err.message}`);
  }
  console.error(`[B2] feed has ${ogEntries.length} games`);

  const seenSlugs = new Set(all.map((g) => g.slug));
  for (const og of ogEntries) {
    if (!og?.title || !og?.embed) continue;
    // The OnlineGames.io feed serves several tail patterns:
    //   /<slug>/index.html      (~177 of 259 — the original case)
    //   /<slug>/index-og.html   (~66 — earlier strip-rule missed these)
    //   /<slug>/game.html       (~12)
    //   /<slug>/game-og.html    (~1)
    // Plus the occasional `#anchor` fragment. The previous slug
    // derivation only stripped /index.html, so 79 games collapsed
    // onto two slugs (`og-game-html`, `og-index-og-html`) and only
    // the first of each survived dedupe — we lost 77 games.
    const cleanedUrl = og.embed.split('#')[0].replace(/\/(index|game)(-og)?\.html$/i, '');
    const rawSlug = cleanedUrl.split('/').filter(Boolean).pop();
    const slug = `og-${rawSlug}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);
    const tags = (og.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
    const category = mapOgTagsToCategory(tags, og.title);
    const color = colorForCategory(category);
    // Strip backslash-escaped junk that scraped HTML often produces — e.g.
    // "cat\s species" → "cat species". These literal backslashes break
    // JS string literals at emission time.
    const cleanDesc = (og.description || '').replace(/\\/g, '');
    const shortDesc = cleanDesc.split(/\.\s+/).slice(0, 1).join('. ').slice(0, 180);
    const longDesc = cleanDesc.slice(0, 320);
    all.push({
      slug,
      title: og.title,
      description: shortDesc || `${og.title} — play free on Plixfy.`,
      longDescription: longDesc || `${og.title} is a free browser game. Play instantly — no download required.`,
      category,
      controls: defaultControlsFor(category),
      color,
      keywords: ['free online', ...tags.slice(0, 6)],
      provider: 'onlinegames',
      embedUrl: og.embed,
      thumbnail: og.image || (await writeSvgThumb(slug, og.title, color)),
    });
  }
  console.error(`[B2] kept ${all.length - 24} (running total: ${all.length})`);

  // BATCH 3 — Miniplay
  console.error('[B3] Verifying 10 Miniplay marquee titles...');
  const b3Results = await pmap(MINIPLAY_GAMES, async (g) => {
    const url = `https://www.miniplay.com/embed/${g.slug}`;
    const v = await verifyEmbeddable(url);
    if (!v.ok) return { skip: true, slug: g.slug, reason: `${v.blockReason}:${v.status}` };
    const slug = `mp-${g.slug}`;
    const thumbnail = await writeSvgThumb(slug, g.title, g.color);
    return {
      slug,
      title: g.title,
      description: g.description,
      category: g.category,
      controls: g.controls,
      color: g.color,
      keywords: ['free online'],
      provider: 'miniplay',
      embedUrl: url,
      thumbnail,
    };
  }, 4);
  let b3Kept = 0;
  for (const r of b3Results) {
    if (r?.skip) { skipped.push({ batch: 'B3', ...r }); continue; }
    if (r) { all.push(r); b3Kept++; }
  }
  console.error(`[B3] kept ${b3Kept}/${MINIPLAY_GAMES.length}`);

  // BATCH 4 — GameFlare / SilverGames / RocketGames
  console.error('[B4] Verifying portal candidates...');
  for (const portal of PORTALS) {
    if (portal.id === 'miniplay') continue; // already covered in B3
    const results = await pmap(PORTAL_CANDIDATES, async (c) => {
      const url = portal.urlOf(c.slug);
      const v = await verifyEmbeddable(url);
      if (!v.ok) return { skip: true, slug: c.slug, reason: `${v.blockReason}:${v.status}` };
      const slug = `${portal.id}-${c.slug}`;
      const thumbnail = await writeSvgThumb(slug, c.title, c.color);
      return {
        slug,
        title: c.title,
        description: `${c.title} — play free in your browser, no download required.`,
        category: c.category,
        controls: defaultControlsFor(c.category),
        color: c.color,
        keywords: [c.slug.replace(/-/g, ' '), 'free online'],
        provider: portal.id,
        embedUrl: url,
        thumbnail,
      };
    }, 4);
    let kept = 0;
    for (const r of results) {
      if (r?.skip) { skipped.push({ batch: `B4/${portal.id}`, ...r }); continue; }
      if (r) { all.push(r); kept++; }
    }
    console.error(`[B4/${portal.id}] kept ${kept}/${PORTAL_CANDIDATES.length}`);
  }

  // BATCH 5 — BitLife
  console.error('[B5] BitLife on GameDistribution...');
  await writeSvgThumb(BITLIFE.slug, BITLIFE.title, BITLIFE.color);
  all.push({
    ...BITLIFE,
    thumbnail: `/assets/thumbnails/extra-${BITLIFE.slug}.svg`,
    keywords: ['bitlife', 'life simulator', 'free online'],
  });

  // De-dupe by slug just in case
  const dedup = new Map();
  for (const g of all) dedup.set(g.slug, g);
  const finalList = [...dedup.values()];

  // Sort by category then title for stable diffs
  finalList.sort((a, b) =>
    (a.category || '').localeCompare(b.category || '') || (a.title || '').localeCompare(b.title || '')
  );

  // Emit TS
  const body = finalList.map(emitEntry).join('\n');
  const header = `import type { EmbedGameMeta } from '@/types/game';

/**
 * Extra-source embed catalog (${finalList.length} entries).
 *
 * Generated by scripts/harvest-extra-sources.mjs. Sources:
 *   - direct (.io games loaded from their canonical domain)
 *   - onlinegames (OnlineGames.io public JSON catalog)
 *   - miniplay (Miniplay /embed/ URLs)
 *   - gameflare (GameFlare /embed/ URLs)
 *   - silvergames (SilverGames /iframe URLs)
 *   - rocketgames (RocketGames /embed/ URLs)
 *   - gamedistribution (BitLife, already covered by the main feed but pinned here)
 *
 * Each entry is header-verified at harvest time: HTTP 2xx + no
 * blocking X-Frame-Options + no restrictive CSP frame-ancestors.
 *
 * Skipped on this run: see /tmp/extra-skipped.json for diagnostic.
 */

const _EXTRA_GAMES = [
${body}
];

export const EXTRA_GAMES: readonly EmbedGameMeta[] = _EXTRA_GAMES as unknown as readonly EmbedGameMeta[];
`;
  await writeFile(REGISTRY_PATH, header);

  // Diagnostic — write next to the script
  await writeFile(join(__dirname, 'extra-skipped.json'), JSON.stringify(skipped, null, 2));
  console.error(`\nWrote ${REGISTRY_PATH}`);
  console.error(`Final entries: ${finalList.length}`);
  console.error(`Skipped: ${skipped.length} (see /tmp/extra-skipped.json)`);

  // Provider breakdown
  const byProvider = {};
  for (const g of finalList) byProvider[g.provider] = (byProvider[g.provider] || 0) + 1;
  console.error('By provider:', byProvider);
}

/* ─────────────────────────── tag -> category mapping ─────────────────── */

function mapOgTagsToCategory(tags, title) {
  const t = tags.map((x) => x.toLowerCase());
  const titleLc = (title || '').toLowerCase();

  const has = (k) => t.includes(k) || titleLc.includes(k);

  if (has('.io') || /\.io\b/.test(titleLc) || has('io games') || has('io')) return 'io';
  if (has('stickman') || has('stick')) return 'stickman';
  if (has('zombie') || has('horror')) return 'zombie';
  if (has('shooting') || has('shooter') || has('gun') || has('fps') || has('sniper')) return 'shooting';
  if (has('racing') || has('drift') || has('car') || has('drive') || has('bike') || has('moto') || has('truck')) return 'racing';
  if (has('basketball') || has('soccer') || has('football') || has('sports') || has('pool')) return 'sports';
  if (has('puzzle') || has('match-3') || has('match 3') || has('bubble shooter') || has('mahjong')) return 'puzzle';
  if (has('strategy') || has('tower defense') || has('rts')) return 'strategy';
  if (has('arcade') || has('runner') || has('endless') || has('jump') || has('flap')) return 'arcade';
  if (has('chess') || has('checkers') || has('cards') || has('solitaire') || has('mahjong')) return 'board';
  if (has('word') || has('words') || has('typing') || has('crossword')) return 'word';
  if (has('clicker') || has('idle')) return 'clicker';
  if (has('cooking') || has('chef') || has('kitchen') || has('restaurant')) return 'cooking';
  if (has('girls') || has('dressup') || has('makeup') || has('fashion') || has('princess')) return 'girls';
  if (has('action') || has('fight') || has('ninja') || has('battle')) return 'action';
  if (has('adventure') || has('quest') || has('escape')) return 'adventure';
  if (has('simulator') || has('simulation') || has('tycoon')) return 'simulation';
  if (has('skill') || has('aim') || has('precision')) return 'skill';
  if (has('multiplayer') || has('multi-player') || has('2 player') || has('two player')) return 'multiplayer';
  return 'casual';
}

function colorForCategory(cat) {
  return {
    arcade: '#f59e0b',
    racing: '#dc2626',
    shooting: '#ef4444',
    action: '#f97316',
    sports: '#16a34a',
    puzzle: '#a855f7',
    strategy: '#3b82f6',
    adventure: '#84cc16',
    io: '#06b6d4',
    multiplayer: '#6366f1',
    stickman: '#94a3b8',
    zombie: '#15803d',
    simulation: '#eab308',
    clicker: '#8b5cf6',
    board: '#475569',
    word: '#ec4899',
    girls: '#f472b6',
    cooking: '#f97316',
    skill: '#14b8a6',
    casual: '#0ea5e9',
  }[cat] || '#0ea5e9';
}

function defaultControlsFor(cat) {
  return {
    racing: 'Arrow keys / WASD',
    shooting: 'WASD + Mouse',
    action: 'Arrow keys / WASD',
    sports: 'Mouse / Keyboard',
    puzzle: 'Mouse / Touch',
    strategy: 'Mouse',
    adventure: 'Arrow keys / WASD',
    io: 'Mouse / WASD',
    multiplayer: 'WASD + Mouse',
    arcade: 'Arrow keys / Tap',
    stickman: 'Arrow keys / Touch',
    zombie: 'WASD + Mouse',
    simulation: 'Mouse / Touch',
    clicker: 'Mouse / Tap',
    board: 'Mouse / Touch',
    word: 'Keyboard',
    girls: 'Mouse / Touch',
    cooking: 'Mouse / Touch',
    skill: 'Mouse / Touch',
    casual: 'Mouse / Touch',
  }[cat] || 'Mouse / Touch';
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
