'use client';

import dynamic from 'next/dynamic';
import type { GameLoader } from '@/types/game';

interface GameContainerProps {
  loadGame: GameLoader;
  aspectClassName?: string;
}

const PhaserGame = dynamic(() => import('./PhaserGame'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-neutral-400">
      Loading game…
    </div>
  ),
});

export default function GameContainer({
  loadGame,
  aspectClassName = 'aspect-[4/3]',
}: GameContainerProps) {
  return (
    <div
      className={`w-full ${aspectClassName} overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-[0_0_30px_rgba(74,222,128,0.08)]`}
    >
      <PhaserGame loadGame={loadGame} className="h-full w-full" />
    </div>
  );
}
