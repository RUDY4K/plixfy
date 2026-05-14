'use client';

import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import type { GameLoader } from '@/types/game';
import { log } from '@/lib/logger';

interface PhaserGameProps {
  loadGame: GameLoader;
  className?: string;
}

/**
 * Mounts a Phaser game inside a div the component owns.
 *
 * Both Phaser itself and the game module are loaded via dynamic import inside
 * useEffect, so nothing that touches `window` ever runs on the server. This
 * file is only reached through next/dynamic({ ssr: false }) via GameContainer.
 */
export default function PhaserGame({ loadGame, className }: PhaserGameProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    let cancelled = false;
    const parent = parentRef.current;
    if (!parent) return;

    (async () => {
      try {
        const [phaserMod, gameMod] = await Promise.all([
          import('phaser'),
          loadGame(),
        ]);
        if (cancelled) return;
        if (gameRef.current) return;
        const config = gameMod.createConfig(parent);
        gameRef.current = new phaserMod.default.Game(config);
      } catch (err) {
        log.error('Failed to start Phaser game', err);
      }
    })();

    return () => {
      cancelled = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [loadGame]);

  return <div ref={parentRef} className={className} />;
}
