'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GlobalLeaderboardResult, GlobalScoreEntry } from '@/lib/leaderboard-server';

type Tab = 'weekly' | 'allTime';

interface Props {
  slug: string;
  unit?: string;
  data: GlobalLeaderboardResult;
}

/**
 * Server-rendered global leaderboard with weekly + all-time tabs.
 *
 * The data prop is hydrated from the server at page render time. Tab
 * switching is purely client-side — no extra fetch — because we serve
 * both slices in the initial payload. Cheap on bandwidth (~200 rows
 * total) and dramatically faster than a re-fetch on every tab click.
 */
export default function GlobalLeaderboard({ slug: _slug, unit = 'pts', data }: Props) {
  const [tab, setTab] = useState<Tab>('allTime');
  const rows = tab === 'weekly' ? data.weekly : data.allTime;

  return (
    <section
      aria-label="Global leaderboard"
      className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
          <span aria-hidden="true">🏆</span> Global Leaderboard
        </h3>
        <div role="tablist" className="flex gap-1 rounded-md bg-neutral-950 p-1 text-xs">
          <TabBtn active={tab === 'allTime'} onClick={() => setTab('allTime')} label="All-time" />
          <TabBtn active={tab === 'weekly'} onClick={() => setTab('weekly')} label="This week" />
        </div>
      </header>

      {data.myRank != null ? (
        <p className="mb-3 rounded-md border border-cyan-500/30 bg-cyan-500/5 px-3 py-1.5 text-xs text-cyan-200">
          Your rank: <span className="font-bold">#{data.myRank}</span>
          {data.myBest != null && (
            <>
              {' '}
              · best <span className="font-bold">{data.myBest.toLocaleString()}</span> {unit}
            </>
          )}
        </p>
      ) : data.myBest != null ? (
        <p className="mb-3 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-400">
          Your best: <span className="font-bold text-white">{data.myBest.toLocaleString()}</span> {unit} — outside the top 100.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-800 bg-neutral-950 p-4 text-center text-xs text-neutral-500">
          No scores {tab === 'weekly' ? 'this week' : 'yet'} — be the first!
        </p>
      ) : (
        <ol className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
          {rows.map((entry) => (
            <Row key={`${tab}-${entry.userId}`} entry={entry} unit={unit} />
          ))}
        </ol>
      )}
    </section>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={active}
      onClick={onClick}
      className={`rounded px-2 py-0.5 font-semibold transition ${
        active ? 'bg-cyan-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function Row({ entry, unit }: { entry: GlobalScoreEntry; unit: string }) {
  const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
  return (
    <li className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-neutral-800/60">
      <span className="w-7 text-center text-xs font-bold text-neutral-400">
        {medal ?? `#${entry.rank}`}
      </span>
      {entry.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.avatarUrl}
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 rounded-full object-cover ring-1 ring-neutral-700"
          loading="lazy"
        />
      ) : (
        <span className="grid h-5 w-5 place-items-center rounded-full bg-neutral-800 text-[10px] font-bold uppercase text-neutral-300">
          {entry.username.slice(0, 1)}
        </span>
      )}
      <Link
        href={`/profile/${encodeURIComponent(entry.username)}`}
        className="flex-1 truncate font-semibold text-white hover:underline"
      >
        {entry.username}
      </Link>
      <span className="text-sm font-bold tabular-nums text-cyan-300">
        {entry.score.toLocaleString()}{' '}
        <span className="text-[10px] font-normal text-neutral-500">{unit}</span>
      </span>
    </li>
  );
}
