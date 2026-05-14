'use client';

import styles from '../puzzle-2048.module.css';

type OverlayKind = 'won' | 'over';

interface ResultsOverlayProps {
  kind: OverlayKind;
  score: number;
  best: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onContinue?: () => void;
  onShare: () => void;
}

export default function ResultsOverlay({
  kind,
  score,
  best,
  isNewBest,
  onPlayAgain,
  onContinue,
  onShare,
}: ResultsOverlayProps) {
  const isWin = kind === 'won';
  const title = isWin ? '🎉 You hit 2048!' : 'Game Over';
  const subtitle = isWin
    ? 'Keep going to chase 4096, or start fresh.'
    : 'No moves left. Hit New Game to try again.';

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-4">
      <div
        className={`${styles.overlayIn} pointer-events-auto w-full max-w-sm rounded-2xl border ${
          isWin ? 'border-yellow-300/60' : 'border-red-500/40'
        } bg-neutral-900/95 p-6 text-center shadow-2xl backdrop-blur`}
      >
        <p
          className={`text-xs uppercase tracking-[0.2em] ${
            isWin ? 'text-yellow-300' : 'text-red-400'
          }`}
        >
          {isWin ? 'Victory' : 'Run ended'}
        </p>
        <h2 className="mt-1 text-2xl font-extrabold text-white">{title}</h2>
        <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-neutral-800/60 p-3 text-center">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">Score</p>
            <p className="text-xl font-bold text-white">{score.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">Best</p>
            <p className="text-xl font-bold text-yellow-400">{best.toLocaleString()}</p>
          </div>
        </div>

        {isNewBest && (
          <p className="mt-3 inline-block rounded-full bg-yellow-400 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-900">
            New record
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {isWin && onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-neutral-900 transition hover:bg-yellow-300"
            >
              Keep playing →
            </button>
          )}
          <button
            type="button"
            onClick={onPlayAgain}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
              isWin
                ? 'border border-yellow-300 text-yellow-200 hover:bg-yellow-300/10'
                : 'bg-amber-500 text-neutral-950 hover:bg-amber-400'
            }`}
          >
            New game
          </button>
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
