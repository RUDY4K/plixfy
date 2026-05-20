'use client';

import { useEffect, useState } from 'react';
import { onAwarded, type Badge } from '@/lib/achievements';

interface Toast {
  id: number;
  badge: Badge;
}

const TOAST_LIFE_MS = 4500;

/**
 * Listens for `plixfy:achievement` events and stacks toast notifications
 * in the bottom-right corner. Each toast auto-dismisses after 4.5s and
 * the user can dismiss with a click. Mounted once at the app root.
 */
export default function AchievementToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let counter = 0;
    return onAwarded((badges) => {
      setToasts((prev) => {
        const next = [...prev];
        for (const badge of badges) {
          counter += 1;
          next.push({ id: counter, badge });
        }
        return next;
      });
    });
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, TOAST_LIFE_MS);
    return () => clearTimeout(t);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          className="pointer-events-auto group flex items-center gap-3 overflow-hidden rounded-xl border border-emerald-400/60 bg-neutral-900/95 px-4 py-3 text-left shadow-xl backdrop-blur transition hover:border-emerald-300 animate-toast"
        >
          <span aria-hidden="true" className="text-3xl">{t.badge.emoji}</span>
          <span className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
              Achievement unlocked
            </span>
            <span className="text-sm font-bold text-white">{t.badge.title}</span>
            <span className="text-xs text-neutral-400">{t.badge.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
