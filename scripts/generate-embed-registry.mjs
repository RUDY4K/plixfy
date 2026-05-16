#!/usr/bin/env node
/**
 * Generate games/registry-embed.ts from:
 *   - The current handcrafted 20 entries (preserved verbatim)
 *   - The bulk harvest manifest (harvest-manifest.json)
 *
 * Each manifest entry is normalized: title cased, description trimmed at a
 * word boundary, controls inferred from category, difficulty defaulted to
 * 'medium', and keywords derived from the title.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MANIFEST_PATH = join(__dirname, 'harvest-manifest.json');
const REGISTRY_PATH = join(ROOT, 'games', 'registry-embed.ts');

const CONTROLS_BY_CATEGORY = {
  racing: 'Arrow keys / Touch',
  sports: 'Mouse / Keyboard',
  shooting: 'Mouse / WASD',
  puzzle: 'Mouse / Touch',
  word: 'Keyboard',
  board: 'Mouse / Touch',
  strategy: 'Mouse / Touch',
  io: 'Mouse / WASD',
  simulation: 'Mouse / Touch',
  clicker: 'Mouse / Touch',
  adventure: 'Arrow keys / WASD',
  girls: 'Mouse / Touch',
  action: 'Arrow keys / WASD',
  skill: 'Mouse / Touch',
  arcade: 'Arrow keys / Touch',
  casual: 'Mouse / Touch',
  stickman: 'Arrow keys / Touch',
  zombie: 'WASD / Mouse',
  cooking: 'Mouse / Touch',
};

function escSingle(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function titleCase(s) {
  return s
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ')
    .trim();
}

function cleanDescription(raw, maxChars = 180) {
  if (!raw) return '';
  let s = raw
    .replace(/\s+/g, ' ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
  if (s.length <= maxChars) return s;
  // Truncate at last sentence ending within maxChars
  const slice = s.slice(0, maxChars);
  const lastPeriod = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
  if (lastPeriod > maxChars * 0.5) {
    return slice.slice(0, lastPeriod + 1).trim();
  }
  // Fall back to word boundary
  const lastSpace = slice.lastIndexOf(' ');
  return slice.slice(0, lastSpace).trim() + '…';
}

function buildLongDescription(short, title, category) {
  // Provide a slightly richer paragraph; SEO benefits from variety.
  const base = short || `${title} is a free online ${category} game.`;
  const tail = ` Play ${title} for free in your browser — no download required.`;
  return (base + (base.endsWith('.') ? '' : '.') + tail).trim();
}

function keywordsFor(title, category) {
  const tokens = title
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['the', 'and', 'for', 'with', 'this', 'that', 'game'].includes(w));
  const set = new Set([title.toLowerCase(), category, ...tokens, 'free online game']);
  return [...set].slice(0, 8);
}

function difficultyFor(category) {
  if (['puzzle', 'strategy', 'word'].includes(category)) return 'medium';
  if (['casual', 'girls', 'clicker', 'simulation', 'cooking'].includes(category)) return 'easy';
  if (['shooting', 'action', 'io', 'adventure', 'zombie'].includes(category)) return 'hard';
  return 'medium';
}

function emitEntry(g) {
  const controls = CONTROLS_BY_CATEGORY[g.category] ?? 'Mouse / Touch';
  const description = cleanDescription(g.description, 140);
  const longDescription = cleanDescription(buildLongDescription(description, g.title, g.category), 320);
  const kws = keywordsFor(g.title, g.category);
  return `  {
    kind: 'embed',
    slug: '${escSingle(g.slug)}',
    title: '${escSingle(g.title)}',
    description: '${escSingle(description || `${g.title} — play free in your browser.`)}',
    longDescription:
      '${escSingle(longDescription)}',
    thumbnail: '/assets/thumbnails/embed-${g.slug}.jpg',
    category: '${g.category}',
    difficulty: '${difficultyFor(g.category)}',
    controls: '${escSingle(controls)}',
    color: '${g.color}',
    keywords: [${kws.map((k) => `'${escSingle(k)}'`).join(', ')}],
    status: 'live',
    provider: 'gamedistribution',
    embedUrl: gd('${g.id}'),
  },`;
}

// The 20 handcrafted entries from the original seed — these have richer
// copy than the auto-generated ones, so preserve them verbatim.
const HANDCRAFTED = [
  ['moto-x3m', 'Moto X3M', 'Race against the clock through wild stunt tracks.', 'A bike racing game with 25 challenging levels. Strap on your helmet, grab some airtime over obstacles, and beat the clock on amazing off-road circuits.', 'racing', 'medium', 'Arrow keys', '#facc15', ['moto x3m','bike racing','stunt game','motorcycle'], '5b0abd4c0faa4f5eb190a9a16d5a1b4c'],
  ['hill-climb-racing-2', 'Hill Climb Racing 2', 'Climb hills, collect coins, upgrade your ride.', 'Control your car or bike to climb hills with realistic physics. Face unique uphill and downhill environments, earn bonuses from tricks, and collect coins to upgrade.', 'racing', 'easy', 'Arrow keys', '#84cc16', ['hill climb','physics racing','driving game'], 'ddcba9beafaf409ab581385023761cde'],
  ['helix-jump', 'Helix Jump', 'Guide a bouncing ball down a twisting tower.', 'Helix Jump has simple, addictive mechanics. Guide a bouncing ball continuously down a series of circular platforms, falling through cracks while avoiding the forbidden zones.', 'arcade', 'easy', 'Mouse / Touch drag', '#f472b6', ['helix jump','ball game','tower descent'], '544cf55c6ad44a3299099e813f7f5a9d'],
  ['stickman-death-run', 'Stickman Death Run', 'Run, jump, and dodge through deadly traps.', "Everyone's favorite stickman is now on a death run in the pixel world. Help him run through obstacles and survive as long as you can.", 'arcade', 'medium', 'Arrow keys / Touch', '#ef4444', ['stickman','runner','platformer'], 'df7da06701574ce9acc39d3355b44522'],
  ['stick-run', 'Stick Run', 'Run through tunnels and outsmart traps.', 'A group of stickmen get lost in tunnels floating around the world. Run through varied environments — cities, deserts, mountains — and avoid every trap.', 'arcade', 'easy', 'Arrow keys / Touch', '#fb923c', ['stick run','runner','stickman'], '8ade51370cd7424ea0a67eb7452abd82'],
  ['stickman-school-run', 'Stickman School Run', 'Skip homework, save your girlfriend.', "Take control of a little wire man who's trying to run away from his homework and save his girlfriend. Dodge teachers and obstacles along the way.", 'arcade', 'easy', 'Arrow keys / Touch', '#f59e0b', ['stickman','school run','runner'], '61f143e520804499919733156c98d169'],
  ['stick-duel-battle', 'Stick Duel Battle', 'Fight with realistic weapons and physics.', 'A funny and crazy stickman battle game. Fight with realistic weapons and physics on many maps. Single player or local versus.', 'arcade', 'medium', 'Keyboard', '#dc2626', ['stick duel','fighting','physics'], '1d7959f081b4453498ee9916b693988c'],
  ['bubble-shooter-original', 'Bubble Shooter', 'Match three bubbles to clear the board.', 'The classic bubble shooter. Aim and shoot bubbles, match three of the same color to pop them. Clear the board to advance.', 'puzzle', 'easy', 'Mouse / Touch', '#38bdf8', ['bubble shooter','match three','puzzle'], 'd07a3f925bf345bcbddf18abad7d9f19'],
  ['bubble-shooter-hd', 'Bubble Shooter HD', 'High-def take on the classic bubble shooter.', 'Remove all bubbles from the board, scoring as many points as possible. Match two or more bubbles of the same color to pop them.', 'puzzle', 'easy', 'Mouse / Touch', '#0ea5e9', ['bubble shooter','hd','puzzle'], '79a7db22af5f420eb9d56e28fffca87b'],
  ['bubble-shooter-extreme', 'Bubble Shooter Extreme', 'Faster, harder bubble action.', 'An HTML5 version of the popular Bubble Shooter game with awesome HD graphics and faster pace.', 'puzzle', 'medium', 'Mouse / Touch', '#6366f1', ['bubble shooter','extreme','puzzle'], 'c3f0f0c6731a4d908d978fb7906a0b17'],
  ['jewel-pets-match', 'Jewel Pets Match', 'Match-3 with adorable pets.', 'A classic turn-based match-3 arcade game. Match happy pets in greater numbers to clear bigger portions of the board.', 'puzzle', 'easy', 'Mouse / Touch', '#a855f7', ['match 3','jewel','pets'], 'e8cd110d09fe4654821162dcd100b75d'],
  ['jewel-solitaire-tripeaks', 'Jewel Solitaire TriPeaks', 'TriPeaks solitaire with a fantasy twist.', 'A magical solitaire adventure. Rebuild castles, conquer 200 levels, and master 12 variants from Klondike to Spider.', 'puzzle', 'medium', 'Mouse / Touch', '#c084fc', ['solitaire','tripeaks','cards'], '89ab5569df404db3bb93f31a890c24e8'],
  ['microsoft-solitaire-collection', 'Microsoft Solitaire Collection', 'Klondike, Spider, Freecell, Pyramid, TriPeaks.', 'The classic Microsoft Solitaire Collection. Five solitaire variants in one: Klondike, Spider, Freecell, Pyramid, and TriPeaks.', 'puzzle', 'easy', 'Mouse / Touch', '#10b981', ['solitaire','microsoft','cards','klondike'], '6c5fd1a4f3544538a6bbdfdc1c7bd507'],
  ['basketball-stars', 'Basketball Stars', 'Two-player basketball — dunks and 3-pointers.', 'A cool 2-player basketball game by MadPuffers. Choose your team and enter a challenging tournament. Perform awesome dunks and three pointers to win.', 'sports', 'medium', 'Keyboard (WASD + Arrow keys)', '#f97316', ['basketball','sports','two player'], '69d78d071f704fa183d75b4114ae40ec'],
  ['basketball-legend', 'Basketball Legend', 'Master your shooting in solo or versus.', 'Become the basketball legend! Single player career mode or local multiplayer. Master dribbles, dunks, and clutch threes.', 'sports', 'medium', 'Keyboard', '#ea580c', ['basketball','legend','sports'], '0d06f5faf6174728bb1cd2d8150daba4'],
  ['super-soccer-stars', 'Super Soccer Stars', 'Score, defend, and beat the keeper.', 'A fast-paced arcade soccer game. Aim past the keeper, defend your goal, and rack up wins across tournaments.', 'sports', 'easy', 'Mouse / Touch', '#16a34a', ['soccer','football','sports'], 'f366faf74abd4d01a93fef0f2092f3cb'],
  ['soccer-skills-runner', 'Soccer Skills Runner', 'Dribble past opponents in an endless run.', 'Run as far as you can without being tackled — swerve, jump, and duck past opponents. Collect power-ups and upgrade your player.', 'sports', 'medium', 'Arrow keys / Touch', '#22c55e', ['soccer','runner','sports'], '54df6d78ccde4de1b41acadb002f1722'],
  ['8-ball-pro', '8 Ball Pro', 'Pocket the 8 ball to win — pool perfected.', 'Test your 8 Ball Pool skills. Aim carefully, control your power, and pocket the 8 ball last to win each frame.', 'sports', 'medium', 'Mouse / Touch', '#1e40af', ['pool','8 ball','billiards'], '20fa5406b00643128250478502fa5453'],
  ['pool-8-ball', 'Pool 8 Ball', 'Classic pool — solo timer or shared device.', 'A modern pool game. Play alone on a timer or together on one device. Sink the colored balls before the 8.', 'sports', 'easy', 'Mouse / Touch', '#0c4a6e', ['pool','billiards','8 ball'], '587cc8f8b84b484f9267a7ec1caa5328'],
  ['highway-traffic', 'Highway Traffic', 'Speed through traffic with multiple cars and modes.', 'A traffic game with diverse modes and car models — from classic sedans to modern sports cars. Four single-player modes, three weather options, smooth controls.', 'racing', 'medium', 'Arrow keys / Touch', '#0891b2', ['highway','traffic','racing','cars'], '7c151f5e29eb40a591edfe1823e1d0ea'],
];

function emitHandcrafted([slug, title, description, longDescription, category, difficulty, controls, color, keywords, id]) {
  return `  {
    kind: 'embed',
    slug: '${escSingle(slug)}',
    title: '${escSingle(title)}',
    description: '${escSingle(description)}',
    longDescription:
      '${escSingle(longDescription)}',
    thumbnail: '/assets/thumbnails/embed-${slug}.jpg',
    category: '${category}',
    difficulty: '${difficulty}',
    controls: '${escSingle(controls)}',
    color: '${color}',
    keywords: [${keywords.map((k) => `'${escSingle(k)}'`).join(', ')}],
    status: 'live',
    provider: 'gamedistribution',
    embedUrl: gd('${id}'),
  },`;
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));

  // Group harvested games by category for nicer readability in the file.
  const grouped = new Map();
  for (const g of manifest.games) {
    if (!grouped.has(g.category)) grouped.set(g.category, []);
    grouped.get(g.category).push(g);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  const categoryOrder = [
    'arcade', 'action', 'stickman', 'zombie', 'racing', 'shooting', 'sports',
    'puzzle', 'strategy', 'board', 'word', 'io',
    'adventure', 'simulation', 'clicker', 'cooking', 'skill', 'girls', 'casual',
  ];

  let body = '';
  body += '  // ── Handcrafted seed (20 verified GameDistribution titles) ──────────\n';
  body += HANDCRAFTED.map(emitHandcrafted).join('\n') + '\n\n';

  for (const cat of categoryOrder) {
    const list = grouped.get(cat);
    if (!list || list.length === 0) continue;
    body += `  // ── ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${list.length}) ──────────\n`;
    body += list.map(emitEntry).join('\n') + '\n\n';
  }

  const total = HANDCRAFTED.length + manifest.games.length;
  const header = `import type { EmbedGameMeta } from '@/types/game';

/**
 * Third-party embed catalog (${total} entries).
 *
 * - First 20 entries are handcrafted: descriptions hand-written, embed URLs
 *   verified on 2026-05-15.
 * - Remaining ${manifest.games.length} entries are bulk-harvested from the
 *   GameDistribution public sitemap (${manifest.games.length} games). Metadata
 *   (title, description, og:image) is scraped from each game's iframe page;
 *   thumbnails are stored locally at public/assets/thumbnails/.
 *
 * Generated by scripts/generate-embed-registry.mjs from scripts/harvest-manifest.json.
 * Re-run that script (with --resume) to top up the catalog.
 */
const gd = (id: string) => \`https://html5.gamedistribution.com/\${id}/\`;

export const EMBED_GAMES: readonly EmbedGameMeta[] = [
`;

  const out = header + body + '];\n';
  await writeFile(REGISTRY_PATH, out);
  console.log(`Wrote ${REGISTRY_PATH} — ${total} entries (${HANDCRAFTED.length} handcrafted + ${manifest.games.length} harvested).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
