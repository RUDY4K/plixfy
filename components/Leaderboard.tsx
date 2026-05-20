'use client';

import { useEffect, useState } from 'react';
import { useLeaderboard, type ScoreEntry } from '@/lib/leaderboard';
import { useProfile } from '@/lib/profile';
import ProfileSetupModal from './ProfileSetupModal';

interface LeaderboardProps {
  slug: string;
  /** Optional unit label (e.g. "pts", "moves", "s"). Default: "pts". */
  unit?: string;
  /**
   * For lower-better games (timed runs, fewest moves) flip the visual cue.
   * Pure cosmetic — actual ranking is decided by submitScore at write time.
   */
  direction?: 'higher-better' | 'lower-better';
}

/**
 * Top-10 leaderboard for a game. Shows the rank, avatar, nickname and
 * score; rows belonging to the current player are highlighted. Renders a
 * "Sign in to claim" CTA when no profile exists so the user knows their
 * next score will be anonymous unless they set up a profile.
 */
export default function Leaderboard({ slug, unit = 'pts', direction = 'higher-better' }: LeaderboardProps) {
  const entries = useLeaderboard(slug);
  const profile = useProfile();
  const [mounted, setMounted] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-500">
        Loading leaderboard…
      </div>
    );
  }

  const ranked = entries; // Already sorted on write.
  const topScore = ranked[0]?.score;
  const cta = formatBeatCta(topScore, direction);

  return (
    <section
      aria-label="Top scores"
      className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
          <span aria-hidden="true">🏆</span> Leaderboard
        </h3>
        {!profile && (
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Sign in to claim →
          </button>
        )}
      </header>

      {ranked.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-800 bg-neutral-950 p-4 text-center text-xs text-neutral-500">
          No scores yet — be the first!
        </p>
      ) : (
        <ol className="space-y-1.5">
          {ranked.map((entry, i) => (
            <Row
              key={`${entry.at}-${i}`}
              rank={i + 1}
              entry={entry}
              unit={unit}
              isMine={isMine(entry, profile?.nickname)}
            />
          ))}
        </ol>
      )}

      {topScore != null && (
        <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
          {cta}
        </p>
      )}

      <ProfileSetupModal open={setupOpen} onClose={() => setSetupOpen(false)} />
    </section>
  );
}

function Row({ rank, entry, unit, isMine }: { rank: number; entry: ScoreEntry; unit: string; isMine: boolean }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
  return (
    <li
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
        isMine
          ? 'bg-emerald-500/15 ring-1 ring-emerald-500/40'
          : 'hover:bg-neutral-800/60'
      }`}
    >
      <span className="w-6 text-center text-xs font-bold text-neutral-400">
        {medal ?? `#${rank}`}
      </span>
      <span aria-hidden="true" className="text-base leading-none">{entry.avatar || '👾'}</span>
      <span className="flex-1 truncate font-semibold text-white">
        {entry.nickname}
        {isMine && <span className="ml-1 text-[10px] text-emerald-400">(you)</span>}
      </span>
      <span className="text-sm font-bold tabular-nums text-emerald-300">
        {entry.score.toLocaleString()} <span className="text-[10px] font-normal text-neutral-500">{unit}</span>
      </span>
    </li>
  );
}

function isMine(entry: ScoreEntry, nickname: string | undefined): boolean {
  if (!nickname) return false;
  return entry.nickname === nickname;
}

function formatBeatCta(top: number | undefined, direction: 'higher-better' | 'lower-better'): string {
  if (top == null) return '';
  return direction === 'lower-better'
    ? `Beat the record: under ${top.toLocaleString()}!`
    : `Beat the high score: ${top.toLocaleString()}!`;
}
