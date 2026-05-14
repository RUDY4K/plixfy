'use client';

import type { Difficulty } from '../lib/constants';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../lib/constants';
import styles from '../match-quest.module.css';

interface ResultsModalProps {
  difficulty: Difficulty;
  score: number;
  best: number;
  isNewBest: boolean;
  stars: 1 | 2 | 3;
  moves: number;
  seconds: number;
  onPlayAgain: () => void;
  onNextDifficulty: () => void;
  onShare: () => void;
}

function StarRow({ count }: { count: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-1 text-3xl">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`transition ${
            i <= count ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-neutral-700'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ResultsModal({
  difficulty,
  score,
  best,
  isNewBest,
  stars,
  moves,
  seconds,
  onPlayAgain,
  onNextDifficulty,
  onShare,
}: ResultsModalProps) {
  const nextIdx = DIFFICULTY_ORDER.indexOf(difficulty) + 1;
  const hasNext = nextIdx < DIFFICULTY_ORDER.length;
  const nextLabel = hasNext ? DIFFICULTIES[DIFFICULTY_ORDER[nextIdx]].label : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4">
      <div
        className={`${styles.modalIn} pointer-events-auto w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-neutral-900/95 p-6 text-center shadow-2xl backdrop-blur`}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">You won</p>
        <h2 className="mt-1 text-3xl font-extrabold text-white">🎉 Match Cleared</h2>

        <div className="my-5">
          <StarRow count={stars} />
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-neutral-800/60 p-3 text-center text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">Moves</p>
            <p className="font-bold text-white">{moves}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">Time</p>
            <p className="font-bold text-white">{seconds}s</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">Score</p>
            <p className="font-bold text-emerald-400">{score}</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-neutral-400">
          Best on {DIFFICULTIES[difficulty].label}:{' '}
          <span className="font-bold text-yellow-400">{best}</span>
          {isNewBest && (
            <span className="ml-2 inline-block rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-900">
              New record
            </span>
          )}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-neutral-950 transition hover:bg-emerald-400"
          >
            Play again
          </button>
          {hasNext && (
            <button
              type="button"
              onClick={onNextDifficulty}
              className="rounded-lg border border-emerald-400 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/10"
            >
              Try {nextLabel} →
            </button>
          )}
          <button
            type="button"
            onClick={onShare}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-800"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
