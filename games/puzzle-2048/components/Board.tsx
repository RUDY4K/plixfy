'use client';

import { useEffect, useRef } from 'react';
import type { Direction, Tile as TileData } from '../lib/moves';
import Tile from './Tile';
import styles from '../puzzle-2048.module.css';

interface BoardProps {
  tiles: TileData[];
  onMove: (dir: Direction) => void;
  disabled: boolean;
}

const SWIPE_THRESHOLD = 24;

export default function Board({ tiles, onMove, disabled }: BoardProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const handleStart = (e: TouchEvent) => {
      if (disabled) return;
      if (e.touches.length !== 1) return;
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleEnd = (e: TouchEvent) => {
      if (disabled) return;
      const start = touchStart.current;
      if (!start) return;
      touchStart.current = null;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (Math.max(adx, ady) < SWIPE_THRESHOLD) return;
      if (adx > ady) onMove(dx > 0 ? 'right' : 'left');
      else onMove(dy > 0 ? 'down' : 'up');
    };
    const handleMove = (e: TouchEvent) => {
      // Prevent page scroll while the player is swiping over the board.
      if (touchStart.current) e.preventDefault();
    };

    el.addEventListener('touchstart', handleStart, { passive: true });
    el.addEventListener('touchmove', handleMove, { passive: false });
    el.addEventListener('touchend', handleEnd, { passive: true });
    el.addEventListener('touchcancel', () => (touchStart.current = null), { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleStart);
      el.removeEventListener('touchmove', handleMove);
      el.removeEventListener('touchend', handleEnd);
    };
  }, [disabled, onMove]);

  return (
    <div ref={wrapRef} className={styles.boardWrap} aria-label="2048 board">
      <div className={styles.bgGrid}>
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} className={styles.cell} />
        ))}
      </div>
      <div className={styles.tilesLayer}>
        {tiles.map((t) => (
          <Tile key={t.id} tile={t} />
        ))}
      </div>
    </div>
  );
}
