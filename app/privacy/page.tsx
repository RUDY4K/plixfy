import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How PlayHub collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-neutral-300">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-white">What we collect</h2>
        <p>
          We do not collect personally identifiable information. High scores and player nicknames
          are stored in your browser&apos;s <code>localStorage</code> and never leave your device
          unless you explicitly submit them to a leaderboard.
        </p>

        <h2 className="text-lg font-bold text-white">Analytics</h2>
        <p>
          We use Google Analytics to understand aggregate site usage. Analytics may set cookies on
          your device. See Google&apos;s privacy policy at{' '}
          <a className="text-emerald-400 underline" href="https://policies.google.com/privacy">
            policies.google.com/privacy
          </a>
          .
        </p>

        <h2 className="text-lg font-bold text-white">Advertising</h2>
        <p>
          Once approved, we display ads via Google AdSense and partner gaming ad networks. These
          providers may use cookies to personalize ads. You can review and adjust ad personalization
          at{' '}
          <a className="text-emerald-400 underline" href="https://adssettings.google.com">
            adssettings.google.com
          </a>
          .
        </p>

        <h2 className="text-lg font-bold text-white">GDPR / CCPA</h2>
        <p>
          You have the right to access, correct, or delete personal data. Since we don&apos;t store
          personal data on our servers, the simplest way to exercise this right is to clear your
          browser&apos;s storage for this site.
        </p>

        <h2 className="text-lg font-bold text-white">Contact</h2>
        <p>
          Privacy questions? Email <code>privacy@playhub.example</code>.
        </p>
      </section>
    </div>
  );
}
