'use client';

import { useCallback } from 'react';
import GameContainer from '@/components/GameContainer';
import type { GameLoader } from '@/types/game';

export default function TestPhaserStage() {
  const loadGame: GameLoader = useCallback(
    () => import('@/games/test-scene'),
    []
  );
  return <GameContainer loadGame={loadGame} />;
}
