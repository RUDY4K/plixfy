import type { GameCategory, LightGameMeta } from '@/types/game';

interface CategoryCardsProps {
  games: readonly LightGameMeta[];
  onSelect?: (cat: GameCategory | 'all') => void;
}

/**
 * Visual metadata for each category. Icons are chosen for emoji glyphs that
 * render consistently on Windows/Mac/iOS/Android — no obscure codepoints.
 * Colors mirror the gradient palette used elsewhere in the app.
 */
/**
 * Each category gets:
 *   - label     display name
 *   - icon      emoji glyph
 *   - gradient  legacy Tailwind class fallback (still consumed elsewhere)
 *   - neon      hex color used by the new glass cards' border/glow
 */
export const CATEGORY_META: Record<
  GameCategory,
  { label: string; icon: string; gradient: string; neon: string }
> = {
  arcade:      { label: 'Arcade',      icon: '🕹️', gradient: 'from-amber-500/30 to-orange-500/10',     neon: '#FF6B35' },
  puzzle:      { label: 'Puzzle',      icon: '🧩', gradient: 'from-fuchsia-500/30 to-purple-500/10',   neon: '#FF2DAA' },
  racing:      { label: 'Racing',      icon: '🏎️', gradient: 'from-rose-500/30 to-red-500/10',         neon: '#FF3366' },
  shooting:    { label: 'Shooting',    icon: '🎯', gradient: 'from-red-500/30 to-orange-500/10',       neon: '#FF4655' },
  sports:      { label: 'Sports',      icon: '⚽', gradient: 'from-green-500/30 to-emerald-500/10',    neon: '#39FF14' },
  action:      { label: 'Action',      icon: '⚔️', gradient: 'from-yellow-500/30 to-orange-500/10',    neon: '#FFB300' },
  adventure:   { label: 'Adventure',   icon: '🗺️', gradient: 'from-lime-500/30 to-green-500/10',       neon: '#9DFF42' },
  strategy:    { label: 'Strategy',    icon: '🏰', gradient: 'from-blue-500/30 to-indigo-500/10',      neon: '#5B8CFF' },
  board:       { label: 'Board',       icon: '♟️', gradient: 'from-stone-500/30 to-neutral-500/10',    neon: '#B5BBC9' },
  word:        { label: 'Word',        icon: '🔤', gradient: 'from-pink-500/30 to-rose-500/10',        neon: '#FF6FC8' },
  io:          { label: 'IO Games',    icon: '🌐', gradient: 'from-cyan-500/30 to-sky-500/10',         neon: '#00F5FF' },
  multiplayer: { label: 'Multiplayer', icon: '👥', gradient: 'from-indigo-500/30 to-blue-500/10',      neon: '#7C4DFF' },
  simulation:  { label: 'Simulation',  icon: '🚜', gradient: 'from-yellow-500/30 to-amber-500/10',     neon: '#FFD23F' },
  clicker:     { label: 'Clicker',     icon: '👆', gradient: 'from-violet-500/30 to-purple-500/10',    neon: '#A78BFA' },
  skill:       { label: 'Skill',       icon: '🎪', gradient: 'from-teal-500/30 to-cyan-500/10',        neon: '#14F5DF' },
  casual:      { label: 'Casual',      icon: '🎲', gradient: 'from-sky-500/30 to-blue-500/10',         neon: '#4DD5FF' },
  girls:       { label: 'Dress Up',    icon: '👗', gradient: 'from-pink-500/30 to-fuchsia-500/10',     neon: '#FF6FC8' },
  stickman:    { label: 'Stickman',    icon: '🥷', gradient: 'from-neutral-400/30 to-stone-500/10',    neon: '#E8E8E8' },
  zombie:      { label: 'Zombie',      icon: '🧟', gradient: 'from-emerald-700/40 to-neutral-900/10',  neon: '#00C896' },
  cooking:     { label: 'Cooking',     icon: '🍳', gradient: 'from-orange-500/30 to-amber-500/10',     neon: '#FF8C42' },
};

const CATEGORY_ORDER: GameCategory[] = [
  'arcade', 'racing', 'shooting', 'action', 'sports',
  'puzzle', 'adventure', 'io', 'multiplayer', 'stickman', 'zombie',
  'strategy', 'simulation', 'cooking', 'board', 'word',
  'clicker', 'skill', 'casual', 'girls',
];

/**
 * Map each category to a real `/play/<slug>` page when we have one — those
 * are crawlable, canonical landing pages with their own metadata. Fallback
 * to the in-page hash filter for the long-tail categories that don't yet
 * have a dedicated SEO page.
 */
const CATEGORY_HREF: Partial<Record<GameCategory, string>> = {
  io: '/play/io-games',
  multiplayer: '/play/multiplayer-games',
  racing: '/play/racing-games',
  shooting: '/play/shooting-games',
  puzzle: '/play/puzzle-games',
  action: '/play/action-games',
  sports: '/play/sports-games',
  stickman: '/play/stickman-games',
  zombie: '/play/zombie-games',
  cooking: '/play/cooking-games',
};

function hrefFor(cat: GameCategory): string {
  return CATEGORY_HREF[cat] ?? `#games?category=${cat}`;
}

/**
 * Hand-picked hero slugs per category — most recognizable game so the
 * card thumbnail looks like a real, exciting game (not text on gradient).
 * If a slug is missing from the registry the fallback below picks the
 * first live game in that category.
 */
const CATEGORY_HERO_SLUG: Partial<Record<GameCategory, string>> = {
  racing: 'moto-x3m',
  arcade: 'helix-jump',
  puzzle: 'bubble-shooter-original',
  sports: 'basketball-stars',
  stickman: 'stickman-death-run',
  board: 'microsoft-solitaire-collection',
};

function pickHero(
  cat: GameCategory,
  bySlug: Map<string, LightGameMeta>,
  liveByCat: Map<GameCategory, LightGameMeta[]>,
): LightGameMeta | undefined {
  const preferred = CATEGORY_HERO_SLUG[cat];
  if (preferred) {
    const g = bySlug.get(preferred);
    if (g && g.status === 'live') return g;
  }
  // Fallback: first live game in category, preferring embeds (which have
  // real photo thumbnails) over customs.
  const pool = liveByCat.get(cat) ?? [];
  const embedFirst = pool.find((g) => g.kind === 'embed');
  return embedFirst ?? pool[0];
}

export default function CategoryCards({ games }: CategoryCardsProps) {
  // Index once so the picker is O(1) per category.
  const bySlug = new Map<string, LightGameMeta>();
  const liveByCat = new Map<GameCategory, LightGameMeta[]>();
  const counts = new Map<GameCategory, number>();

  for (const g of games) {
    bySlug.set(g.slug, g);
    if (g.status !== 'live') continue;
    counts.set(g.category, (counts.get(g.category) ?? 0) + 1);
    const arr = liveByCat.get(g.category);
    if (arr) arr.push(g);
    else liveByCat.set(g.category, [g]);
  }

  const visible = CATEGORY_ORDER.filter((c) => (counts.get(c) ?? 0) > 0);

  return (
    <section className="mt-12">
      <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-[0.04em] sm:text-3xl">
        <span className="neon-text-gradient">Browse by category</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visible.map((cat) => {
          const meta = CATEGORY_META[cat];
          const count = counts.get(cat) ?? 0;
          const hero = pickHero(cat, bySlug, liveByCat);
          return (
            <a
              key={cat}
              href={hrefFor(cat)}
              data-category={cat}
              aria-label={`Browse ${meta.label} games`}
              style={{ ['--card-glow' as string]: meta.neon }}
              className="group glass card-hover relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl"
            >
              {hero ? (
                <img
                  src={hero.thumbnail}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, color-mix(in srgb, ${meta.neon} 28%, transparent), color-mix(in srgb, ${meta.neon} 6%, transparent))`,
                  }}
                />
              )}
              {/* Color wash + readability gradient, layered for depth. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 mix-blend-overlay opacity-60"
                style={{
                  background: `linear-gradient(135deg, color-mix(in srgb, ${meta.neon} 35%, transparent), transparent 70%)`,
                }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
              />
              {/* Gradient border accent on hover via inner ring */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-50 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${meta.neon} 55%, transparent)`,
                }}
              />
              {/* Big neon-glowing icon */}
              <span
                aria-hidden="true"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl text-xl backdrop-blur"
                style={{
                  background: `color-mix(in srgb, ${meta.neon} 16%, rgba(0,0,0,0.4))`,
                  border: `1px solid color-mix(in srgb, ${meta.neon} 45%, transparent)`,
                  boxShadow: `0 0 16px -4px ${meta.neon}`,
                }}
              >
                {meta.icon}
              </span>
              <div className="relative z-10 flex flex-col gap-0.5 p-3">
                <span className="font-display text-base font-extrabold uppercase tracking-[0.04em] text-white drop-shadow-md sm:text-lg">
                  {meta.label}
                </span>
                <span
                  className="font-display text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: meta.neon }}
                >
                  {count} game{count === 1 ? '' : 's'}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
