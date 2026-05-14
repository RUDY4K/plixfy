'use client';

interface ControlsProps {
  onNewGame: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export default function Controls({ onNewGame, onUndo, canUndo }: ControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-semibold text-neutral-200 transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ↶ Undo
      </button>
      <button
        type="button"
        onClick={onNewGame}
        className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-neutral-950 transition hover:bg-amber-400"
      >
        New game
      </button>
    </div>
  );
}
