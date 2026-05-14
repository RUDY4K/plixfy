import type { GameMeta } from '@/types/game';

export const GAMES: readonly GameMeta[] = [
  {
    slug: 'flap-hero',
    title: 'Flap Hero',
    description: 'Tap to fly through the gaps. How far can you go?',
    longDescription:
      'A side-scrolling arcade game. Tap, click, or press space to flap your way past endless pipe gaps. Each pipe cleared earns a point — but pipes get faster and gaps get tighter.',
    thumbnail: '/assets/thumbnails/flap-hero.svg',
    category: 'arcade',
    difficulty: 'medium',
    controls: 'Click / Space / Tap to flap',
    color: '#4ade80',
    keywords: ['flap hero', 'flying game', 'arcade', 'tap game', 'free browser game'],
    status: 'live',
    engine: 'phaser',
  },
  {
    slug: 'slither-trail',
    title: 'Slither Trail',
    description: 'Classic snake action — eat, grow, and avoid the walls.',
    longDescription:
      'Control a growing snake to eat apples and chain combos. The longer you survive, the faster it gets. Hit a wall or your own tail and the run ends.',
    thumbnail: '/assets/thumbnails/slither-trail.svg',
    category: 'arcade',
    difficulty: 'easy',
    controls: 'Arrow keys / WASD / Swipe',
    color: '#22c55e',
    keywords: ['snake game', 'slither', 'arcade', 'classic snake', 'free online'],
    status: 'coming-soon',
    engine: 'phaser',
  },
  {
    slug: 'puzzle-2048',
    title: '2048',
    description: 'Slide matching tiles to build the legendary 2048 tile.',
    longDescription:
      'The classic tile-merging puzzle. Slide tiles in four directions; matching numbers combine. Plan ahead — once the board fills up, the run ends.',
    thumbnail: '/assets/thumbnails/2048.svg',
    category: 'puzzle',
    difficulty: 'medium',
    controls: 'Arrow keys / Swipe',
    color: '#fbbf24',
    keywords: ['2048', 'puzzle game', 'tile merge', 'numbers puzzle', 'free 2048'],
    status: 'coming-soon',
    engine: 'react',
  },
  {
    slug: 'match-quest',
    title: 'Match Quest',
    description: 'Flip cards, find pairs, beat the clock.',
    longDescription:
      'A memory-matching card game with three difficulty levels. Flip pairs of cards to find matches. Fewer moves and faster times earn higher scores and more stars.',
    thumbnail: '/assets/thumbnails/match-quest.svg',
    category: 'puzzle',
    difficulty: 'easy',
    controls: 'Click / Tap to flip',
    color: '#a78bfa',
    keywords: ['memory game', 'matching cards', 'concentration', 'card matching'],
    status: 'coming-soon',
    engine: 'react',
  },
  {
    slug: 'sky-dash',
    title: 'Sky Dash',
    description: 'Run, jump, and dodge in an endless side-scroller.',
    longDescription:
      'An endless runner: dodge obstacles, collect coins, double-jump over pits. Speed ramps up as you run further — how far can you reach?',
    thumbnail: '/assets/thumbnails/sky-dash.svg',
    category: 'arcade',
    difficulty: 'hard',
    controls: 'Space / Tap to jump',
    color: '#06b6d4',
    keywords: ['endless runner', 'platformer', 'sky dash', 'jumping game'],
    status: 'coming-soon',
    engine: 'phaser',
  },
  {
    slug: 'brick-smasher',
    title: 'Brick Smasher',
    description: 'Break every brick with a bouncing ball. Don’t miss!',
    longDescription:
      'A classic breakout / brick-breaker game. Move the paddle, bounce the ball, smash bricks. Power-ups drop randomly — multi-ball, wide paddle, slow ball.',
    thumbnail: '/assets/thumbnails/brick-smasher.svg',
    category: 'arcade',
    difficulty: 'medium',
    controls: 'Mouse / Touch to move paddle',
    color: '#f97316',
    keywords: ['breakout', 'brick breaker', 'paddle game', 'arcade classic'],
    status: 'coming-soon',
    engine: 'phaser',
  },
  {
    slug: 'type-sprint',
    title: 'Type Sprint',
    description: 'Test your typing speed and accuracy.',
    longDescription:
      'A clean typing speed test with three modes: random words, full sentences, and code snippets. Tracks your WPM, accuracy, and progress over time.',
    thumbnail: '/assets/thumbnails/type-sprint.svg',
    category: 'word',
    difficulty: 'easy',
    controls: 'Keyboard',
    color: '#ec4899',
    keywords: ['typing test', 'wpm', 'typing speed', 'words per minute'],
    status: 'coming-soon',
    engine: 'react',
  },
  {
    slug: 'tic-tac-toe',
    title: 'Tic Tac Toe',
    description: 'Classic 3-in-a-row vs AI or a friend.',
    longDescription:
      'Play tic-tac-toe against an AI opponent at three difficulty levels (random, mixed, unbeatable minimax) or against a friend on the same device.',
    thumbnail: '/assets/thumbnails/tic-tac-toe.svg',
    category: 'strategy',
    difficulty: 'easy',
    controls: 'Click / Tap',
    color: '#60a5fa',
    keywords: ['tic tac toe', 'noughts and crosses', 'strategy', 'two player'],
    status: 'coming-soon',
    engine: 'react',
  },
] as const;

export function findGame(slug: string): GameMeta | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export function gamesByCategory(category: GameMeta['category']): GameMeta[] {
  return GAMES.filter((g) => g.category === category);
}

export function liveGames(): GameMeta[] {
  return GAMES.filter((g) => g.status === 'live');
}
