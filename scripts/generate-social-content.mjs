// scripts/generate-social-content.mjs
//
// LOCAL social-content generator. Picks 7 random live games (one per day),
// generates platform-ready post text + 1080x1080 Instagram images, and
// writes everything into scripts/output/weekly/ as ready-to-copy-paste
// assets.
//
//   node scripts/generate-social-content.mjs
//
// Optional flags:
//   --seed=<number>    deterministic game selection (default: today's date)
//   --count=<n>        number of days to generate (default: 7)
//   --no-ai            skip Anthropic API even if ANTHROPIC_API_KEY is set
//
// If ANTHROPIC_API_KEY is set in the env, post text is generated through
// the Anthropic API (claude-haiku-4-5 by default). Without a key we fall
// back to category-aware templates — still ship-quality, just less varied.

import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const outDir = join(repoRoot, 'scripts', 'output', 'weekly');

// ── Args ────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);
const COUNT = Number(args.count) || 7;
const USE_AI = !args['no-ai'] && !!process.env.ANTHROPIC_API_KEY;

// Default seed = YYYYMMDD so reruns on the same day pick the same games.
const today = new Date();
const defaultSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
const SEED = Number(args.seed) || defaultSeed;

// ── Brand ──────────────────────────────────────────────────────────────
const BRAND = {
  bg: '#0B0F1A',
  cyan: '#00C8FF',
  pink: '#FF3366',
  ink: '#E6F3FF',
  muted: '#7A8AA0',
  domain: 'plixfy.com',
  name: 'Plixfy',
};

// ── Registry loader ────────────────────────────────────────────────────
// The .ts registry files are JS object literals one-per-line — we parse
// them by reading as text and evaluating each `{ ... }` block in a
// fresh Function scope. Avoids needing tsx/esbuild as a script dep.

function loadGamesFromRegistry(path) {
  const text = readFileSync(path, 'utf8');
  const games = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{ kind:')) continue;
    const literal = trimmed.replace(/,\s*$/, '');
    try {
      const obj = new Function(`return ${literal};`)();
      games.push(obj);
    } catch {
      // skip malformed line
    }
  }
  return games;
}

function loadAllGames() {
  const sources = [
    'games/registry-custom.ts',
    'games/registry-embed.ts',
    'games/registry-extra.ts',
    'games/registry-y8.ts',
  ];
  const all = [];
  for (const rel of sources) {
    const full = join(repoRoot, rel);
    if (!existsSync(full)) continue;
    try {
      const games = loadGamesFromRegistry(full);
      all.push(...games);
    } catch (err) {
      console.warn(`  warn: failed to load ${rel}: ${err.message}`);
    }
  }
  return all;
}

// ── Selection ──────────────────────────────────────────────────────────
// Mulberry32 PRNG: deterministic for a given seed so reruns are stable.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickGames(allGames, n, seed) {
  // Filter: live, mobile-friendly enough, has an HTTPS thumbnail, real title.
  const eligible = allGames.filter((g) => {
    if (g.status !== 'live') return false;
    if (!g.thumbnail || typeof g.thumbnail !== 'string') return false;
    if (!g.thumbnail.startsWith('http')) return false;
    if (!g.title || g.title.length < 3) return false;
    // Avoid weird placeholder titles
    if (/^test/i.test(g.title)) return false;
    return true;
  });
  if (eligible.length < n) {
    throw new Error(`Not enough eligible games (${eligible.length}) for ${n} picks.`);
  }
  // Fisher-Yates shuffle seeded
  const rand = mulberry32(seed);
  const arr = eligible.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Distinct categories first when possible — more variety in the feed.
  const seenCategory = new Set();
  const picked = [];
  for (const g of arr) {
    if (picked.length >= n) break;
    if (seenCategory.has(g.category)) continue;
    picked.push(g);
    seenCategory.add(g.category);
  }
  // Fill the rest if not enough distinct categories.
  for (const g of arr) {
    if (picked.length >= n) break;
    if (picked.includes(g)) continue;
    picked.push(g);
  }
  return picked.slice(0, n);
}

// ── Text content generators ────────────────────────────────────────────

const CATEGORY_HOOKS = {
  arcade: ['Pure arcade joy 🕹️', 'Retro vibes, modern controls', 'One more try, every time'],
  puzzle: ['Big-brain energy 🧠', 'Wait — that actually works?', 'Galaxy-brain moves only'],
  racing: ['Floor it 🏎️💨', 'Hold my coffee', 'Drift, jump, win'],
  shooting: ['Lock in 🎯', "Don't blink", 'Precision unlocked'],
  action: ['Adrenaline incoming ⚡', 'Reflexes required', 'Go fast or go home'],
  io: ['Server-vs-server chaos', 'Climb the leaderboard 📈', 'Eat. Grow. Survive.'],
  multiplayer: ['Bring a friend 🤝', 'Lobby is open', '1v1 me'],
  sports: ['Game on ⚽️', 'Fan favorite', "Don't choke at the line"],
  strategy: ['Outthink everyone ♟️', 'Plot twist incoming', 'Move smart, win big'],
  casual: ['10-min chill session 🌊', 'Coffee break game ☕', 'No download, just play'],
  word: ['Spelling sweat 📝', 'Vocab flex', 'Eyes on the prize'],
  adventure: ['Pack your bags 🗺️', 'Adventure unlocked', "Don't look down"],
  simulation: ['Live a different life 🌱', 'Build it your way', "Boss mode: you're it"],
  clicker: ['Number go up 📈', 'Idle gains', 'The dopamine loop'],
  board: ['Classic, reborn', 'Old game, new vibes', 'Strategy on a grid'],
  girls: ['Style points 💅', 'Mix, match, slay', 'Outfit goals'],
  skill: ['Pure skill ⚙️', 'No luck, just hands', 'Reflexes + timing'],
  stickman: ['Stickman chaos 🥷', 'Tiny man, huge problems', 'Run, jump, survive'],
  zombie: ['Brains needed 🧟', 'Last one standing', 'Survive the wave'],
  cooking: ["Chef's mode 👩‍🍳", 'Plate it perfect', 'Order up!'],
};

const GENERIC_HOOKS = [
  'Free browser game 🎮',
  'Plays straight from your browser ✨',
  'No download. No login. Just play.',
  'Built for boredom 💯',
  'Try this — you might lose an hour',
];

const HASHTAG_POOL = {
  global: ['gaming', 'browsergames', 'freegames', 'play', 'webgames', 'indiegames', 'plixfy'],
  byCategory: {
    arcade: ['arcadegame', 'retro', 'pixelart'],
    puzzle: ['puzzlegame', 'brainteaser', 'logicgame', 'puzzles'],
    racing: ['racinggame', 'cargames', 'speed', 'motox3m'],
    shooting: ['shooter', 'fpsgame', 'aim'],
    action: ['actiongame', 'reflexes', 'fastpaced'],
    io: ['iogame', 'multiplayer', 'leaderboard'],
    multiplayer: ['multiplayer', 'pvp', 'onlinegame'],
    sports: ['sportsgame', 'football', 'basketball'],
    strategy: ['strategygame', 'tactics', 'turnbased'],
    casual: ['casualgame', 'mobilegame', 'chillgame'],
    word: ['wordgame', 'vocab', 'spelling'],
    adventure: ['adventuregame', 'explore', 'quest'],
    simulation: ['simgame', 'lifesim', 'tycoon'],
    clicker: ['idlegame', 'clicker', 'incremental'],
    board: ['boardgame', 'classic', 'strategy'],
    girls: ['dressup', 'makeover', 'fashion'],
    skill: ['skillgame', 'timing', 'precision'],
    stickman: ['stickman', 'stickfigure', 'parkour'],
    zombie: ['zombiegame', 'survival', 'horror'],
    cooking: ['cookinggame', 'chef', 'restaurant'],
  },
};

function unique(arr) {
  return Array.from(new Set(arr));
}

function slugHashtag(slug) {
  // Convert "y8-1-suit-spider-solitaire" → "spidersolitaire"
  // Drop provider prefix, then strip non-alnum.
  return slug.replace(/^y8-+/, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function buildHashtags(game, count) {
  const pool = unique([
    ...HASHTAG_POOL.global,
    ...(HASHTAG_POOL.byCategory[game.category] ?? []),
    slugHashtag(game.slug),
  ]).filter(Boolean);
  return pool.slice(0, count).map((h) => `#${h}`);
}

function pickHook(game, rand) {
  const list = CATEGORY_HOOKS[game.category] ?? GENERIC_HOOKS;
  return list[Math.floor(rand() * list.length)];
}

function gameUrl(slug) {
  return `https://${BRAND.domain}/games/${slug}`;
}

function templateTwitter(game, rand) {
  const hook = pickHook(game, rand);
  const tags = buildHashtags(game, 3).join(' ');
  const url = gameUrl(game.slug);
  // Compact format. Tweet must stay ≤280.
  const body = `${hook}\n\n${game.title} — free, no download.\n${url}\n${tags}`;
  if (body.length <= 280) return body;
  // Trim hook if too long
  const fallback = `${game.title} — ${hook}\n${url}\n${tags}`;
  return fallback.length <= 280 ? fallback : `${game.title}\n${url}\n${tags}`.slice(0, 280);
}

function templateInstagram(game, rand) {
  const hook = pickHook(game, rand);
  const tags = buildHashtags(game, 20).join(' ');
  const desc = (game.description || '').trim().replace(/\s+/g, ' ');
  const url = gameUrl(game.slug);
  return [
    `${hook}`,
    '',
    `${game.title} — ${desc}`,
    '',
    `🎮 Free to play on ${BRAND.domain}`,
    `🔗 Link: ${url}`,
    '👇 Tag a friend who needs this in their lunch break',
    '',
    tags,
  ].join('\n');
}

function templateReddit(game) {
  // r/WebGames format: descriptive, no clickbait.
  return `${game.title} — free browser game (no download)`;
}

// ── Anthropic API integration (optional) ───────────────────────────────

async function generateWithClaude(game) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const url = gameUrl(game.slug);
  const prompt = `You are a social-media copywriter for Plixfy, a free browser-games portal.
Generate three pieces of post copy for the game below. Return STRICT JSON only,
no preamble, no markdown fences, exactly this shape:

{"twitter":"...","instagram":"...","reddit":"..."}

Game:
- Title: ${game.title}
- Category: ${game.category}
- Description: ${(game.description || '').slice(0, 240)}
- Play URL: ${url}

Rules:
- twitter: <=270 chars, energetic, 2-3 emojis, end with URL on its own line, then 3 hashtags including #plixfy.
- instagram: 80-150 words, friendly + punchy, include the URL once, end with 18-22 hashtags on a single line (include #plixfy, #freegames, #browsergames, plus category- and game-specific tags).
- reddit: a clean, non-clickbait title suitable for r/WebGames or r/incremental_games (no emojis, no hashtags, no URL).`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`  warn: Claude API ${res.status}: ${text.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const raw = data?.content?.[0]?.text?.trim() ?? '';
    // Strip code fences just in case.
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(stripped);
    if (!parsed.twitter || !parsed.instagram || !parsed.reddit) return null;
    return parsed;
  } catch (err) {
    console.warn(`  warn: Claude API call failed: ${err.message}`);
    return null;
  }
}

// ── Image generation ───────────────────────────────────────────────────

async function fetchThumbnail(url, timeoutMs = 10_000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return buf;
  } finally {
    clearTimeout(t);
  }
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }[c]));
}

function titleSizeFor(title) {
  const len = title.length;
  if (len <= 10) return 152;
  if (len <= 16) return 124;
  if (len <= 22) return 100;
  if (len <= 30) return 82;
  if (len <= 42) return 64;
  return 52;
}

function wrapTitle(title, maxLineChars) {
  const words = title.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxLineChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  // Cap at 3 lines, truncate with ellipsis
  if (lines.length > 3) {
    lines.length = 3;
    const last = lines[2];
    lines[2] = (last.length > maxLineChars - 1 ? last.slice(0, maxLineChars - 1) : last) + '…';
  }
  return lines;
}

function buildOverlaySvg(game) {
  const fontSize = titleSizeFor(game.title);
  // Loose char-width estimate: usable width ≈ 960px, char ≈ fontSize*0.55
  const maxLineChars = Math.max(8, Math.floor(960 / (fontSize * 0.55)));
  const titleLines = wrapTitle(game.title, maxLineChars);
  const lineHeight = fontSize * 1.05;
  const blockHeight = titleLines.length * lineHeight;
  // Vertical center the title block in y range [420, 760]
  const yStart = 420 + (340 - blockHeight) / 2 + fontSize * 0.85;

  const titleTspans = titleLines
    .map((line, i) => {
      const y = yStart + i * lineHeight;
      return `<text x="540" y="${y}" text-anchor="middle" filter="url(#textGlow)"
            font-family="'Segoe UI', system-ui, -apple-system, Roboto, sans-serif"
            font-weight="900" font-size="${fontSize}" fill="${BRAND.ink}" letter-spacing="-2">${escapeXml(line)}</text>`;
    })
    .join('\n');

  const category = (game.category || '').toUpperCase();
  const ctaText = `Play free → ${BRAND.domain}/games/${game.slug}`;
  // CTA may be long — squeeze the font down if so.
  const ctaSize = ctaText.length > 48 ? 26 : ctaText.length > 38 ? 30 : 34;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BRAND.bg}" stop-opacity="0.85"/>
      <stop offset="30%" stop-color="${BRAND.bg}" stop-opacity="0.55"/>
      <stop offset="60%" stop-color="${BRAND.bg}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${BRAND.bg}" stop-opacity="0.96"/>
    </linearGradient>
    <radialGradient id="centerGlow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="${BRAND.cyan}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${BRAND.bg}" stop-opacity="0"/>
    </radialGradient>
    <filter id="textGlow" x="-10%" y="-30%" width="120%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="iconGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Tint over thumbnail -->
  <rect width="1080" height="1080" fill="url(#topShade)"/>
  <rect width="1080" height="1080" fill="url(#centerGlow)"/>

  <!-- Top-left: logo + wordmark -->
  <g transform="translate(60 60)">
    <g filter="url(#iconGlow)">
      <rect width="72" height="72" rx="16" fill="${BRAND.bg}"/>
      <g transform="scale(1.125)">
        <path d="M18 12h18a12 12 0 0 1 0 24H26v16h-8V12z" fill="${BRAND.cyan}"/>
        <path d="M26 20h10a4 4 0 0 1 0 8H26z" fill="${BRAND.bg}"/>
        <path d="M28 21.5 L34 24 L28 26.5 Z" fill="${BRAND.pink}"/>
      </g>
    </g>
    <text x="90" y="48" font-family="'Segoe UI', system-ui, sans-serif"
          font-weight="900" font-size="36" fill="${BRAND.ink}" letter-spacing="1">${BRAND.name}</text>
  </g>

  <!-- Top-right: category badge -->
  <g transform="translate(1020 96)" text-anchor="end">
    <rect x="${-Math.max(120, category.length * 14 + 36)}" y="-30" width="${Math.max(120, category.length * 14 + 36)}" height="44" rx="22" fill="${BRAND.cyan}" opacity="0.92"/>
    <text x="-18" y="0" font-family="'Segoe UI', system-ui, sans-serif"
          font-weight="800" font-size="20" fill="${BRAND.bg}" letter-spacing="3">${escapeXml(category)}</text>
  </g>

  <!-- LIVE badge under logo -->
  <g transform="translate(60 156)">
    <rect width="148" height="36" rx="18" fill="${BRAND.pink}"/>
    <circle cx="22" cy="18" r="6" fill="${BRAND.ink}"/>
    <text x="38" y="25" font-family="'Segoe UI', system-ui, sans-serif"
          font-weight="900" font-size="17" fill="${BRAND.ink}" letter-spacing="3">PLAY FREE</text>
  </g>

  <!-- Title block (centered) -->
  ${titleTspans}

  <!-- Accent line -->
  <rect x="440" y="${Math.min(820, yStart + blockHeight + 24)}" width="200" height="3" fill="${BRAND.cyan}"/>

  <!-- Bottom CTA strip -->
  <rect x="0" y="930" width="1080" height="150" fill="${BRAND.bg}" opacity="0.92"/>
  <rect x="0" y="930" width="1080" height="3" fill="${BRAND.cyan}" opacity="0.35"/>
  <text x="540" y="1000" text-anchor="middle" filter="url(#textGlow)"
        font-family="'Segoe UI', system-ui, sans-serif"
        font-weight="800" font-size="${ctaSize}" fill="${BRAND.ink}" letter-spacing="1">${escapeXml(ctaText)}</text>
  <text x="540" y="1048" text-anchor="middle"
        font-family="'Segoe UI', system-ui, sans-serif"
        font-weight="500" font-size="20" fill="${BRAND.muted}" letter-spacing="6">FREE BROWSER GAMES</text>
</svg>`;
}

function placeholderBackground(game) {
  const color = (game.color || BRAND.cyan).replace('#', '');
  // 1080x1080 gradient background derived from game.color
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
    <defs>
      <radialGradient id="bg" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#${color}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="${BRAND.bg}" stop-opacity="1"/>
      </radialGradient>
    </defs>
    <rect width="1080" height="1080" fill="${BRAND.bg}"/>
    <rect width="1080" height="1080" fill="url(#bg)"/>
  </svg>`;
  return sharp(Buffer.from(svg), { density: 144 }).png().toBuffer();
}

async function buildInstagramImage(game, outPath) {
  // 1. Background: thumbnail covered to 1080×1080, blurred + dimmed.
  let bg;
  try {
    const raw = await fetchThumbnail(game.thumbnail);
    bg = await sharp(raw)
      .resize(1080, 1080, { fit: 'cover', position: 'centre' })
      .blur(14)
      .modulate({ brightness: 0.6, saturation: 1.1 })
      .png()
      .toBuffer();
  } catch (err) {
    console.warn(`  warn: thumbnail fetch failed for ${game.slug} (${err.message}); using gradient`);
    bg = await placeholderBackground(game);
  }

  // 2. SVG overlay.
  const overlaySvg = buildOverlaySvg(game);
  const overlay = await sharp(Buffer.from(overlaySvg), { density: 144 })
    .resize(1080, 1080)
    .png()
    .toBuffer();

  // 3. Composite + write.
  await sharp(bg)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(outPath);
}

// ── README rendering ───────────────────────────────────────────────────

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dayLabel(i, startDate) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + i);
  const weekday = WEEKDAYS[d.getDay()];
  const iso = d.toISOString().slice(0, 10);
  return { weekday, iso };
}

function renderReadme(entries, startDate) {
  const header = `# Plixfy weekly social pack

Generated: ${new Date().toISOString()}
Source: 7 random live games from the Plixfy registry
AI text generation: ${USE_AI ? 'Anthropic API (claude-haiku-4-5)' : 'local templates'}

## How to use

For each day, copy the text into the matching platform and upload \`day-N.png\`
as the image. The images are 1080×1080, ready for Instagram feed posts (also
works as X media attachments and Reddit image posts).

---
`;

  const dayBlocks = entries
    .map((e, i) => {
      const { weekday, iso } = dayLabel(i, startDate);
      const dayNum = i + 1;
      return `## Day ${dayNum} — ${weekday} (${iso}) — ${e.game.title}

**Game:** \`${e.game.slug}\` · category: \`${e.game.category}\` · difficulty: \`${e.game.difficulty}\`
**Play URL:** ${gameUrl(e.game.slug)}
**Image:** \`day-${dayNum}.png\`

### Twitter / X (copy this)

\`\`\`
${e.twitter}
\`\`\`

### Instagram (copy this)

\`\`\`
${e.instagram}
\`\`\`

### Reddit title (r/WebGames, r/IncrementalGames, r/playmygame)

\`\`\`
${e.reddit}
\`\`\`

---
`;
    })
    .join('\n');

  return header + '\n' + dayBlocks;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log(`Plixfy weekly social-content generator`);
  console.log(`  seed: ${SEED}    count: ${COUNT}    ai: ${USE_AI ? 'on' : 'off'}`);

  // Reset output dir
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  // Load + pick games
  console.log(`Loading registry…`);
  const all = loadAllGames();
  console.log(`  loaded ${all.length} games`);
  const games = pickGames(all, COUNT, SEED);
  console.log(`  picked ${games.length}: ${games.map((g) => g.title).join(', ')}`);

  // Generate text + image per day
  const entries = [];
  const rand = mulberry32(SEED ^ 0xa1b2c3);
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const dayNum = i + 1;
    console.log(`Day ${dayNum}/${games.length}: ${game.title}`);

    let copy;
    if (USE_AI) {
      console.log(`  → asking Claude…`);
      copy = await generateWithClaude(game);
      if (!copy) console.log(`  → falling back to templates`);
    }
    if (!copy) {
      copy = {
        twitter: templateTwitter(game, rand),
        instagram: templateInstagram(game, rand),
        reddit: templateReddit(game),
      };
    }

    const imgPath = join(outDir, `day-${dayNum}.png`);
    await buildInstagramImage(game, imgPath);
    console.log(`  → wrote ${imgPath}`);

    entries.push({
      day: dayNum,
      game: {
        slug: game.slug,
        title: game.title,
        category: game.category,
        difficulty: game.difficulty,
        thumbnail: game.thumbnail,
        url: gameUrl(game.slug),
      },
      twitter: copy.twitter,
      instagram: copy.instagram,
      reddit: copy.reddit,
      image: `day-${dayNum}.png`,
    });
  }

  // Write posts.json + README
  writeFileSync(join(outDir, 'posts.json'), JSON.stringify({ generatedAt: new Date().toISOString(), seed: SEED, useAi: USE_AI, entries }, null, 2));
  writeFileSync(join(outDir, 'README.md'), renderReadme(entries, today));

  console.log(`\nDone. Output:`);
  console.log(`  ${outDir}/posts.json`);
  console.log(`  ${outDir}/README.md`);
  for (let i = 1; i <= entries.length; i++) console.log(`  ${outDir}/day-${i}.png`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
