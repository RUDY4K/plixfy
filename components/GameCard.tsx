import Link from 'next/link';
import type { GameMeta } from '@/types/game';

interface GameCardProps {
  game: GameMeta;
}

const difficultyDots: Record<GameMeta['difficulty'], number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export default function GameCard({ game }: GameCardProps) {
  const isLive = game.status === 'live';
  const dots = difficultyDots[game.difficulty];

  return (
    <Link
      href={isLive ? `/games/${game.slug}` : '#'}
      aria-disabled={!isLive}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition ${
        isLive ? 'hover:border-neutral-600 hover:shadow-[0_0_24px_rgba(255,255,255,0.06)]' : 'opacity-60'
      }`}
      style={{ ['--accent' as string]: game.color }}
    >
      <div
        className="relative flex aspect-video items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${game.color}33, #0a0a0a)` }}
      >
        <span
          className="text-2xl font-bold tracking-tight text-white drop-shadow-md transition-transform group-hover:scale-105"
        >
          {game.title}
        </span>
        {game.kind === 'custom' && (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-950">
            Custom
          </span>
        )}
        {!isLive && (
          <span className="absolute right-2 top-2 rounded-full bg-neutral-800/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
            Coming soon
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between text-xs">
          <span
            className="rounded-full px-2 py-0.5 font-semibold uppercase tracking-wider"
            style={{ background: `${game.color}22`, color: game.color }}
          >
            {game.category}
          </span>
          <span className="flex items-center gap-0.5 text-neutral-400">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i < dots ? 'bg-neutral-300' : 'bg-neutral-700'
                }`}
              />
            ))}
          </span>
        </div>

        <p className="text-sm text-neutral-400 line-clamp-2">{game.description}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xs text-neutral-400">{game.controls}</span>
          <span
            className="rounded-md px-3 py-1 text-xs font-semibold text-neutral-950 transition group-hover:scale-105"
            style={{ background: game.color }}
          >
            {isLive ? 'Play →' : 'Soon'}
          </span>
        </div>
      </div>
    </Link>
  );
}
