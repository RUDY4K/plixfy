'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LIGHT_GAMES } from '@/games/registry';
import type { ActivityItem } from '@/lib/activity-server';

const POLL_MS = 15_000;

const titleBySlug = new Map(LIGHT_GAMES.map((g) => [g.slug, g.title] as const));

function timeAgo(iso: string): string {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

function describe(item: ActivityItem): { verbText: string; suffix: string | null } {
  switch (item.verb) {
    case 'scored': {
      const score = (item.payload as { score?: number } | null)?.score;
      return {
        verbText: 'scored',
        suffix: score != null ? `${score.toLocaleString()} pts in` : 'in',
      };
    }
    case 'commented':
      return { verbText: 'commented on', suffix: null };
    case 'liked':
      return { verbText: 'liked', suffix: null };
    case 'favorited':
      return { verbText: 'favorited', suffix: null };
    default:
      return { verbText: item.verb, suffix: null };
  }
}

interface Props {
  initialItems: ActivityItem[];
}

/**
 * "🔥 Recent Activity" feed. Renders the server-fetched initial list on
 * first paint, then polls /api/activity every 15s for incremental
 * updates. Polling is paused when the tab is hidden via Page Visibility
 * API to avoid burning requests on background tabs.
 */
export default function ActivityFeed({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      if (document.hidden) {
        timer = setTimeout(poll, POLL_MS);
        return;
      }
      try {
        const res = await fetch('/api/activity?limit=20', { cache: 'no-store' });
        if (!cancelled && res.ok) {
          const json = (await res.json()) as { items?: ActivityItem[] };
          if (Array.isArray(json.items)) setItems(json.items);
        }
      } catch {
        // Network blip — ignore and let the next tick retry.
      } finally {
        if (!cancelled) timer = setTimeout(poll, POLL_MS);
      }
    }

    timer = setTimeout(poll, POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (items.length === 0) {
    return null; // Hide section entirely until there's any activity.
  }

  return (
    <section className="mt-12">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight">
        <span aria-hidden="true">🔥</span> Recent activity
      </h2>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {items.map((item) => {
          const title = titleBySlug.get(item.gameSlug) ?? item.gameSlug;
          const { verbText, suffix } = describe(item);
          return (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-neutral-800/60 bg-neutral-900/50 px-3 py-2 text-xs"
            >
              {item.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.avatarUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-neutral-700"
                  loading="lazy"
                />
              ) : (
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-neutral-800 text-[10px] font-bold uppercase text-neutral-300">
                  {item.username.slice(0, 1)}
                </span>
              )}
              <span className="flex-1 truncate text-neutral-300">
                <Link
                  href={`/profile/${encodeURIComponent(item.username)}`}
                  className="font-semibold text-white hover:underline"
                >
                  {item.username}
                </Link>{' '}
                {verbText} {suffix && <span>{suffix}</span>}{' '}
                <Link
                  href={`/games/${item.gameSlug}`}
                  className="font-semibold text-cyan-300 hover:underline"
                >
                  {title}
                </Link>
              </span>
              <time className="shrink-0 text-neutral-500" dateTime={item.createdAt}>
                {timeAgo(item.createdAt)}
              </time>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
