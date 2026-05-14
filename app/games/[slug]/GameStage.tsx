'use client';

import { useMemo } from 'react';
import type { GameMeta, GameLoader } from '@/types/game';
import GameContainer from '@/components/GameContainer';

interface GameStageProps {
  game: GameMeta;
}

/**
 * Routes a game slug to its dynamically-imported Phaser module (or React
 * widget). Each game's module imports Phaser at module-evaluation time, so
 * we MUST resolve them via dynamic `import('@/games/<slug>')` — never via a
 * static import — to keep SSR safe.
 */
const PHASER_LOADERS: Record<string, GameLoader> = {
  'flap-hero': () => import('@/games/flap-hero'),
};

export default function GameStage({ game }: GameStageProps) {
  const loadGame = useMemo<GameLoader | null>(() => {
    if (game.engine !== 'phaser') return null;
    return PHASER_LOADERS[game.slug] ?? null;
  }, [game.engine, game.slug]);

  if (game.status !== 'live') {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900 text-neutral-500">
        <div className="text-center">
          <p className="text-lg font-semibold text-neutral-300">Coming soon</p>
          <p className="mt-1 text-sm">This game is on the build list.</p>
        </div>
      </div>
    );
  }

  if (game.engine === 'phaser' && loadGame) {
    return <GameContainer loadGame={loadGame} aspectClassName="aspect-[2/3] max-h-[80vh] mx-auto max-w-md" />;
  }

  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400">
      Game module missing for {game.slug}
    </div>
  );
}
