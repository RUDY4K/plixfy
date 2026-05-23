import Link from 'next/link';
import type { LightGameMeta } from '@/types/game';

interface HeroProps {
  liveCount: number;
  heroLabel: string;
  /** Up to ~8 thumbnails to float behind the hero text. */
  floaters: readonly LightGameMeta[];
}

// Deterministic per-index particle settings — keeps SSR/CSR markup
// matching (no Math.random) while still giving the field organic variety.
const PARTICLE_COLORS = [
  'var(--neon-cyan)',
  'var(--neon-magenta)',
  'var(--neon-purple)',
  'var(--neon-cyan)',
  'var(--neon-green)',
];
const PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const r = seed / 233280;
  const r2 = ((i + 1) * 49297) % 100 / 100;
  return {
    x: `${(r * 100).toFixed(1)}%`,
    size: `${(2 + r2 * 4).toFixed(1)}px`,
    drift: `${(-40 + r * 80).toFixed(0)}px`,
    delay: `${(r * 14).toFixed(1)}s`,
    duration: `${(10 + r2 * 10).toFixed(1)}s`,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  };
});

// Six float-drift positions for the background game thumbnails — fanned
// across the hero so they read as a halo, not a stack. Each gets its own
// rotation, drift vector and animation duration for organic movement.
const FLOAT_POSITIONS = [
  { top: '6%',  left: '4%',   rot: '-12deg', dx: '14px',  dy: '-22px', dur: '18s', delay: '0s'   },
  { top: '12%', right: '6%',  rot: '14deg',  dx: '-18px', dy: '20px',  dur: '22s', delay: '1.4s' },
  { top: '45%', left: '-2%',  rot: '8deg',   dx: '20px',  dy: '-18px', dur: '20s', delay: '0.6s' },
  { top: '52%', right: '-1%', rot: '-9deg',  dx: '-12px', dy: '18px',  dur: '24s', delay: '2.2s' },
  { bottom: '8%', left: '12%', rot: '4deg',   dx: '12px',  dy: '-22px', dur: '19s', delay: '1s'   },
  { bottom: '14%', right: '14%', rot: '-6deg', dx: '-16px', dy: '-16px', dur: '21s', delay: '3s' },
];

export default function Hero({ liveCount, heroLabel, floaters }: HeroProps) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate -mx-4 overflow-hidden rounded-none sm:mx-0 sm:rounded-3xl"
      style={{ minHeight: 'min(640px, 88vh)' }}
    >
      {/* Layer 1: subtle inner gradient (over the page-level mesh) for depth. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 100%, color-mix(in srgb, var(--neon-purple) 22%, transparent), transparent 60%), radial-gradient(80% 60% at 50% 0%, color-mix(in srgb, var(--neon-cyan) 18%, transparent), transparent 60%)',
        }}
      />

      {/* Layer 2: grid pattern overlay, masked to fade at edges. */}
      <div aria-hidden="true" className="neon-grid-overlay absolute inset-0 -z-10" />

      {/* Layer 3: floating game thumbnails (parallax-like drift). */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {floaters.slice(0, FLOAT_POSITIONS.length).map((g, i) => {
          const pos = FLOAT_POSITIONS[i];
          return (
            <div
              key={g.slug}
              className="float-drift absolute hidden sm:block"
              style={{
                ...pos,
                ['--rot' as string]: pos.rot,
                ['--dx' as string]: pos.dx,
                ['--dy' as string]: pos.dy,
                ['--drift-dur' as string]: pos.dur,
                ['--drift-delay' as string]: pos.delay,
              }}
            >
              <div
                className="overflow-hidden rounded-2xl"
                style={{
                  width: 'clamp(96px, 11vw, 160px)',
                  height: 'clamp(72px, 8vw, 120px)',
                  boxShadow:
                    '0 0 0 1px rgba(255,255,255,0.12), 0 18px 40px -16px rgba(0,0,0,0.7), 0 0 30px -6px color-mix(in srgb, var(--neon-cyan) 30%, transparent)',
                  opacity: 0.55,
                  filter: 'saturate(120%) contrast(105%)',
                }}
              >
                <img
                  src={g.thumbnail}
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Layer 4: particle field. */}
      <div className="particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="particle"
            style={{
              ['--p-x' as string]: p.x,
              ['--p-size' as string]: p.size,
              ['--p-drift' as string]: p.drift,
              ['--p-delay' as string]: p.delay,
              ['--p-dur' as string]: p.duration,
              ['--p-color' as string]: p.color,
            }}
          />
        ))}
      </div>

      {/* Layer 5: vignette so the title is always readable on top of the
         glowing background, regardless of which thumbs drifted behind it. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 55%, transparent 0%, rgba(6,9,24,0.55) 70%, rgba(6,9,24,0.8) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-20 text-center sm:px-8 sm:py-28">
        <div className="hero-in" style={{ animationDelay: '0ms' }}>
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--neon-cyan)',
              borderColor: 'color-mix(in srgb, var(--neon-cyan) 45%, transparent)',
              background: 'color-mix(in srgb, var(--neon-cyan) 10%, transparent)',
              boxShadow: '0 0 18px -4px color-mix(in srgb, var(--neon-cyan) 50%, transparent)',
            }}
          >
            <span aria-hidden="true">●</span>
            Play free · no download
          </span>
        </div>

        <h1
          id="hero-title"
          className="hero-in mt-6 font-display font-black leading-[0.92] tracking-tight"
          style={{
            animationDelay: '120ms',
            fontSize: 'clamp(3rem, 11vw, 8rem)',
          }}
        >
          <span className="neon-text-gradient block">{heroLabel}</span>
          <span
            className="mt-2 block text-white"
            style={{ fontSize: 'clamp(1.1rem, 2.6vw, 2rem)', letterSpacing: '0.04em' }}
          >
            FREE BROWSER GAMES
          </span>
        </h1>

        <p
          className="hero-in mx-auto mt-6 max-w-2xl text-base text-neutral-300 sm:text-lg"
          style={{ animationDelay: '260ms', fontFamily: 'var(--font-body)' }}
        >
          {liveCount.toLocaleString()} games across 19 categories — puzzle,
          racing, .io multiplayer, action, sports and more. Instant play,
          built for your browser.
        </p>

        <div
          className="hero-in mt-9 flex flex-col items-center gap-4 sm:flex-row sm:gap-5"
          style={{ animationDelay: '400ms' }}
        >
          <Link href="#games" className="neon-cta">
            <span>Play now</span>
            <span aria-hidden="true" style={{ fontSize: '1.1em' }}>→</span>
          </Link>
          <Link
            href="/favorites"
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white/90 transition hover:text-white"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.14)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span aria-hidden="true">♥</span>
            <span>Favorites</span>
          </Link>
        </div>

        <ul
          className="hero-in mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400 sm:text-xs"
          style={{ animationDelay: '540ms', fontFamily: 'var(--font-display)' }}
        >
          <li className="inline-flex items-center gap-2">
            <span aria-hidden="true" style={{ color: 'var(--neon-cyan)' }}>⚡</span>
            Instant play
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden="true" style={{ color: 'var(--neon-magenta)' }}>♡</span>
            100% free
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden="true" style={{ color: 'var(--neon-purple)' }}>◇</span>
            No accounts
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden="true" style={{ color: 'var(--neon-green)' }}>↗</span>
            New weekly
          </li>
        </ul>
      </div>
    </section>
  );
}
