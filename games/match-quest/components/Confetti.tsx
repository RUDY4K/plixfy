'use client';

import { useMemo } from 'react';
import styles from '../match-quest.module.css';

const COLORS = ['#fbbf24', '#22c55e', '#3b82f6', '#ec4899', '#f97316', '#a855f7'];

interface ConfettiProps {
  active: boolean;
  pieces?: number;
}

export default function Confetti({ active, pieces = 60 }: ConfettiProps) {
  const items = useMemo(() => {
    if (!active) return [];
    return Array.from({ length: pieces }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.7,
      duration: 2.2 + Math.random() * 1.8,
      color: COLORS[i % COLORS.length],
      sway: Math.random() * 40 - 20,
    }));
  }, [active, pieces]);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {items.map((p, i) => (
        <div
          key={i}
          className={styles.confettiPiece}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            background: p.color,
            marginLeft: `${p.sway}px`,
          }}
        />
      ))}
    </div>
  );
}
