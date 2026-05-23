import Link from 'next/link';

/**
 * Footer doubles as a crawlability lifeline: every SEO topic page is
 * linked here so even pages buried four levels deep can be reached
 * within three clicks from the homepage.
 */
const POPULAR_TOPICS: { slug: string; label: string }[] = [
  { slug: 'io-games',          label: 'IO Games' },
  { slug: 'multiplayer-games', label: 'Multiplayer' },
  { slug: 'unblocked-games',   label: 'Unblocked' },
  { slug: 'racing-games',      label: 'Racing' },
  { slug: 'car-games',         label: 'Cars' },
  { slug: 'shooting-games',    label: 'Shooting' },
  { slug: 'puzzle-games',      label: 'Puzzle' },
  { slug: 'action-games',      label: 'Action' },
  { slug: 'sports-games',      label: 'Sports' },
  { slug: 'stickman-games',    label: 'Stickman' },
  { slug: 'zombie-games',      label: 'Zombie' },
  { slug: 'cooking-games',     label: 'Cooking' },
];

export default function Footer() {
  return (
    <footer
      className="relative mt-auto py-12 text-sm text-neutral-400"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background:
          'linear-gradient(180deg, transparent 0%, rgba(6,9,24,0.6) 60%, rgba(6,9,24,0.85) 100%)',
      }}
    >
      <div className="mx-auto max-w-6xl px-4">
        {/* Brand strip */}
        <div className="mb-8 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{
              background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
              boxShadow: '0 0 16px -2px color-mix(in srgb, var(--neon-cyan) 60%, transparent)',
            }}
          >
            <svg viewBox="0 0 64 64" className="h-5 w-5">
              <path d="M18 12h18a12 12 0 0 1 0 24H26v16h-8V12z" fill="#04101A" />
              <path d="M28 21.5 L34 24 L28 26.5 Z" fill="#FF2DAA" />
            </svg>
          </span>
          <span
            className="font-display text-lg font-black uppercase tracking-[0.06em] text-white"
            style={{
              textShadow: '0 0 12px color-mix(in srgb, var(--neon-cyan) 45%, transparent)',
            }}
          >
            Plixfy
          </span>
        </div>

        <nav aria-label="Browse by category" className="mb-8">
          <h2 className="mb-3 font-display text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
            Browse Plixfy
          </h2>
          <ul className="flex flex-wrap gap-2">
            {POPULAR_TOPICS.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/play/${t.slug}`}
                  className="glass inline-block rounded-full px-3.5 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-300 transition hover:scale-[1.04] hover:text-white"
                  style={{
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div
          className="flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs">
            © {new Date().getFullYear()} <span className="text-neutral-200">Plixfy</span> · Free browser games, no download required.
          </p>
          <nav
            aria-label="Site links"
            className="flex items-center gap-5 font-display text-[11px] font-bold uppercase tracking-[0.16em]"
          >
            <Link href="/about" className="text-neutral-400 transition hover:text-[color:var(--neon-cyan)]">
              About
            </Link>
            <Link href="/privacy" className="text-neutral-400 transition hover:text-[color:var(--neon-cyan)]">
              Privacy
            </Link>
            <Link href="/terms" className="text-neutral-400 transition hover:text-[color:var(--neon-cyan)]">
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
