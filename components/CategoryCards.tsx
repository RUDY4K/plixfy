import type { GameCategory, GameMeta } from '@/types/game';

interface CategoryCardsProps {
  games: readonly GameMeta[];
  onSelect?: (cat: GameCategory | 'all') => void;
}

/**
 * Visual metadata for each category. Icons are chosen for emoji glyphs that
 * render consistently on Windows/Mac/iOS/Android — no obscure codepoints.
 * Colors mirror the gradient palette used elsewhere in the app.
 */
export const CATEGORY_META: Record<
  GameCategory,
  { label: string; icon: string; gradient: string }
> = {
  arcade: { label: 'Arcade', icon: '🕹️', gradient: 'from-amber-500/30 to-orange-500/10' },
  puzzle: { label: 'Puzzle', icon: '🧩', gradient: 'from-fuchsia-500/30 to-purple-500/10' },
  racing: { label: 'Racing', icon: '🏎️', gradient: 'from-rose-500/30 to-red-500/10' },
  shooting: { label: 'Shooting', icon: '🎯', gradient: 'from-red-500/30 to-orange-500/10' },
  sports: { label: 'Sports', icon: '⚽', gradient: 'from-green-500/30 to-emerald-500/10' },
  action: { label: 'Action', icon: '⚔️', gradient: 'from-yellow-500/30 to-orange-500/10' },
  adventure: { label: 'Adventure', icon: '🗺️', gradient: 'from-lime-500/30 to-green-500/10' },
  strategy: { label: 'Strategy', icon: '🏰', gradient: 'from-blue-500/30 to-indigo-500/10' },
  board: { label: 'Board', icon: '♟️', gradient: 'from-stone-500/30 to-neutral-500/10' },
  word: { label: 'Word', icon: '🔤', gradient: 'from-pink-500/30 to-rose-500/10' },
  io: { label: 'IO Games', icon: '🌐', gradient: 'from-cyan-500/30 to-sky-500/10' },
  simulation: { label: 'Simulation', icon: '🚜', gradient: 'from-yellow-500/30 to-amber-500/10' },
  clicker: { label: 'Clicker', icon: '👆', gradient: 'from-violet-500/30 to-purple-500/10' },
  skill: { label: 'Skill', icon: '🎪', gradient: 'from-teal-500/30 to-cyan-500/10' },
  casual: { label: 'Casual', icon: '🎲', gradient: 'from-sky-500/30 to-blue-500/10' },
  girls: { label: 'Dress Up', icon: '👗', gradient: 'from-pink-500/30 to-fuchsia-500/10' },
  stickman: { label: 'Stickman', icon: '🥷', gradient: 'from-neutral-400/30 to-stone-500/10' },
  zombie: { label: 'Zombie', icon: '🧟', gradient: 'from-emerald-700/40 to-neutral-900/10' },
  cooking: { label: 'Cooking', icon: '🍳', gradient: 'from-orange-500/30 to-amber-500/10' },
};

const CATEGORY_ORDER: GameCategory[] = [
  'arcade', 'racing', 'shooting', 'action', 'sports',
  'puzzle', 'adventure', 'io', 'stickman', 'zombie',
  'strategy', 'simulation', 'cooking', 'board', 'word',
  'clicker', 'skill', 'casual', 'girls',
];

export default function CategoryCards({ games }: CategoryCardsProps) {
  // Count games per category — only render categories that have entries.
  const counts = new Map<GameCategory, number>();
  for (const g of games) {
    if (g.status !== 'live') continue;
    counts.set(g.category, (counts.get(g.category) ?? 0) + 1);
  }

  const visible = CATEGORY_ORDER.filter((c) => (counts.get(c) ?? 0) > 0);

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">Browse by category</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visible.map((cat) => {
          const meta = CATEGORY_META[cat];
          const count = counts.get(cat) ?? 0;
          return (
            <a
              key={cat}
              href={`#games?category=${cat}`}
              data-category={cat}
              className={`group relative flex flex-col gap-1 overflow-hidden rounded-xl border border-neutral-800 bg-gradient-to-br ${meta.gradient} p-4 transition hover:border-neutral-600 hover:scale-[1.02]`}
            >
              <span className="text-2xl" aria-hidden="true">{meta.icon}</span>
              <span className="text-sm font-semibold text-white">{meta.label}</span>
              <span className="text-xs text-neutral-300/80">{count} game{count === 1 ? '' : 's'}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
