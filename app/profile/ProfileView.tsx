'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  clearProfile,
  formatPlayTime,
  usePlayTimeMs,
  useProfile,
  type Profile,
} from '@/lib/profile';
import { BADGES, useEarned, type Badge, type EarnedBadge } from '@/lib/achievements';
import { useFavorites, useRecent, useStreak } from '@/lib/userStateClient';
import { LIGHT_GAMES } from '@/games/registry';
import type { LightGameMeta } from '@/types/game';
import GameCard from '@/components/GameCard';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import { share } from '@/lib/share';

/**
 * Client-side profile dashboard. Aggregates all the localStorage state
 * the user has built up so they see one screen with everything that's
 * "theirs" — avatar, badges, streak, play time, favorites.
 *
 * Empty state ("no profile yet") guides into the setup modal.
 */
export default function ProfileView() {
  const profile = useProfile();
  const earned = useEarned();
  const favorites = useFavorites();
  const recent = useRecent();
  const playMs = usePlayTimeMs();
  const streak = useStreak();
  const [editing, setEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = useMemo(() => computeStats(favorites, recent), [favorites, recent]);
  const favGames = useMemo(() => bySlug(LIGHT_GAMES, favorites).slice(0, 8), [favorites]);

  async function handleShare() {
    if (!profile) return;
    const url = typeof window !== 'undefined' ? window.location.origin + '/profile' : '/profile';
    const result = await share({
      title: `${profile.nickname} on Plixfy`,
      text: `${profile.avatar} I’m ${profile.nickname} on Plixfy — ${stats.gamesPlayed} games played, ${earned.length} badges. Beat my stats!`,
      url,
    });
    if (result === 'copied') setShareToast('Profile link copied');
    else if (result === 'failed') setShareToast('Share unavailable');
    else setShareToast(null);
    if (result !== 'native') setTimeout(() => setShareToast(null), 2200);
  }

  if (!mounted) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-neutral-500">Loading…</div>;
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
          <div className="text-5xl">👋</div>
          <h1 className="mt-4 text-2xl font-bold">No profile yet</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Pick a nickname and an avatar to start tracking your stats, badges, and high scores. Saved on this device only — no signup.
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-6 inline-flex rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400"
          >
            Let’s set it up →
          </button>
        </div>
        <ProfileSetupModal open={editing} onClose={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header card */}
      <section className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div
            aria-hidden="true"
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-5xl shadow-lg ring-2 ring-emerald-500/40 sm:h-28 sm:w-28"
          >
            {profile.avatar}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Player profile</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {profile.nickname}
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              Joined {new Date(profile.createdAt).toLocaleDateString()}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-semibold text-neutral-200 transition hover:border-emerald-500/60 hover:text-white"
              >
                Edit profile
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-neutral-950 transition hover:bg-emerald-400"
              >
                Share my profile
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.confirm('Reset your profile? This clears your nickname and avatar.')) {
                    clearProfile();
                  }
                }}
                className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
              >
                Reset
              </button>
            </div>
            {shareToast && (
              <p className="mt-2 text-xs text-emerald-400">{shareToast}</p>
            )}
          </div>
        </div>
      </section>

      {/* Stats grid */}
      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Games played" value={String(stats.totalPlays)} icon="🎮" />
        <Stat label="Different games" value={String(stats.gamesPlayed)} icon="🌟" />
        <Stat label="Play time" value={formatPlayTime(playMs)} icon="⏱️" />
        <Stat label="Day streak" value={`${streak.count}d`} icon="🔥" />
      </section>

      {/* Achievements */}
      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Achievements</h2>
          <span className="text-xs text-neutral-500">{earned.length} / {BADGES.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BADGES.map((b) => {
            const got = earned.find((e) => e.id === b.id);
            return <BadgeCard key={b.id} badge={b} earned={got} />;
          })}
        </div>
      </section>

      {/* Favorites */}
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

      <ProfileSetupModal
        open={editing}
        initial={profile}
        onClose={() => setEditing(false)}
      />
    </div>
  );
}

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

function BadgeCard({ badge, earned }: { badge: Badge; earned: EarnedBadge | undefined }) {
  const got = Boolean(earned);
  return (
    <div
      className={`relative flex flex-col items-center gap-1 rounded-xl border p-4 text-center transition ${
        got
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-neutral-800 bg-neutral-900 opacity-60 grayscale'
      }`}
    >
      <span aria-hidden="true" className="text-4xl">{badge.emoji}</span>
      <span className="mt-1 text-sm font-bold text-white">{badge.title}</span>
      <span className="text-[11px] text-neutral-400">{badge.description}</span>
      {got && earned && (
        <span className="mt-1 text-[10px] uppercase tracking-wider text-emerald-400">
          Earned {new Date(earned.at).toLocaleDateString()}
        </span>
      )}
      {!got && (
        <span className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">Locked</span>
      )}
    </div>
  );
}

function computeStats(favorites: string[], recent: { slug: string }[]) {
  const seen = new Set<string>();
  for (const r of recent) seen.add(r.slug);
  let totalPlays = 0;
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('plixfy:counts');
      const obj = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      for (const slug of Object.keys(obj)) {
        seen.add(slug);
        totalPlays += obj[slug] ?? 0;
      }
    } catch {
      // Ignore — stats degrade gracefully to recent-only.
    }
  }
  return {
    gamesPlayed: seen.size,
    totalPlays,
    favoritesCount: favorites.length,
  };
}

function bySlug(all: readonly LightGameMeta[], slugs: readonly string[]): LightGameMeta[] {
  const set = new Set(slugs);
  return all.filter((g) => set.has(g.slug));
}
