'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Board from './components/Board';
import ScoreBoard from './components/ScoreBoard';
import Controls from './components/Controls';
import ResultsOverlay from './components/ResultsOverlay';
import {
  type Direction,
  type Tile,
  applyMerges,
  initialTiles,
  isGameOver,
  makeIdGen,
  move,
  reachedWin,
  spawnTile,
} from './lib/moves';
import { SLIDE_MS, WIN_VALUE } from './lib/constants';
import { sounds } from './lib/audio';
import { loadBest, recordScore } from './lib/highscore';
import {
  trackGameStart,
  trackGameEnd,
  trackHighScore,
  trackShare,
} from '@/lib/analytics';
import { showInterstitial } from '@/lib/ads';

type Phase = 'playing' | 'won' | 'over' | 'continuing';

interface Snapshot {
  tiles: Tile[];
  score: number;
}

export default function Puzzle2048() {
  const idGenRef = useRef(makeIdGen(1));
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [history, setHistory] = useState<Snapshot | null>(null);
  const [animating, setAnimating] = useState(false);
  const [lastGain, setLastGain] = useState(0);
  const [gainKey, setGainKey] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const adFiredRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const winShownRef = useRef(false);

  // Hydrate best score + start fresh game on mount
  useEffect(() => {
    setBest(loadBest());
    startNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNewGame = useCallback(() => {
    idGenRef.current = makeIdGen(1);
    const fresh = initialTiles(idGenRef.current);
    setTiles(fresh);
    setScore(0);
    setHistory(null);
    setPhase('playing');
    setAnimating(false);
    setLastGain(0);
    setIsNewBest(false);
    adFiredRef.current = false;
    winShownRef.current = false;
    startTimeRef.current = Date.now();
    trackGameStart('puzzle-2048');
  }, []);

  const finalizeRun = useCallback(
    (finalTiles: Tile[], finalScore: number, reason: 'complete' | 'died') => {
      const duration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
      const previousBest = loadBest();
      const newBest = recordScore(finalScore);
      const newRecord = finalScore > previousBest && finalScore === newBest;
      setBest(newBest);
      setIsNewBest(newRecord);
      trackGameEnd('puzzle-2048', finalScore, duration, reason);
      if (newRecord) trackHighScore('puzzle-2048', finalScore);

      // *** AD BREAK POINT ***
      // Stub today; swaps to real provider in Prompt 8.
      if (!adFiredRef.current && reason === 'died') {
        adFiredRef.current = true;
        void showInterstitial('next', 'puzzle-2048');
      }

      void finalTiles;
    },
    []
  );

  const handleMove = useCallback(
    (direction: Direction) => {
      if (animating) return;
      if (phase === 'over') return;
      if (phase === 'won') return; // user must continue or restart

      const result = move(tiles, direction);
      if (!result.moved) return;

      // Save undo snapshot (single-step). Take it BEFORE applying merges so
      // a slip can be reversed cleanly.
      setHistory({ tiles: tiles.map((t) => ({ ...t, isNew: false, isMerged: false })), score });

      setTiles(result.tiles);
      setAnimating(true);
      sounds.slide();

      window.setTimeout(() => {
        const merged = applyMerges(result.tiles, result.merges);
        const newTile = spawnTile(merged, idGenRef.current);
        const finalTiles = newTile ? [...merged, newTile] : merged;
        setTiles(finalTiles);

        const newScore = score + result.scoreGain;
        setScore(newScore);
        if (result.scoreGain > 0) {
          setLastGain(result.scoreGain);
          setGainKey((k) => k + 1);
          const biggest = Math.max(...result.merges.map((m) => m.newValue), 0);
          if (biggest > 0) sounds.merge(biggest);
        }

        // Win detection — only on first reach
        if (
          !winShownRef.current &&
          phase !== 'continuing' &&
          reachedWin(finalTiles, WIN_VALUE)
        ) {
          winShownRef.current = true;
          setPhase('won');
          finalizeRun(finalTiles, newScore, 'complete');
          sounds.win();
        } else if (isGameOver(finalTiles)) {
          setPhase('over');
          finalizeRun(finalTiles, newScore, 'died');
          sounds.over();
        }

        setAnimating(false);
      }, SLIDE_MS);
    },
    [animating, phase, score, tiles, finalizeRun]
  );

  const handleUndo = useCallback(() => {
    if (!history) return;
    if (phase === 'over') {
      // Allow undo even from game over to recover.
      setPhase('playing');
    }
    setTiles(history.tiles);
    setScore(history.score);
    setHistory(null);
    setLastGain(0);
  }, [history, phase]);

  const handleContinue = useCallback(() => {
    setPhase('continuing');
  }, []);

  const handleShare = useCallback(async () => {
    trackShare('puzzle-2048', 'clipboard');
    const msg = `I scored ${score} in 2048 on PlayHub (best: ${best}). Can you beat it?`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: '2048', text: msg });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(msg);
      }
    } catch {
      /* user dismissed or unavailable */
    }
  }, [score, best]);

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key;
      let dir: Direction | null = null;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') dir = 'left';
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') dir = 'right';
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') dir = 'up';
      else if (k === 'ArrowDown' || k === 's' || k === 'S') dir = 'down';
      if (!dir) return;
      e.preventDefault();
      handleMove(dir);
    };
    window.addEventListener('keydown', handler, { passive: false });
    return () => window.removeEventListener('keydown', handler);
  }, [handleMove]);

  const showOverlay = phase === 'won' || phase === 'over';

  return (
    <div className="relative mx-auto w-full max-w-md space-y-3">
      <div className="space-y-3">
        <ScoreBoard score={score} best={best} lastGain={lastGain} gainKey={gainKey} />
        <Controls onNewGame={startNewGame} onUndo={handleUndo} canUndo={!!history && !animating} />
      </div>

      <div className="relative">
        <Board tiles={tiles} onMove={handleMove} disabled={animating || phase === 'over'} />
        {showOverlay && (
          <ResultsOverlay
            kind={phase === 'won' ? 'won' : 'over'}
            score={score}
            best={best}
            isNewBest={isNewBest}
            onPlayAgain={startNewGame}
            onContinue={phase === 'won' ? handleContinue : undefined}
            onShare={handleShare}
          />
        )}
      </div>

      <p className="px-1 text-center text-xs text-neutral-500">
        Arrow keys / WASD on desktop · swipe on mobile. Merge same-number tiles to reach{' '}
        <span className="font-bold text-yellow-400">2048</span>.
      </p>
    </div>
  );
}
