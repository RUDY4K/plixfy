'use client';

import Card from './Card';
import type { Card as CardData } from '../lib/deck';

interface BoardProps {
  cards: CardData[];
  cols: number;
  onFlip: (id: number) => void;
  shakeIds: Set<number>;
  inputDisabled: boolean;
}

export default function Board({ cards, cols, onFlip, shakeIds, inputDisabled }: BoardProps) {
  return (
    <div
      className="mx-auto grid gap-2 sm:gap-3"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        maxWidth: cols >= 6 ? '720px' : cols >= 5 ? '600px' : '480px',
      }}
    >
      {cards.map((card, idx) => (
        <Card
          key={card.id}
          card={card}
          onFlip={onFlip}
          shake={shakeIds.has(card.id)}
          disabled={inputDisabled}
          dealDelay={idx * 35}
        />
      ))}
    </div>
  );
}
