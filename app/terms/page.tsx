import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms of using PlayHub.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-neutral-300">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">Terms of Service</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-white">1. Use of the site</h2>
        <p>
          PlayHub is provided free of charge. You may play any game on this site for personal,
          non-commercial enjoyment.
        </p>

        <h2 className="text-lg font-bold text-white">2. Intellectual property</h2>
        <p>
          The games, code, and visual design on PlayHub are owned by their respective creators.
          Game names are used in good faith; if you believe a name infringes a trademark, please
          contact us.
        </p>

        <h2 className="text-lg font-bold text-white">3. User conduct</h2>
        <p>
          No cheating, automated abuse, or attempts to interfere with other players or the
          underlying systems.
        </p>

        <h2 className="text-lg font-bold text-white">4. No warranty</h2>
        <p>
          PlayHub is provided &quot;as is&quot;, without warranty. We do our best to keep the
          servers running but make no uptime guarantees.
        </p>

        <h2 className="text-lg font-bold text-white">5. Limitation of liability</h2>
        <p>
          We are not liable for any loss arising from your use of the site.
        </p>
      </section>
    </div>
  );
}
