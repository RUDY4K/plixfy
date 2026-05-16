import {
  GAMES,
  customGames,
  liveGames,
  recentlyAddedGames,
  trendingGames,
} from '@/games/registry';
import HomeGrid from '@/components/HomeGrid';
import GameRow from '@/components/GameRow';
import CategoryCards from '@/components/CategoryCards';
import DailyFeatured from '@/components/DailyFeatured';
import RecentlyPlayedRow from '@/components/RecentlyPlayedRow';

const FEATURES = [
  { icon: '⚡', title: 'No downloads', body: 'Plays instantly in your browser.' },
  { icon: '🆓', title: '100% free', body: 'No accounts, no paywalls.' },
  { icon: '📱', title: 'Mobile friendly', body: 'Touch controls on every game.' },
  { icon: '🆕', title: 'New games weekly', body: 'Fresh additions all the time.' },
];

export default function Home() {
  const liveCount = liveGames().length;
  const trending = trendingGames();
  const originals = customGames().filter((g) => g.status === 'live');
  const recent = recentlyAddedGames(12);

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
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">PlayHub</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            {liveCount}+ Free Browser Games
            <span className="block text-neutral-400">No Download Required</span>
          </h1>
          <p className="mt-4 max-w-xl text-neutral-400">
            A curated collection of casual games — puzzle, arcade, racing, sports, IO, stickman, zombie and more. Plays instantly on any device.
          </p>
          <a
            href="#games"
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400"
          >
            Play now →
          </a>
        </div>
      </section>

      <DailyFeatured games={GAMES} />

      <RecentlyPlayedRow allGames={GAMES} />

      <GameRow
        title="Trending"
        icon="🔥"
        subtitle="Most-played picks across the catalog"
        games={trending}
      />

      <GameRow
        title="PlayHub Originals"
        icon="⭐"
        subtitle="Games we built ourselves — no third-party iframes"
        games={originals}
      />

      <GameRow
        title="Recently Added"
        icon="🆕"
        subtitle="Fresh from the harvest"
        games={recent}
      />

      <CategoryCards games={GAMES} />

      <HomeGrid games={GAMES} />

      <section className="mt-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Why PlayHub</h2>
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
