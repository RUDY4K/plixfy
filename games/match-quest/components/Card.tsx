'use client';

import { useState } from 'react';
import type { Card as CardData } from '../lib/deck';
import styles from '../match-quest.module.css';

interface CardProps {
  card: CardData;
  onFlip: (id: number) => void;
  shake: boolean;
  disabled: boolean;
  dealDelay: number;
}

export default function Card({ card, onFlip, shake, disabled, dealDelay }: CardProps) {
  const [pressed, setPressed] = useState(false);
  const isFlipped = card.flipped || card.matched;

  const handleClick = () => {
    if (disabled || card.flipped || card.matched) return;
    onFlip(card.id);
  };

  return (
    <div
      className={`${styles.card} ${styles.dealt} aspect-[3/4]`}
      style={{ animationDelay: `${dealDelay}ms` }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={handleClick}
      role="button"
      aria-label={isFlipped ? `Card showing ${card.emoji}` : 'Face-down card'}
    >
      <div
        className={`${styles.cardInner} ${isFlipped ? styles.flipped : ''} ${
          card.matched ? styles.matched : ''
        } ${shake ? styles.mismatched : ''}`}
        style={pressed && !isFlipped ? { transform: 'scale(0.96)' } : undefined}
      >
        <div
          className={`${styles.face} bg-gradient-to-br from-violet-600 via-violet-700 to-violet-900 border-2 border-violet-400/30`}
        >
          <span className="text-3xl text-violet-200 opacity-30">?</span>
        </div>
        <div
          className={`${styles.face} ${styles.back} bg-neutral-900 border-2 border-neutral-700`}
        >
          <span className="text-4xl sm:text-5xl">{card.emoji}</span>
        </div>
      </div>
    </div>
  );
}
