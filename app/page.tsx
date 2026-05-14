import { GAMES } from '@/games/registry';
import GameCard from '@/components/GameCard';
import AdPlacement from '@/components/AdPlacement';

const FEATURES = [
  { icon: '⚡', title: 'No downloads', body: 'Plays instantly in your browser.' },
  { icon: '🆓', title: '100% free', body: 'No accounts, no paywalls.' },
  { icon: '📱', title: 'Mobile friendly', body: 'Touch controls on every game.' },
  { icon: '🆕', title: 'New games weekly', body: 'Fresh additions all the time.' },
];

export default function Home() {
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
            Free Browser Games
            <span className="block text-neutral-400">No Download Required</span>
          </h1>
          <p className="mt-4 max-w-xl text-neutral-400">
            A curated collection of casual games — puzzle, arcade, strategy. Plays instantly on any device.
          </p>
          <a
            href="#games"
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400"
          >
            Play now →
          </a>
        </div>
      </section>

      <section id="games" className="mt-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight">All games</h2>
          <span className="text-sm text-neutral-500">{GAMES.length} titles</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game, idx) => (
            <div key={game.slug} className="contents">
              <GameCard game={game} />
              {(idx + 1) % 4 === 0 && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <AdPlacement slot="between" label="Ad · between games" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

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
              <p className="mt-1 text-xs text-neutral-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
