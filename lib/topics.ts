import type { GameCategory, LightGameMeta } from '@/types/game';

/**
 * Topic-driven SEO landing pages. Each topic is a static slug plus a
 * (predicate, intro, schema) bundle. Pages emit canonical OG/Twitter
 * metadata + JSON-LD CollectionPage + ItemList plus a paginated grid
 * (first 50 games SSR + client-side "Load more" beyond that).
 *
 * Slugs are pinned forever — once Google indexes /play/car-games the
 * path must stay. New topics get *added*, never renamed.
 *
 * NOTE: this module is imported by both the topic page AND the
 * /api/play/[topic] paginated route, so the matcher closures must stay
 * pure (no React/Next imports, no client-only globals).
 */

export interface Topic {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  match: (g: LightGameMeta) => boolean;
  emoji: string;
}

const cat = (c: GameCategory) => (g: LightGameMeta) => g.category === c;

export const TOPICS: Topic[] = [
  {
    slug: 'io-games',
    title: 'IO Games',
    metaTitle: 'Free IO Games — Multiplayer Browser .io Games | Plixfy',
    metaDescription:
      'Play the best .io games online for free — Slither.io, Shell Shockers, Paper.io, Bonk.io, Smash Karts. Multiplayer browser games, no download.',
    intro:
      'The .io genre means real-time multiplayer in your browser — no account, no install, just open a tab and you’re in. From Slither.io and Paper.io to Shell Shockers and Smash Karts, this page collects every IO and multiplayer title on Plixfy in one grid.',
    match: (g) => g.category === 'io' || g.category === 'multiplayer',
    emoji: '🌐',
  },
  {
    slug: 'multiplayer-games',
    title: 'Multiplayer Games',
    metaTitle: 'Free Online Multiplayer Games — Play with Friends | Plixfy',
    metaDescription:
      'Play multiplayer browser games — Smash Karts, LOL Beans, Slither.io, Shell Shockers and more. Real-time PvP, co-op, party games. No download required.',
    intro:
      'Real-time multiplayer in a browser — race friends in Smash Karts, drop into LOL Beans’ obstacle gauntlet, or jump straight into a Shell Shockers match. Every game here pits you against actual humans or your couch crew.',
    match: (g) => g.category === 'multiplayer' || g.category === 'io',
    emoji: '👥',
  },
  {
    slug: 'unblocked-games',
    title: 'Unblocked Games',
    metaTitle: 'Unblocked Games Online — Free Browser Games | Plixfy',
    metaDescription:
      'Free unblocked games for school Chromebooks and work laptops. Subway Surfers, Drift Hunters, Madalin Stunt Cars, Geometry Dash, Smash Karts, Cut the Rope and more.',
    intro:
      'Every game on Plixfy runs straight in the browser — no plugins, no downloads, no logins. Use this page when you need a quick, school-safe game session: classics like Subway Surfers, Drift Hunters, Madalin Stunt Cars, and our entire .io roster.',
    match: (g) => g.status === 'live',
    emoji: '🚀',
  },
  {
    slug: 'shooting-games',
    title: 'Shooting Games',
    metaTitle: 'Free Online Shooting Games — FPS, Sniper, Battle Royale | Plixfy',
    metaDescription:
      'Browser-based shooting games — FPS, sniper, battle royale and stickman shooters. Shell Shockers, Surviv.io, Venge.io, Krunker.io. Free, instant, no download.',
    intro:
      'From egg-FPS to medieval bow PvP, this is every shooting game Plixfy has. Multiplayer arenas, single-player campaigns, snipers and stickmen — all running in your browser.',
    match: cat('shooting'),
    emoji: '🎯',
  },
  {
    slug: 'racing-games',
    title: 'Racing Games',
    metaTitle: 'Free Racing Games — Drift, Stunt, Traffic | Plixfy',
    metaDescription:
      'Browser racing games — Drift Hunters, Madalin Stunt Cars, Moto X3M, Highway Traffic, Smash Karts. Free, instant play, no download required.',
    intro:
      'Burn rubber across drift tracks, stunt parks, and traffic-packed highways. Every racing game on Plixfy plays in your browser — desktop and mobile.',
    match: cat('racing'),
    emoji: '🏁',
  },
  {
    slug: 'car-games',
    title: 'Car Games',
    metaTitle: 'Free Car Games Online — Drive, Drift, Park, Stunt | Plixfy',
    metaDescription:
      'Play free car games in your browser — Drift Hunters, Madalin Stunt Cars 2, Highway Traffic, Moto X3M, Hill Climb Racing. Realistic and arcade driving.',
    intro:
      'Whether you want realistic drift physics, ramp-and-stunt mayhem, or a relaxing highway-traffic cruise, the car-games shelf has it all. Each title runs in the browser at full speed — no install, no signup.',
    match: cat('racing'),
    emoji: '🚗',
  },
  {
    slug: 'puzzle-games',
    title: 'Puzzle Games',
    metaTitle: 'Free Puzzle Games — Match-3, Sudoku, Tile, Logic | Plixfy',
    metaDescription:
      '1,100+ free puzzle games in your browser — 2048, Mahjong, Match-3, Bubble Shooter, Sudoku, Solitaire. Play instantly, no signup required.',
    intro:
      'From the addictive simplicity of 2048 to the deep strategy of Mahjong solitaire, the puzzle shelf is Plixfy’s biggest category. Match three, slide tiles, find pairs, or sweat over a brain teaser — everything plays in your browser.',
    match: cat('puzzle'),
    emoji: '🧩',
  },
  {
    slug: 'action-games',
    title: 'Action Games',
    metaTitle: 'Free Action Games Online — Fighting, Battles, Brawlers | Plixfy',
    metaDescription:
      'Play free action games in your browser — fighting, brawling, ninja, knight, dragon, parkour, ragdoll battles. Instant play, no download required.',
    intro:
      'Punch, slash, dodge, jump — the action shelf delivers fast-twitch combat with ninjas, knights, samurai and stickmen. Plays straight in your browser, mobile or desktop.',
    match: cat('action'),
    emoji: '⚔️',
  },
  {
    slug: 'sports-games',
    title: 'Sports Games',
    metaTitle: 'Free Sports Games Online — Basketball, Soccer, Pool | Plixfy',
    metaDescription:
      'Play free sports games — Basketball Stars, 8 Ball Pool, Super Soccer, Retro Bowl. Realistic and arcade-style sports in your browser, no download.',
    intro:
      'Drain three-pointers in Basketball Stars, line up a clutch 8-ball shot in Pool, or coach a football season in Retro Bowl. Every sports game on Plixfy works on desktop, tablet and phone.',
    match: cat('sports'),
    emoji: '🏀',
  },
  {
    slug: 'stickman-games',
    title: 'Stickman Games',
    metaTitle: 'Free Stickman Games Online — Runner, Fight, Archer | Plixfy',
    metaDescription:
      'Play free stickman games — Stickman Hook, Stickman Archer, Stick War, Stickman Death Run. Browser-based fighting, running, and shooting with stick figures.',
    intro:
      'The stickman shelf has runners, fighters, archers and survival classics — every game stars a wire-frame hero and runs free in your browser.',
    match: cat('stickman'),
    emoji: '🥷',
  },
  {
    slug: 'zombie-games',
    title: 'Zombie Games',
    metaTitle: 'Free Zombie Games Online — Survival, Shooter, Defense | Plixfy',
    metaDescription:
      'Play free zombie games in your browser — zombie shooter, survival, tower defense, undead battle. Instant play, no download required.',
    intro:
      'Outrun the horde, defend the city, or grab a shotgun and start clearing rooms. Zombie shooters, survival tycoons, and defense games — all running in your browser.',
    match: cat('zombie'),
    emoji: '🧟',
  },
  {
    slug: 'cooking-games',
    title: 'Cooking Games',
    metaTitle: 'Free Cooking Games Online — Kitchen, Restaurant, Chef | Plixfy',
    metaDescription:
      'Play free cooking games — restaurant tycoons, kitchen rushes, chef simulators, baking, pizza, sushi, burger. Browser-based, no download required.',
    intro:
      'Run a five-star kitchen, race the dinner clock, or bake the world’s prettiest cupcakes. The cooking shelf is colorful, calm, and full of taps to land.',
    match: cat('cooking'),
    emoji: '🍳',
  },
];

export function findTopic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

/**
 * Apply a topic's matcher AND the live-status gate. Used by both the SSR
 * page and the paginated API route so they agree on the universe of games.
 */
export function gamesForTopic(t: Topic, all: readonly LightGameMeta[]): LightGameMeta[] {
  return all.filter(t.match).filter((g) => g.status === 'live');
}

export const TOPIC_SLUGS: readonly string[] = TOPICS.map((t) => t.slug);

/** SSR batch size — anything beyond this loads lazily client-side. */
export const TOPIC_INITIAL_PAGE_SIZE = 50;
/** Per-batch size when the "Load more" button is clicked. */
export const TOPIC_BATCH_SIZE = 50;
