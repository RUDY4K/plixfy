import {
  LIGHT_GAMES,
  customGames,
  ioMultiplayerGames,
  liveGames,
  recentlyAddedGames,
  trendingGames,
} from '@/games/registry';
import Hero from '@/components/Hero';
import HomeGrid from '@/components/HomeGrid';
import GameRow from '@/components/GameRow';
import CategoryCards from '@/components/CategoryCards';
import DailyFeatured from '@/components/DailyFeatured';
import RecentlyPlayedRow from '@/components/RecentlyPlayedRow';
import ActivityFeed from '@/components/ActivityFeed';
import { getRecentActivity } from '@/lib/activity-server';

const FEATURES = [
  { icon: '⚡', title: 'Instant play',     body: 'Loads in seconds on any device.', color: 'var(--neon-cyan)' },
  { icon: '♡', title: '100% free',         body: 'No accounts. No paywalls. Ever.', color: 'var(--neon-magenta)' },
  { icon: '◇', title: 'Mobile + desktop',  body: 'Touch and keyboard, side by side.', color: 'var(--neon-purple)' },
  { icon: '↗', title: 'New every week',    body: 'Fresh picks added on the regular.', color: 'var(--neon-green)' },
];

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

  // Hand-pick a few high-recognition thumbnails to float behind the hero.
  // Prefer trending games so the floaters always show something fresh.
  const floaters = trending.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Hero liveCount={liveCount} heroLabel={heroLabel} floaters={floaters} />

      <div className="reveal-on-scroll">
        <ActivityFeed initialItems={activity} />
      </div>

      <div className="reveal-on-scroll">
        <DailyFeatured games={LIGHT_GAMES} />
      </div>

      <div className="reveal-on-scroll">
        <RecentlyPlayedRow allGames={LIGHT_GAMES} />
      </div>

      <div className="reveal-on-scroll">
        <GameRow
          title="Trending"
          icon="🔥"
          subtitle="Most-played picks across the catalog"
          games={trending}
          accent="var(--neon-magenta)"
        />
      </div>

      <div className="reveal-on-scroll">
        <GameRow
          title="Plixfy Originals"
          icon="⭐"
          subtitle="Games we built ourselves — no third-party iframes"
          games={originals}
          accent="var(--neon-purple)"
        />
      </div>

      <div className="reveal-on-scroll">
        <GameRow
          title="IO & Multiplayer"
          icon="🌐"
          subtitle="Live multiplayer .io games — slither, shoot, survive"
          games={ioRow}
          href="/play/io-games"
          accent="var(--neon-cyan)"
        />
      </div>

      <div className="reveal-on-scroll">
        <GameRow
          title="Recently Added"
          icon="🆕"
          subtitle="Fresh from the harvest"
          games={recent}
          accent="var(--neon-green)"
        />
      </div>

      <div className="reveal-on-scroll">
        <CategoryCards games={LIGHT_GAMES} />
      </div>

      <div className="reveal-on-scroll">
        <HomeGrid games={LIGHT_GAMES} />
      </div>

      <section className="mt-16 reveal-on-scroll">
        <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-[0.05em] sm:text-3xl">
          <span className="neon-text-gradient">Why Plixfy</span>
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass card-hover relative overflow-hidden rounded-2xl p-5 text-center"
              style={{ ['--card-glow' as string]: f.color }}
            >
              <div
                aria-hidden="true"
                className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full"
                style={{
                  background: `color-mix(in srgb, ${f.color} 14%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${f.color} 40%, transparent)`,
                  boxShadow: `0 0 22px -6px ${f.color}`,
                  color: f.color,
                  fontSize: '1.5rem',
                }}
              >
                {f.icon}
              </div>
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-white">
                {f.title}
              </h3>
              <p className="mt-1 text-xs text-neutral-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
