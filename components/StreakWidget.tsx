'use client';

import { useEffect, useState } from 'react';
import { recordVisit, useStreak } from '@/lib/userStateClient';

/**
 * Tiny streak chip for the header. Renders only after first mount so it
 * doesn't flash on the SSR pass; calls recordVisit() once per mount to
 * advance/preserve the streak.
 */
export default function StreakWidget() {
  const [mounted, setMounted] = useState(false);
  const streak = useStreak();

  useEffect(() => {
    recordVisit();
    setMounted(true);
  }, []);

  if (!mounted || streak.count === 0) return null;

  const tooltip = streak.count === 1 ? 'Day 1 — come back tomorrow!' : `${streak.count} day streak`;

  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-300"
    >
      <span aria-hidden="true">🔥</span>
      {streak.count}
    </span>
  );
}
