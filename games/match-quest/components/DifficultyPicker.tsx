'use client';

import { DIFFICULTIES, DIFFICULTY_ORDER, type Difficulty } from '../lib/constants';

interface DifficultyPickerProps {
  selected: Difficulty;
  onSelect: (d: Difficulty) => void;
  size?: 'compact' | 'large';
}

const DESCRIPTION: Record<Difficulty, string> = {
  easy: '4×3 · 6 pairs',
  medium: '4×4 · 8 pairs',
  hard: '6×5 · 15 pairs',
};

export default function DifficultyPicker({
  selected,
  onSelect,
  size = 'compact',
}: DifficultyPickerProps) {
  return (
    <div
      className={`grid grid-cols-3 gap-2 ${
        size === 'large' ? 'rounded-xl bg-neutral-900 p-2' : ''
      }`}
    >
      {DIFFICULTY_ORDER.map((d) => {
        const active = d === selected;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onSelect(d)}
            className={`rounded-lg border px-3 py-2 text-center transition ${
              active
                ? 'border-emerald-400 bg-emerald-500/15 text-white'
                : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600'
            }`}
          >
            <p className="text-sm font-semibold">{DIFFICULTIES[d].label}</p>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">
              {DESCRIPTION[d]}
            </p>
          </button>
        );
      })}
    </div>
  );
}
