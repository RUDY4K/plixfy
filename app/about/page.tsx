import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'About Plixfy — a free browser games portal. No accounts, no downloads.',
  alternates: { canonical: '/about' },
};

const FAQ = [
  { q: 'Are the games really free?', a: 'Yes — every game on Plixfy is free to play.' },
  { q: 'Do I need to download anything?', a: 'No. Games run directly in your browser.' },
  { q: 'Can I play on mobile?', a: 'Yes — every game supports touch controls.' },
  { q: 'How do I report a bug?', a: 'Email us at support@plixfy.example.' },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">About Plixfy</h1>
      <p className="mt-4 text-neutral-400">
        Plixfy is a small portal of free casual browser games. No accounts, no downloads, no
        paywalls — just open a game and play. Built by a solo developer who likes shipping things.
      </p>

      <h2 className="mt-10 text-xl font-bold">FAQ</h2>
      <dl className="mt-4 space-y-4">
        {FAQ.map((item) => (
          <div key={item.q} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <dt className="font-semibold text-white">{item.q}</dt>
            <dd className="mt-1 text-sm text-neutral-400">{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
