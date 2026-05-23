'use client';

import { useEffect, useRef, useState } from 'react';
import { recordVisit, useStreak } from '@/lib/userStateClient';
import { evaluate, getSessionPlays } from '@/lib/achievements';

/**
 * Tiny streak chip for the header. Renders only after first mount so it
 * doesn't flash on the SSR pass; calls recordVisit() once per mount to
 * advance/preserve the streak.
 *
 * Color follows the research-backed palette: orange (#FF6B35, accent-warning)
 * — pairs with the 🔥 emoji for an FOMO/streak association and reads as
 * "don't lose this" at a glance.
 * On count increment we replay the flip animation by keying the digit.
 */
export default function StreakWidget() {
  const [mounted, setMounted] = useState(false);
  const streak = useStreak();
  const prevCount = useRef<number | null>(null);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    recordVisit();
    evaluate({ sessionPlays: getSessionPlays() });
    setMounted(true);
  }, []);

  // When the count changes after first hydration, bump flipKey to remount
  // the digit and replay the streak-flip keyframe.
  useEffect(() => {
    if (prevCount.current !== null && prevCount.current !== streak.count) {
      setFlipKey((k) => k + 1);
    }
    prevCount.current = streak.count;
  }, [streak.count]);

  if (!mounted || streak.count === 0) return null;

  const tooltip = streak.count === 1 ? 'Day 1 — come back tomorrow!' : `${streak.count} day streak`;

  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold"
      style={{
        background: 'color-mix(in srgb, var(--accent-warning) 14%, transparent)',
        borderColor: 'color-mix(in srgb, var(--accent-warning) 40%, transparent)',
        color: 'var(--accent-warning)',
      }}
    >
      <span aria-hidden="true">🔥</span>
      <span key={flipKey} className={flipKey > 0 ? 'streak-flip' : undefined}>
        {streak.count}
      </span>
    </span>
  );
}
