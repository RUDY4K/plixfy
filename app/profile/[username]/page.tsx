import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { findUserByUsername } from '@/lib/users';
import { getUserPublicProfile } from '@/lib/profile-server';
import { findGame } from '@/games/registry';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plixfy.example';

interface Params {
  username: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await findUserByUsername(decodeURIComponent(username)).catch(() => null);
  if (!user) return { title: 'Player not found', robots: { index: false, follow: false } };
  return {
    title: `${user.username} — Plixfy profile`,
    description: `${user.username}'s Plixfy gamer profile: scores, favorite games, achievements, and recent activity.`,
    alternates: { canonical: `/profile/${encodeURIComponent(user.username)}` },
    openGraph: {
      title: `${user.username} on Plixfy`,
      description: `${user.username}'s scores, favorites and activity on Plixfy.`,
      url: `${SITE_URL}/profile/${encodeURIComponent(user.username)}`,
      type: 'profile',
      images: user.avatar_url ? [{ url: user.avatar_url }] : ['/og-default.png'],
    },
  };
}

function formatJoined(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function timeAgo(iso: string): string {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

const VERB_LABEL: Record<string, string> = {
  scored: 'scored',
  commented: 'commented on',
  liked: 'liked',
  favorited: 'favorited',
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { username } = await params;
  const user = await findUserByUsername(decodeURIComponent(username)).catch(() => null);
  if (!user) notFound();

  const profile = await getUserPublicProfile(user.id).catch(() => null);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* ─── Hero card ──────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-4 rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 sm:flex-row sm:items-start">
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt=""
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover ring-2 ring-cyan-500/60"
          />
        ) : (
          <span className="grid h-24 w-24 place-items-center rounded-full bg-neutral-800 text-3xl font-extrabold uppercase text-neutral-300 ring-2 ring-cyan-500/60">
            {user.username.slice(0, 1)}
          </span>
        )}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-extrabold text-white">{user.username}</h1>
          <p className="text-sm text-neutral-500">Joined {formatJoined(user.created_at)}</p>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center sm:max-w-md">
            <Stat label="Games played" value={profile.gamesPlayed} />
            <Stat label="Best scores" value={profile.bestScoresCount} />
            <Stat label="Comments" value={profile.commentsCount} />
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* ─── Favorites ──────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-400">
            ♥ Favorite games
          </h2>
          {profile.favorites.length === 0 ? (
            <p className="rounded-md border border-dashed border-neutral-800 bg-neutral-950 p-4 text-center text-xs text-neutral-500">
              No favorites yet.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {profile.favorites.map((slug) => {
                const game = findGame(slug);
                if (!game) return null;
                return (
                  <li key={slug}>
                    <Link
                      href={`/games/${slug}`}
                      className="block rounded-lg border border-neutral-800 bg-neutral-900 p-2 transition hover:border-cyan-500/60"
                    >
                      <div
                        className="aspect-video rounded-md bg-neutral-800"
                        style={{ background: `${game.color}22` }}
                      />
                      <p className="mt-1.5 line-clamp-1 text-xs font-semibold text-white">
                        {game.title}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ─── Recent activity ────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-400">
            ⏱ Recent activity
          </h2>
          {profile.activity.length === 0 ? (
            <p className="rounded-md border border-dashed border-neutral-800 bg-neutral-950 p-4 text-center text-xs text-neutral-500">
              No activity yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {profile.activity.map((a) => {
                const game = findGame(a.gameSlug);
                if (!game) return null;
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-neutral-900/60 px-3 py-2 text-xs"
                  >
                    <span className="text-neutral-300">
                      {VERB_LABEL[a.verb] ?? a.verb}{' '}
                      <Link
                        href={`/games/${a.gameSlug}`}
                        className="font-semibold text-cyan-300 hover:underline"
                      >
                        {game.title}
                      </Link>
                      {a.verb === 'scored' && a.payload && typeof a.payload === 'object' && 'score' in a.payload && (
                        <span className="ml-1 text-neutral-500">
                          ({(a.payload as { score?: number }).score?.toLocaleString()} pts)
                        </span>
                      )}
                    </span>
                    <time className="shrink-0 text-neutral-500" dateTime={a.createdAt}>
                      {timeAgo(a.createdAt)}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ─── Top scores table ──────────────────────────────────────────── */}
      {profile.topScores.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-400">
            🏆 Best scores
          </h2>
          <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800 bg-neutral-900/40">
            {profile.topScores.map((s) => {
              const game = findGame(s.gameSlug);
              if (!game) return null;
              return (
                <li key={s.gameSlug} className="flex items-center justify-between px-3 py-2 text-sm">
                  <Link href={`/games/${s.gameSlug}`} className="font-semibold text-white hover:underline">
                    {game.title}
                  </Link>
                  <span className="font-bold tabular-nums text-cyan-300">
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xl font-extrabold tabular-nums text-white">{value.toLocaleString()}</div>
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
    </div>
  );
}
