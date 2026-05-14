'use client';

import { useMemo, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { GameMeta, GameLoader } from '@/types/game';
import GameContainer from '@/components/GameContainer';

interface GameStageProps {
  game: GameMeta;
}

/**
 * Routes a game slug to its dynamically-imported module. Phaser games are
 * loaded as a GameLoader (returns { createConfig }) and rendered through
 * GameContainer. React games are loaded as full Client Components.
 *
 * Every loader uses dynamic `import('@/games/<slug>')` to keep SSR safe:
 * Phaser modules touch `window` at module-eval time, React modules touch
 * localStorage in effects.
 */
const PHASER_LOADERS: Record<string, GameLoader> = {
  'flap-hero': () => import('@/games/flap-hero'),
  'slither-trail': () => import('@/games/slither-trail'),
};

const REACT_GAMES: Record<string, ComponentType> = {
  'match-quest': dynamic(() => import('@/games/match-quest'), {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center text-neutral-400">
        Loading game…
      </div>
    ),
  }),
};

export default function GameStage({ game }: GameStageProps) {
  const phaserLoader = useMemo<GameLoader | null>(() => {
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

  if (game.engine === 'phaser' && phaserLoader) {
    return (
      <GameContainer
        loadGame={phaserLoader}
        aspectClassName="aspect-[2/3] max-h-[80vh] mx-auto max-w-md"
      />
    );
  }

  if (game.engine === 'react') {
    const ReactGame = REACT_GAMES[game.slug];
    if (!ReactGame) {
      return (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400">
          React game module missing for {game.slug}
        </div>
      );
    }
    return <ReactGame />;
  }

  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400">
      Game module missing for {game.slug}
    </div>
  );
}
