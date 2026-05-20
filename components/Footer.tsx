import Link from 'next/link';

/**
 * Footer doubles as a crawlability lifeline: every SEO topic page is
 * linked here so even pages buried four levels deep can be reached
 * within three clicks from the homepage.
 */
const POPULAR_TOPICS: { slug: string; label: string }[] = [
  { slug: 'io-games',        label: 'IO Games' },
  { slug: 'multiplayer-games', label: 'Multiplayer' },
  { slug: 'unblocked-games', label: 'Unblocked' },
  { slug: 'racing-games',    label: 'Racing' },
  { slug: 'car-games',       label: 'Cars' },
  { slug: 'shooting-games',  label: 'Shooting' },
  { slug: 'puzzle-games',    label: 'Puzzle' },
  { slug: 'action-games',    label: 'Action' },
  { slug: 'sports-games',    label: 'Sports' },
  { slug: 'stickman-games',  label: 'Stickman' },
  { slug: 'zombie-games',    label: 'Zombie' },
  { slug: 'cooking-games',   label: 'Cooking' },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-900 bg-neutral-950 py-10 text-sm text-neutral-400">
      <div className="mx-auto max-w-6xl px-4">
        <nav aria-label="Browse by category" className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Browse Plixfy
          </h2>
          <ul className="flex flex-wrap gap-2">
            {POPULAR_TOPICS.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/play/${t.slug}`}
                  className="inline-block rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs font-semibold text-neutral-300 transition hover:border-emerald-500 hover:text-emerald-400"
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-neutral-900 pt-6 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Plixfy. Free browser games, no download required.</p>
          <nav aria-label="Site links" className="flex items-center gap-4">
            <Link href="/about" className="hover:text-white transition">About</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
