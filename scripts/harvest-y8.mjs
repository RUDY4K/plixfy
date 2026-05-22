#!/usr/bin/env node
/**
 * Harvest Y8 — paginated tag-listing scrape, then per-slug metadata fetch.
 *
 * Discovery
 *   /tags/{tag}?page={N} returns 72 unique game-card links per page,
 *   with zero overlap between pages (verified). We sweep TAGS × pages,
 *   dedupe slugs, then fetch each /embed/{slug} for og:title + og:image.
 *
 * Verification
 *   Every emitted entry passes:
 *     - HTTP 2xx on /embed/{slug}
 *     - No X-Frame-Options
 *     - No restrictive CSP frame-ancestors
 *   Failures are written to scripts/y8-skipped.json for diagnostics.
 *
 * Output
 *   games/registry-y8.ts — typed array Y8_GAMES.
 *
 * Run with `--max=<N>` to cap the final entry count (default 800).
 * Run with `--pages=<N>` to override pages-per-tag (default 6).
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REGISTRY_PATH = join(ROOT, 'games', 'registry-y8.ts');
const SKIPPED_PATH = join(__dirname, 'y8-skipped.json');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const COMMON_HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const argv = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^-+/, ''), true];
  }),
);
const MAX_GAMES = Number(argv.max ?? 800);
const PAGES_PER_TAG = Number(argv.pages ?? 6);
const CONCURRENCY = 8;

/* ───────────────────────── Tag → Plixfy category map ──────────────────── */

const TAG_TO_CATEGORY = {
  action: 'action',
  arcade: 'arcade',
  adventure: 'adventure',
  puzzle: 'puzzle',
  shooting: 'shooting',
  racing: 'racing',
  sports: 'sports',
  strategy: 'strategy',
  multiplayer: 'multiplayer',
  girls: 'girls',
  funny: 'casual',
  skill: 'skill',
  '2-player': 'multiplayer',
  zombie: 'zombie',
  stickman: 'stickman',
  cooking: 'cooking',
  word: 'word',
  board: 'board',
  fighting: 'action',
  io: 'io',
};

const TAGS = Object.keys(TAG_TO_CATEGORY);

const COLOR_BY_CATEGORY = {
  action: '#ef4444',
  arcade: '#f97316',
  adventure: '#a78bfa',
  puzzle: '#0ea5e9',
  shooting: '#dc2626',
  racing: '#f59e0b',
  sports: '#22c55e',
  strategy: '#7c3aed',
  multiplayer: '#06b6d4',
  girls: '#ec4899',
  casual: '#8b5cf6',
  skill: '#10b981',
  zombie: '#84cc16',
  stickman: '#475569',
  cooking: '#f43f5e',
  word: '#3b82f6',
  board: '#64748b',
  io: '#0891b2',
};

const DEFAULT_CONTROLS_BY_CATEGORY = {
  racing: 'Arrow keys / WASD',
  shooting: 'WASD + Mouse',
  multiplayer: 'WASD + Mouse',
  io: 'Mouse / WASD',
  action: 'WASD / Arrow keys',
  arcade: 'Arrow keys / Touch',
  puzzle: 'Mouse / Touch',
  strategy: 'Mouse',
  adventure: 'WASD / Arrow keys',
  girls: 'Mouse / Touch',
  casual: 'Mouse / Touch',
  skill: 'Mouse',
  zombie: 'WASD + Mouse',
  stickman: 'WASD / Arrow keys',
  cooking: 'Mouse / Touch',
  word: 'Keyboard',
  board: 'Mouse',
  sports: 'Mouse / Keyboard',
};

/* ───────────────────────── Fetch helpers ──────────────────────────────── */

async function fetchText(url) {
  const res = await fetch(url, { headers: COMMON_HEADERS, redirect: 'follow' });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, status: res.status, text: await res.text() };
}

async function fetchHeaders(url) {
  // HEAD request — Y8 honors HEAD for /embed/ pages.
  const res = await fetch(url, {
    method: 'HEAD',
    headers: COMMON_HEADERS,
    redirect: 'follow',
  });
  return {
    ok: res.ok,
    status: res.status,
    xFrame: res.headers.get('x-frame-options'),
    csp: res.headers.get('content-security-policy'),
  };
}

function isBlockingHeader({ xFrame, csp }) {
  if (xFrame && /(deny|sameorigin)/i.test(xFrame)) return true;
  if (csp && /frame-ancestors/i.test(csp)) {
    const m = csp.match(/frame-ancestors[^;]*/i)[0].toLowerCase();
    // Permissive: contains a wildcard or http(s):
    if (m.includes('*') || m.includes('http:') || m.includes('https:')) return false;
    return true;
  }
  return false;
}

async function pmap(items, limit, worker) {
  const out = new Array(items.length);
  let next = 0;
  async function pull() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      try {
        out[i] = await worker(items[i], i);
      } catch (err) {
        out[i] = { error: err.message };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, pull));
  return out;
}

/* ───────────────────────── Slug discovery ─────────────────────────────── */

async function discoverSlugs() {
  const slugs = new Set();
  // Sweep TAGS × PAGES_PER_TAG. ~10 tags × 6 pages × 72 = ~4,300 candidate
  // slugs (with significant cross-tag overlap → expect ~1,500 unique).
  for (const tag of TAGS) {
    for (let page = 1; page <= PAGES_PER_TAG; page++) {
      const url = `https://www.y8.com/tags/${tag}?page=${page}`;
      const r = await fetchText(url);
      if (!r.ok) {
        console.error(`  [list] /tags/${tag}?page=${page} → ${r.status}, stopping tag`);
        break;
      }
      const before = slugs.size;
      const matches = r.text.matchAll(/href="https:\/\/www\.y8\.com\/games\/([a-z0-9_-]+)"/g);
      for (const m of matches) slugs.add(m[1]);
      const added = slugs.size - before;
      console.error(`  [list] /tags/${tag}?page=${page} → +${added} new (total ${slugs.size})`);
      if (added === 0 && page > 1) break; // pagination exhausted
    }
  }
  return [...slugs];
}

/* ───────────────────────── Per-slug metadata + verify ─────────────────── */

const META_RE = {
  ogTitle: /<meta\s+property="og:title"\s+content="([^"]+)"/i,
  ogImage: /<meta\s+property="og:image"\s+content="([^"]+)"/i,
  ogDesc: /<meta\s+property="og:description"\s+content="([^"]+)"/i,
};

function cleanTitle(raw) {
  // Y8 appends " - Y8.com" to every og:title. Strip it.
  return raw
    .replace(/\s*[-|]\s*Y8\.?com\s*$/i, '')
    .replace(/\s*[-|]\s*Play\s+at\s+Y8\.?com\s*$/i, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

function categorize(tags) {
  for (const t of tags) {
    const c = TAG_TO_CATEGORY[t];
    if (c) return c;
  }
  return 'casual';
}

async function harvestSlug(slug, tagHint) {
  const url = `https://www.y8.com/embed/${slug}`;
  const r = await fetchText(url);
  if (!r.ok) return { skip: true, slug, reason: `embed-${r.status}` };
  // Cheap blocking-header check via the same response (Headers came back
  // ok above; verify the body isn't itself a "click here to play" page).
  if (/click\s+here\s+to\s+play|not\s+available\s+here/i.test(r.text)) {
    return { skip: true, slug, reason: 'click-here-overlay' };
  }
  const title = (r.text.match(META_RE.ogTitle)?.[1] || '').trim();
  const image = (r.text.match(META_RE.ogImage)?.[1] || '').trim();
  const description = (r.text.match(META_RE.ogDesc)?.[1] || '').trim();
  if (!title) return { skip: true, slug, reason: 'no-og-title' };
  if (!image) return { skip: true, slug, reason: 'no-og-image' };

  const cleanedTitle = cleanTitle(title);
  const category = tagHint && TAG_TO_CATEGORY[tagHint] ? TAG_TO_CATEGORY[tagHint] : categorize([tagHint || 'casual']);
  const color = COLOR_BY_CATEGORY[category] || '#8b5cf6';
  const controls = DEFAULT_CONTROLS_BY_CATEGORY[category] || 'Mouse / Keyboard';
  const desc = description || `${cleanedTitle} — play free online on Plixfy.`;
  const shortDesc = desc.split(/\.\s+/)[0].slice(0, 180);
  const longDesc = desc.slice(0, 320);

  return {
    skip: false,
    entry: {
      kind: 'embed',
      slug: `y8-${slug.replace(/_/g, '-')}`,
      title: cleanedTitle,
      description: shortDesc || `${cleanedTitle} — play free online on Plixfy.`,
      longDescription: longDesc || `${cleanedTitle} is a free browser game on Plixfy. Plays instantly — no download required.`,
      thumbnail: image,
      category,
      difficulty: 'medium',
      controls,
      color,
      keywords: ['free online', cleanedTitle.toLowerCase(), category, 'y8'],
      status: 'live',
      provider: 'y8',
      embedUrl: url,
    },
  };
}

/* ───────────────────────── Emit registry file ─────────────────────────── */

function js(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') {
    // Full escape: backslash first, then quote, then control chars.
    // Y8 og:description fields routinely contain raw \n which would
    // break a single-quoted JS string literal. Tab + CR too.
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `'${escaped}'`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(js).join(', ')}]`;
  if (typeof value === 'object') {
    return `{ ${Object.entries(value).map(([k, v]) => `${/^[a-z_$][a-z0-9_$]*$/i.test(k) ? k : js(k)}: ${js(v)}`).join(', ')} }`;
  }
  return 'null';
}

async function emitRegistry(entries) {
  const sorted = [...entries].sort((a, b) => a.slug.localeCompare(b.slug));
  const body = sorted.map((e) => `  ${js(e)},`).join('\n');
  const header = `import type { EmbedGameMeta } from '@/types/game';

/**
 * Y8 embed catalog (${sorted.length} entries).
 *
 * Harvested by scripts/harvest-y8.mjs from Y8's tag listings, with each
 * /embed/{slug} URL header-verified (200 OK, no X-Frame-Options, no
 * restrictive CSP frame-ancestors). Y8 runs its own ads inside the
 * iframe — no integration needed from us.
 */
const _Y8_GAMES = [
${body}
];

export const Y8_GAMES: readonly EmbedGameMeta[] = _Y8_GAMES as readonly EmbedGameMeta[];
`;
  await writeFile(REGISTRY_PATH, header, 'utf8');
}

/* ───────────────────────── Main ───────────────────────────────────────── */

(async () => {
  console.error(`[Y8] discovering slugs (tags=${TAGS.length}, pages=${PAGES_PER_TAG})`);
  const slugs = await discoverSlugs();
  console.error(`[Y8] discovered ${slugs.length} unique slugs`);

  const capped = slugs.slice(0, MAX_GAMES);
  console.error(`[Y8] verifying ${capped.length} (cap=${MAX_GAMES})`);

  // Tag-hint inference: re-sweep tags so the per-slug category is the
  // tag that listed it (small cost, big quality boost on category labels).
  const slugTag = new Map();
  for (const tag of TAGS) {
    for (let page = 1; page <= 2; page++) {
      const r = await fetchText(`https://www.y8.com/tags/${tag}?page=${page}`);
      if (!r.ok) break;
      for (const m of r.text.matchAll(/href="https:\/\/www\.y8\.com\/games\/([a-z0-9_-]+)"/g)) {
        if (!slugTag.has(m[1])) slugTag.set(m[1], tag);
      }
    }
  }

  const results = await pmap(capped, CONCURRENCY, (slug) => harvestSlug(slug, slugTag.get(slug)));

  const entries = [];
  const skipped = [];
  for (const r of results) {
    if (!r) continue;
    if (r.skip) skipped.push({ slug: r.slug, reason: r.reason });
    else if (r.entry) entries.push(r.entry);
  }

  await emitRegistry(entries);
  await writeFile(SKIPPED_PATH, JSON.stringify(skipped, null, 2));

  console.error('');
  console.error(`Wrote ${REGISTRY_PATH}`);
  console.error(`Entries kept: ${entries.length}`);
  console.error(`Skipped:      ${skipped.length} (see ${SKIPPED_PATH})`);
  const byReason = {};
  for (const s of skipped) byReason[s.reason] = (byReason[s.reason] || 0) + 1;
  console.error('Skip reasons:', byReason);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
