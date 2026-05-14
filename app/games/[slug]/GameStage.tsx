'use client';

import { useCallback } from 'react';
import type { GameMeta, GameLoader } from '@/types/game';
import GameContainer from '@/components/GameContainer';

interface GameStageProps {
  game: GameMeta;
}

/**
 * Routes a game slug to its dynamically-imported Phaser module (or React
 * widget). Until each game lands, every Phaser slot falls back to the
 * Hello-Phaser test scene so we can prove end-to-end wiring works.
 */
export default function GameStage({ game }: GameStageProps) {
  const loadGame: GameLoader = useCallback(
    () => import('@/games/test-scene'),
    []
  );

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

  if (game.engine === 'phaser') {
    return <GameContainer loadGame={loadGame} />;
  }

  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400">
      React game placeholder
    </div>
  );
}
