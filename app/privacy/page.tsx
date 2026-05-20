import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Plixfy collects, uses, and protects your data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-neutral-300">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-white">What we collect</h2>
        <p>
          We do not collect personally identifiable information on our servers. High scores,
          player nicknames, and game preferences are stored locally in your browser&apos;s
          <code className="mx-1">localStorage</code> and never leave your device unless you
          explicitly submit them to a leaderboard.
        </p>

        <h2 className="text-lg font-bold text-white">Cookies & consent</h2>
        <p>
          Plixfy shows a cookie banner on your first visit. Until you accept, we do not load
          third-party advertising scripts. Your choice is stored in <code>localStorage</code>
          under the key <code>plixfy:ad-consent</code>. You can revoke consent at any time by
          clearing your browser storage for this site.
        </p>

        <h2 className="text-lg font-bold text-white">Analytics</h2>
        <p>
          When configured, we use Google Analytics to understand aggregate site usage (page
          views, game starts, session length). Analytics may set cookies on your device. See
          Google&apos;s privacy policy at{' '}
          <a className="text-emerald-400 underline" href="https://policies.google.com/privacy">
            policies.google.com/privacy
          </a>
          .
        </p>

        <h2 className="text-lg font-bold text-white">Advertising — Google AdSense</h2>
        <p>
          Once approved, we display ads via Google AdSense and partner gaming ad networks.
          AdSense uses cookies to serve and personalize ads based on your prior visits to this
          and other sites. Third-party vendors, including Google, use cookies to serve ads
          based on your visits to this site or other sites on the Internet. You can opt out of
          personalized advertising at{' '}
          <a className="text-emerald-400 underline" href="https://adssettings.google.com">
            adssettings.google.com
          </a>{' '}
          or visit{' '}
          <a className="text-emerald-400 underline" href="https://www.aboutads.info/choices">
            aboutads.info/choices
          </a>{' '}
          for industry-wide opt-out.
        </p>

        <h2 className="text-lg font-bold text-white">Third-party game content</h2>
        <p>
          Some games on Plixfy are embedded via iframe from third-party providers (such as
          GameDistribution). Those iframes are operated by their respective providers and may
          collect data, set cookies, and display their own advertisements independently of
          Plixfy. Their privacy practices are governed by their own policies — we link to the
          provider on each game&apos;s page where applicable.
        </p>

        <h2 className="text-lg font-bold text-white">GDPR / CCPA</h2>
        <p>
          You have the right to access, correct, or delete personal data. Since we don&apos;t
          store personal data on our servers, the simplest way to exercise this right is to
          clear your browser&apos;s storage for this site. For data held by ad and analytics
          providers, please use their respective opt-out tools linked above.
        </p>

        <h2 className="text-lg font-bold text-white">Children</h2>
        <p>
          Plixfy is intended for general audiences. We do not knowingly collect data from
          children under 13. If you believe we have done so, contact us and we will remove it.
        </p>

        <h2 className="text-lg font-bold text-white">Contact</h2>
        <p>
          Privacy questions? Email <code>privacy@plixfy.example</code>.
        </p>
      </section>
    </div>
  );
}
