import {
  LIGHT_GAMES,
  customGames,
  ioMultiplayerGames,
  liveGames,
  recentlyAddedGames,
  trendingGames,
} from '@/games/registry';
import HomeGrid from '@/components/HomeGrid';
import GameRow from '@/components/GameRow';
import CategoryCards from '@/components/CategoryCards';
import DailyFeatured from '@/components/DailyFeatured';
import RecentlyPlayedRow from '@/components/RecentlyPlayedRow';
import ActivityFeed from '@/components/ActivityFeed';
import { getRecentActivity } from '@/lib/activity-server';

const FEATURES = [
  { icon: '⚡', title: 'No downloads', body: 'Plays instantly in your browser.' },
  { icon: '🆓', title: '100% free', body: 'No accounts, no paywalls.' },
  { icon: '📱', title: 'Mobile friendly', body: 'Touch controls on every game.' },
  { icon: '🆕', title: 'New games weekly', body: 'Fresh additions all the time.' },
];

/**
 * Round the live count down to the nearest "headline-friendly" tier so
 * the hero always advertises a confident, slightly conservative number
 * (e.g. 3,224 → "3,000+", 2,150 → "2,000+"). Beats a moving precise
 * count for SEO snippets and avoids overpromising.
 */
function heroCountLabel(n: number): string {
  if (n >= 5000) return '5,000+';
  if (n >= 3000) return '3,000+';
  if (n >= 2000) return '2,000+';
  if (n >= 1000) return '1,000+';
  if (n >= 500) return '500+';
  return `${n}+`;
}

export default async function Home() {
  const liveCount = liveGames().length;
  const heroLabel = heroCountLabel(liveCount);
  const trending = trendingGames();
  const originals = customGames().filter((g) => g.status === 'live');
  const recent = recentlyAddedGames(12);
  const ioRow = ioMultiplayerGames(20);
  const activity = await getRecentActivity(20).catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-8 sm:p-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(800px 300px at 20% 10%, #4ade8033, transparent), radial-gradient(600px 300px at 80% 90%, #60a5fa22, transparent)',
          }}
        />
        <div className="relative">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Plixfy</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            {heroLabel} Free Browser Games
            <span className="block text-neutral-400">No Download Required</span>
          </h1>
          <p className="mt-4 max-w-xl text-neutral-400">
            {liveCount.toLocaleString()} games across 19 categories — puzzle, racing, shooting, .io multiplayer, action, sports, adventure, stickman, zombie, cooking and more. Plays instantly on any device.
          </p>
          <a
            href="#games"
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400"
          >
            Play now →
          </a>
        </div>
      </section>

      <ActivityFeed initialItems={activity} />

      <DailyFeatured games={LIGHT_GAMES} />

      <RecentlyPlayedRow allGames={LIGHT_GAMES} />

      <GameRow
        title="Trending"
        icon="🔥"
        subtitle="Most-played picks across the catalog"
        games={trending}
      />

      <GameRow
        title="Plixfy Originals"
        icon="⭐"
        subtitle="Games we built ourselves — no third-party iframes"
        games={originals}
      />

      <GameRow
        title="IO & Multiplayer"
        icon="🌐"
        subtitle="Live multiplayer .io games — slither, shoot, survive"
        games={ioRow}
        href="/play/io-games"
      />

      <GameRow
        title="Recently Added"
        icon="🆕"
        subtitle="Fresh from the harvest"
        games={recent}
      />

      <CategoryCards games={LIGHT_GAMES} />

      <HomeGrid games={LIGHT_GAMES} />

      <section className="mt-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Why Plixfy</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-center"
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-2 font-semibold">{f.title}</h3>
              <p className="mt-1 text-xs text-neutral-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
