'use client';

interface StatsProps {
  moves: number;
  seconds: number;
  score: number;
}

function formatTime(s: number): string {
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, '0')}`;
}

export default function Stats({ moves, seconds, score }: StatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-neutral-800 bg-neutral-900/70 p-3 text-center">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-neutral-500">Moves</p>
        <p className="text-xl font-bold text-white">{moves}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-neutral-500">Time</p>
        <p className="text-xl font-bold text-white tabular-nums">{formatTime(seconds)}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-neutral-500">Score</p>
        <p className="text-xl font-bold text-emerald-400 tabular-nums">{score}</p>
      </div>
    </div>
  );
}
