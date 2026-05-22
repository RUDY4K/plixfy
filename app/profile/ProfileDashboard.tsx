'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { UserProfile } from '@clerk/nextjs';
import { formatPlayTime, usePlayTimeMs } from '@/lib/profile';
import { BADGES, useEarned, type Badge, type EarnedBadge } from '@/lib/achievements';
import { useFavorites, useRecent, useStreak } from '@/lib/userStateClient';
import { LIGHT_GAMES } from '@/games/registry';
import type { LightGameMeta } from '@/types/game';
import GameCard from '@/components/GameCard';
import type { PublicProfileData } from '@/lib/profile-server';

interface ProfileDashboardProps {
  displayName: string;
  avatarUrl: string | null;
  memberSinceIso: string;
  publicUsername: string | null;
  serverProfile: PublicProfileData | null;
}

/**
 * Authenticated /profile dashboard. Identity (avatar, display name,
 * member-since) comes from Clerk via server-side props. Local stats
 * (play time, streak, achievements, favorites, recent) come from
 * localStorage hooks. When Supabase is configured we layer in the
 * server-side slice (top scores, activity feed, games-played count)
 * so the numbers stay consistent across devices.
 *
 * "Edit profile" toggles Clerk's `<UserProfile>` panel inline — that's
 * where the user manages email, password, connected accounts, name,
 * username, and avatar.
 */
export default function ProfileDashboard({
  displayName,
  avatarUrl,
  memberSinceIso,
  publicUsername,
  serverProfile,
}: ProfileDashboardProps) {
  const earned = useEarned();
  const favorites = useFavorites();
  const recent = useRecent();
  const playMs = usePlayTimeMs();
  const streak = useStreak();
  const [editing, setEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const localStats = useMemo(() => computeLocalStats(favorites, recent), [favorites, recent]);
  const favGames = useMemo(() => bySlug(LIGHT_GAMES, favorites).slice(0, 8), [favorites]);
  const recentGames = useMemo(() => recentWithMeta(recent, LIGHT_GAMES).slice(0, 10), [recent]);

  // Prefer the server-side games-played when available — it counts unique
  // games with at least one submitted score, which is more authoritative
  // than localStorage which only knows what *this* device has seen.
  const gamesPlayed = serverProfile?.gamesPlayed ?? localStats.gamesPlayed;
  const topScores = serverProfile?.topScores ?? [];

  if (!mounted) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-neutral-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* ─── Header card ──────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-neutral-950 shadow-lg ring-2 ring-cyan-500/40 sm:h-28 sm:w-28">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-4xl font-extrabold uppercase text-neutral-300">
                {displayName.slice(0, 1)}
              </span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Player profile</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {displayName}
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              Member since {new Date(memberSinceIso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-semibold text-neutral-200 transition hover:border-cyan-500/60 hover:text-white"
              >
                {editing ? 'Close editor' : 'Edit profile'}
              </button>
              {publicUsername && (
                <Link
                  href={`/profile/${encodeURIComponent(publicUsername)}`}
                  className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-semibold text-neutral-200 transition hover:border-cyan-500/60 hover:text-white"
                >
                  View public profile →
                </Link>
              )}
              <Link
                href="/favorites"
                className="rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold text-neutral-950 transition hover:bg-cyan-400"
              >
                My favorites
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Inline Clerk UserProfile panel (Edit profile) ────────────── */}
      {editing && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
          <UserProfile
            appearance={{
              variables: clerkPlixfyVariables,
              elements: clerkPlixfyElements,
            }}
            routing="hash"
          />
        </section>
      )}

      {/* ─── Stats grid ───────────────────────────────────────────────── */}
      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Games played" value={String(gamesPlayed)} icon="🎮" />
        <Stat label="Play time" value={formatPlayTime(playMs)} icon="⏱️" />
        <Stat label="Day streak" value={`${streak.count}d`} icon="🔥" />
        <Stat label="Achievements" value={`${earned.length}/${BADGES.length}`} icon="⭐" />
      </section>

      {/* ─── Achievements grid ────────────────────────────────────────── */}
      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Achievements</h2>
          <AchievementProgress earned={earned.length} total={BADGES.length} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BADGES.map((b) => {
            const got = earned.find((e) => e.id === b.id);
            return <BadgeCard key={b.id} badge={b} earned={got} />;
          })}
        </div>
      </section>

      {/* ─── Favorites grid ───────────────────────────────────────────── */}
      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Favorites</h2>
          {favorites.length > 0 && (
            <Link href="/favorites" className="text-xs font-semibold text-neutral-400 hover:text-white">
              See all →
            </Link>
          )}
        </div>
        {favGames.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-8 text-center text-sm text-neutral-500">
            No favorites yet — tap the ♥ on any game to save it here.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {favGames.map((g) => (
              <GameCard key={g.slug} game={g} />
            ))}
          </div>
        )}
      </section>

      {/* ─── Recent activity ─────────────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold tracking-tight sm:text-2xl">Recent activity</h2>
        {recentGames.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-6 text-center text-sm text-neutral-500">
            Play a game and it&apos;ll show up here.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40">
            {recentGames.map((r) => (
              <li key={r.slug} className="flex items-center justify-between px-4 py-2 text-sm">
                <Link href={`/games/${r.slug}`} className="font-semibold text-white hover:text-cyan-300">
                  {r.title}
                </Link>
                <time className="shrink-0 text-xs text-neutral-500" dateTime={new Date(r.at).toISOString()}>
                  {timeAgo(r.at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── Leaderboard rankings (server-side per-game best) ────────── */}
      {topScores.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold tracking-tight sm:text-2xl">My best scores</h2>
          <ul className="divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40">
            {topScores.map((s) => {
              const game = LIGHT_GAMES.find((g) => g.slug === s.gameSlug);
              return (
                <li
                  key={s.gameSlug}
                  className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
                >
                  <Link
                    href={`/games/${s.gameSlug}`}
                    className="truncate font-semibold text-white hover:text-cyan-300"
                  >
                    {game?.title ?? s.gameSlug}
                  </Link>
                  <span className="shrink-0 font-bold tabular-nums text-cyan-300">
                    {s.score.toLocaleString()} pts
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ─────────────────────────── Sub-components ──────────────────────────── */

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3 sm:p-4">
      <span aria-hidden="true" className="text-2xl">{icon}</span>
      <span className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</span>
        <span className="text-lg font-bold text-white">{value}</span>
      </span>
    </div>
  );
}

function AchievementProgress({ earned, total }: { earned: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((100 * earned) / total);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-500">{earned} / {total}</span>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full bg-cyan-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BadgeCard({ badge, earned }: { badge: Badge; earned: EarnedBadge | undefined }) {
  const got = Boolean(earned);
  return (
    <div
      className={`relative flex flex-col items-center gap-1 rounded-xl border p-4 text-center transition ${
        got
          ? 'border-cyan-500/40 bg-cyan-500/5'
          : 'border-neutral-800 bg-neutral-900 opacity-60 grayscale'
      }`}
    >
      <span aria-hidden="true" className="text-4xl">{badge.emoji}</span>
      <span className="mt-1 text-sm font-bold text-white">{badge.title}</span>
      <span className="text-[11px] text-neutral-400">{badge.description}</span>
      {got && earned && (
        <span className="mt-1 text-[10px] uppercase tracking-wider text-cyan-400">
          Earned {new Date(earned.at).toLocaleDateString()}
        </span>
      )}
      {!got && (
        <span className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">Locked</span>
      )}
    </div>
  );
}

/* ─────────────────────────── Helpers ─────────────────────────────────── */

function computeLocalStats(favorites: string[], recent: { slug: string }[]) {
  const seen = new Set<string>();
  for (const r of recent) seen.add(r.slug);
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('plixfy:counts');
      const obj = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      for (const slug of Object.keys(obj)) seen.add(slug);
    } catch {
      // Ignore — stats degrade gracefully to recent-only.
    }
  }
  return {
    gamesPlayed: seen.size,
    favoritesCount: favorites.length,
  };
}

function bySlug(all: readonly LightGameMeta[], slugs: readonly string[]): LightGameMeta[] {
  const set = new Set(slugs);
  return all.filter((g) => set.has(g.slug));
}

function recentWithMeta(
  recent: { slug: string; at: number }[],
  all: readonly LightGameMeta[],
): { slug: string; title: string; at: number }[] {
  const meta = new Map(all.map((g) => [g.slug, g.title] as const));
  return recent
    .map((r) => ({ slug: r.slug, at: r.at, title: meta.get(r.slug) ?? r.slug }))
    .filter((r) => meta.has(r.slug));
}

function timeAgo(at: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

/* ─────────────────────────── Clerk theme (shared) ────────────────────── */

const clerkPlixfyVariables = {
  colorPrimary: '#00C8FF',
  colorBackground: '#0B0F1A',
  colorText: '#f5f5f5',
  colorTextSecondary: '#a3a3a3',
  colorInputBackground: '#171717',
  colorInputText: '#f5f5f5',
  borderRadius: '0.625rem',
};

const clerkPlixfyElements = {
  rootBox: 'w-full',
  card: 'bg-neutral-950 border border-neutral-800 shadow-none',
  headerTitle: 'text-white',
  headerSubtitle: 'text-neutral-400',
  navbar: 'bg-neutral-950 border-r border-neutral-800',
  navbarButton: 'text-neutral-300 hover:text-white',
  navbarButtonActive: 'text-cyan-300',
  profileSectionTitleText: 'text-white',
  profileSectionPrimaryButton: 'text-cyan-300 hover:text-cyan-200',
  formButtonPrimary: 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold',
  formButtonReset: 'text-neutral-400 hover:text-white',
  formFieldInput: 'bg-neutral-900 border border-neutral-700 text-white',
  formFieldLabel: 'text-neutral-300',
  badge: 'bg-cyan-500/15 text-cyan-300',
  socialButtonsBlockButton:
    'border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white',
  footerActionLink: 'text-cyan-400 hover:text-cyan-300',
  identityPreviewText: 'text-neutral-200',
  identityPreviewEditButton: 'text-cyan-300 hover:text-cyan-200',
};
