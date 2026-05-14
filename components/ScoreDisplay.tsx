interface ScoreDisplayProps {
  current: number;
  best: number;
}

export default function ScoreDisplay({ current, best }: ScoreDisplayProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-neutral-900 px-4 py-2 text-sm">
      <span className="text-neutral-400">
        Score <strong className="text-white">{current.toLocaleString()}</strong>
      </span>
      <span className="text-neutral-400">
        Best <strong className="text-emerald-400">{best.toLocaleString()}</strong>
      </span>
    </div>
  );
}
