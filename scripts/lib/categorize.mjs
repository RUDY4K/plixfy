/**
 * Categorize a harvested game.
 *
 * Rules (in priority order — first match wins):
 *   1. SPECIFIC categories (stickman, zombie, cooking, io) — a single
 *      title-token match is enough. These are visual/setting buckets the
 *      audience cares about; we don't want them swallowed by broader genres.
 *   2. GENRE categories require a minimum SCORE: number of distinct keywords
 *      that hit, summed across title (weight 2) and body (weight 1). This
 *      avoids "Paw Care" landing in racing because the substring "car"
 *      appears once in keywords meta.
 *
 * All matching is on word boundaries, never substrings — eliminates the
 * "coronation contains car" class of bugs that broke the first pass.
 */

function tokenize(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function hasPhrase(tokens, phrase) {
  const parts = phrase.toLowerCase().split(/\s+/);
  if (parts.length === 1) return tokens.includes(parts[0]);
  // Multi-token phrase: look for consecutive tokens.
  for (let i = 0; i <= tokens.length - parts.length; i++) {
    let ok = true;
    for (let j = 0; j < parts.length; j++) {
      if (tokens[i + j] !== parts[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

function countMatches(tokens, keywords) {
  let n = 0;
  for (const kw of keywords) {
    if (hasPhrase(tokens, kw)) n++;
  }
  return n;
}

// SPECIFIC categories — winning these means we skip the rest.
// Single match in TITLE is enough; in body needs 2.
const SPECIFIC = [
  {
    cat: 'stickman',
    keywords: ['stickman', 'stick man', 'stick figure', 'stick warrior', 'stick fight', 'stick hero'],
  },
  {
    cat: 'zombie',
    keywords: ['zombie', 'zombies', 'undead', 'horror', 'creepy', 'haunted', 'demon', 'nightmare', 'scary'],
  },
  {
    cat: 'cooking',
    keywords: [
      'cook', 'cooking', 'chef', 'kitchen', 'restaurant', 'cake', 'cupcake', 'pizza',
      'burger', 'bakery', 'baking', 'sushi', 'noodle', 'dessert', 'pancake', 'donut',
      'taco', 'ice cream', 'sandwich', 'salad', 'recipe', 'bbq', 'grill', 'cafe',
      'diner', 'foodie', 'soup', 'pasta',
    ],
  },
  {
    cat: 'io',
    keywords: ['.io', 'io online', 'iogame', 'multiplayer io', 'agar', 'slither.io', 'paper.io', 'mope.io', 'krunker.io'],
  },
];

// GENRE categories. Score-based. Use distinct strong keywords so a
// single weak match (e.g. "car" anywhere) can't sweep a game into the wrong bucket.
const GENRES = [
  {
    cat: 'racing',
    minScore: 2,
    keywords: [
      'race', 'racing', 'racer', 'drift', 'drifting', 'driving', 'driver', 'drive',
      'car', 'cars', 'truck', 'trucks', 'bike', 'bikes', 'motorcycle', 'motorbike',
      'highway', 'traffic', 'parking', 'park', 'formula', 'rally', 'speedway',
      'speed', 'turbo', 'nitro', 'circuit', 'grand prix', 'f1', 'autobahn',
      'taxi', 'bus', 'lorry',
    ],
  },
  {
    cat: 'shooting',
    minScore: 2,
    keywords: [
      'shoot', 'shooter', 'shooting', 'gun', 'guns', 'sniper', 'fps', 'pistol',
      'rifle', 'weapon', 'army', 'military', 'soldier', 'tank', 'tanks', 'war',
      'warfare', 'combat', 'battlefield', 'marine', 'commando', 'arsenal', 'crosshair',
    ],
  },
  {
    cat: 'sports',
    minScore: 1,
    keywords: [
      'soccer', 'football', 'basketball', 'baseball', 'tennis', 'golf', 'pool',
      'billiard', 'billiards', 'snooker', 'volleyball', 'cricket', 'bowling',
      'boxing', 'mma', 'wrestling', 'hockey', 'rugby', 'skate', 'skateboard',
      'surf', 'ski', 'archery', 'darts', 'dart', 'pong', 'ping pong',
    ],
  },
  {
    cat: 'puzzle',
    minScore: 1,
    keywords: [
      'puzzle', 'match 3', 'match three', 'jewel', 'jewels', 'gem', 'gems',
      'solitaire', 'mahjong', 'sudoku', 'crossword', 'jigsaw', 'block', 'blocks',
      'tetris', 'tetriz', 'connect', 'merge', 'tile', 'tiles', '2048', 'memory',
      'hidden object', 'sliding', 'sokoban', 'tangram',
    ],
  },
  {
    cat: 'word',
    minScore: 1,
    keywords: ['word', 'words', 'spelling', 'typing', 'wpm', 'crossword', 'vocabulary', 'anagram', 'scrabble'],
  },
  {
    cat: 'board',
    minScore: 1,
    keywords: ['chess', 'checkers', 'backgammon', 'domino', 'card', 'cards', 'poker', 'blackjack', 'uno', 'rummy'],
  },
  {
    cat: 'strategy',
    minScore: 1,
    keywords: ['tower defense', 'tower defence', 'td game', 'defend the tower', 'rts', 'kingdom', 'empire', 'civilization', 'tactic', 'tactical', 'strategy', 'defend'],
  },
  {
    cat: 'simulation',
    minScore: 1,
    keywords: ['simulator', 'simulation', 'tycoon', 'farm', 'farming', 'business', 'manager', 'doctor', 'surgery', 'hospital'],
  },
  {
    cat: 'clicker',
    minScore: 1,
    keywords: ['clicker', 'idle', 'incremental', 'tap to'],
  },
  {
    cat: 'girls',
    minScore: 1,
    keywords: [
      'dress up', 'dress-up', 'dressup', 'makeup', 'make-up', 'makeover', 'fashion',
      'princess', 'wedding', 'salon', 'beauty', 'barbie', 'bride', 'diva', 'glam',
      'manicure', 'pedicure', 'spa', 'shopping', 'mall',
    ],
  },
  {
    cat: 'adventure',
    minScore: 1,
    keywords: ['adventure', 'quest', 'rpg', 'mystery', 'escape', 'explore', 'dungeon', 'pirate', 'pirates', 'treasure'],
  },
  {
    cat: 'action',
    minScore: 1,
    keywords: ['fight', 'fighting', 'fighter', 'ninja', 'samurai', 'monster', 'monsters', 'beat em up', 'brawler', 'parkour', 'ragdoll'],
  },
  {
    cat: 'skill',
    minScore: 1,
    keywords: ['aim', 'precision', 'reaction', 'balance', 'knife', 'throw'],
  },
  {
    cat: 'arcade',
    minScore: 1,
    keywords: ['arcade', 'runner', 'endless', 'jump', 'jumping', 'platformer', 'platform', 'flap', 'snake', 'classic', 'retro', 'pacman', 'breakout', 'ball', 'flappy', 'bounce', 'helix', 'stack'],
  },
  {
    cat: 'casual',
    minScore: 1,
    keywords: ['casual', 'cute', 'kids', 'baby', 'family', 'children', 'coloring', 'colouring', 'pop it', 'fidget'],
  },
];

const DEFAULT_CATEGORY = 'casual';

/**
 * @returns {{ category: string, scores: Record<string, number>, reason: string }}
 */
export function categorize({ title = '', description = '', keywords = '' }) {
  const titleTokens = tokenize(title);
  const bodyTokens = tokenize(description + ' ' + keywords);

  // 1. SPECIFIC categories — single title match wins, body needs 2.
  for (const r of SPECIFIC) {
    const titleHits = countMatches(titleTokens, r.keywords);
    if (titleHits >= 1) {
      return { category: r.cat, scores: { [r.cat]: titleHits * 2 }, reason: `specific:title:${r.cat}` };
    }
    const bodyHits = countMatches(bodyTokens, r.keywords);
    if (bodyHits >= 2) {
      return { category: r.cat, scores: { [r.cat]: bodyHits }, reason: `specific:body:${r.cat}` };
    }
  }

  // 2. GENRE categories — score, take best meeting minScore.
  const scores = {};
  let best = null;
  for (const r of GENRES) {
    const t = countMatches(titleTokens, r.keywords);
    const b = countMatches(bodyTokens, r.keywords);
    const score = t * 2 + b;
    scores[r.cat] = score;
    if (score >= r.minScore && (!best || score > best.score)) {
      best = { cat: r.cat, score };
    }
  }
  if (best) {
    return { category: best.cat, scores, reason: `genre:${best.cat}` };
  }
  return { category: DEFAULT_CATEGORY, scores, reason: 'default' };
}

/**
 * Heuristic quality filter — drops obviously weak titles before they reach
 * the registry. Returns true if the game should be KEPT.
 */
export function passesQualityFilter({ title = '', description = '' }) {
  const t = String(title).toLowerCase();
  // Empty or trivially short titles.
  if (t.trim().length < 3) return false;

  // Spammy / nonsense / brainrot meme titles.
  const BAD_SUBSTRINGS = [
    'brainrot', 'huggy', 'skibidi', 'gegagedigedagedago', 'fart',
    'evil nun', 'baldi', 'fnaf', 'sussy', 'sigma',
  ];
  if (BAD_SUBSTRINGS.some((s) => t.includes(s))) return false;

  // Coloring/coloring book pages — low engagement.
  if (/\bcoloring\b|\bcolouring\b/.test(t)) return false;

  // Christmas/halloween/easter dated titles — feel stale.
  // Keep general but drop ones with explicit years pre-2024.
  const oldYear = t.match(/\b(2018|2019|2020)\b/);
  if (oldYear) return false;

  // Differences/hidden picture filler.
  if (/\bdifferences?\b/.test(t)) return false;

  // Niche brand mashups (Barbie/Elsa/BTS/Huggy/Frozen knockoffs).
  const BAD_BRAND_WORDS = ['barbie', 'elsa', 'frozen princess', 'bts', 'huggy', 'eliza', 'draculaura', 'angelina', 'shimmer', 'baby taylor', 'paw care', 'ladybug masquerade'];
  if (BAD_BRAND_WORDS.some((s) => t.includes(s))) return false;

  // Description too short / placeholder.
  if (description && description.trim().length < 20) return false;

  return true;
}
