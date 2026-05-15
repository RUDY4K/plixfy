import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms of using PlayHub.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-neutral-300">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">Terms of Service</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-white">1. Free service</h2>
        <p>
          PlayHub is provided free of charge. You may play any game on this site for personal,
          non-commercial enjoyment without an account.
        </p>

        <h2 className="text-lg font-bold text-white">2. Intellectual property</h2>
        <p>
          The games, code, and visual design that originate on PlayHub belong to their
          respective creators. Original game names are used in good faith; if you believe a
          name infringes a trademark, please contact us.
        </p>

        <h2 className="text-lg font-bold text-white">3. Third-party content</h2>
        <p>
          A portion of the games on PlayHub are embedded via iframe from third-party
          publishers (such as GameDistribution). Those games are operated, hosted, and
          monetized by their respective owners. PlayHub does not control their gameplay,
          their advertisements, or any data they may collect. We do not warrant their
          availability, accuracy, or safety, and we are not liable for any loss arising from
          your use of them.
        </p>

        <h2 className="text-lg font-bold text-white">4. User conduct</h2>
        <p>
          No cheating, automated abuse, scraping, or attempts to interfere with other players
          or the underlying systems. We may rate-limit or block traffic that violates this
          rule.
        </p>

        <h2 className="text-lg font-bold text-white">5. No warranty</h2>
        <p>
          PlayHub is provided &quot;as is&quot; and &quot;as available&quot;, without warranty
          of any kind — express or implied — including fitness for a particular purpose,
          uninterrupted availability, or freedom from errors. We do our best to keep the site
          running but make no uptime guarantees.
        </p>

        <h2 className="text-lg font-bold text-white">6. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, PlayHub and its operators are not liable for
          any indirect, incidental, or consequential loss arising from your use of the site
          or any third-party game embedded on it.
        </p>

        <h2 className="text-lg font-bold text-white">7. Changes</h2>
        <p>
          We may update these terms from time to time. Material changes will be reflected by
          the &quot;Last updated&quot; date above. Continued use of the site after a change
          means you accept the updated terms.
        </p>

        <h2 className="text-lg font-bold text-white">8. Contact</h2>
        <p>
          Questions about these terms? Email <code>legal@playhub.example</code>.
        </p>
      </section>
    </div>
  );
}
