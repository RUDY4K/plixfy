'use client';

import { useEffect, useState } from 'react';
import styles from '../puzzle-2048.module.css';

interface ScoreBoardProps {
  score: number;
  best: number;
  lastGain: number;
  /** Key that changes whenever a gain animation should re-trigger. */
  gainKey: number;
}

export default function ScoreBoard({ score, best, lastGain, gainKey }: ScoreBoardProps) {
  const [popup, setPopup] = useState<number | null>(null);

  useEffect(() => {
    if (lastGain <= 0) return;
    setPopup(lastGain);
    const t = window.setTimeout(() => setPopup(null), 900);
    return () => window.clearTimeout(t);
  }, [gainKey, lastGain]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="relative rounded-xl border border-neutral-800 bg-neutral-900/70 p-3 text-center">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500">Score</p>
        <p className="text-2xl font-extrabold tabular-nums text-white">{score.toLocaleString()}</p>
        {popup !== null && (
          <span key={gainKey} className={styles.scoreFloat}>+{popup}</span>
        )}
      </div>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-3 text-center">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500">Best</p>
        <p className="text-2xl font-extrabold tabular-nums text-yellow-400">
          {best.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
