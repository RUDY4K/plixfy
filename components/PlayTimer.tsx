'use client';

import { useEffect, useRef } from 'react';
import { addPlayMs } from '@/lib/profile';
import { evaluate, getSessionPlays, recordSessionPlay } from '@/lib/achievements';

interface PlayTimerProps {
  slug: string;
}

/**
 * Tracks elapsed ms while a game-detail page is visible and flushes to
 * the profile's totalPlayMs counter on hide / unmount.
 *
 * - Counts only when the tab is visible (`document.visibilityState`).
 * - Flushes on `visibilitychange` + `pagehide` so we don't lose time on
 *   navigation away — a finally block on unmount catches the rest.
 * - Also records this slug into the per-tab session set, then fires the
 *   achievement evaluator (which may trigger the Speed Demon badge).
 */
export default function PlayTimer({ slug }: PlayTimerProps) {
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    recordSessionPlay(slug);
    evaluate({ sessionPlays: getSessionPlays() });

    function startCounting() {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      startRef.current = Date.now();
    }
    function flush() {
      if (startRef.current == null) return;
      const elapsed = Date.now() - startRef.current;
      startRef.current = null;
      addPlayMs(elapsed);
    }
    function onVis() {
      if (document.visibilityState === 'visible') startCounting();
      else flush();
    }

    startCounting();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [slug]);

  return null;
}
