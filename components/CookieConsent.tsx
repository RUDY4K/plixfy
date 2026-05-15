'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { resetAdProvider } from '@/lib/ads';

const CONSENT_KEY = 'playhub:ad-consent';

type Choice = 'accepted' | 'rejected';

function readChoice(): Choice | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw === 'accepted' || raw === 'rejected' ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Lightweight cookie consent bar. Not a full IAB CMP — pragmatic for a
 * placeholder-mode portal. Saves choice to localStorage and dispatches
 * `playhub:consent-change` so the AdSense loader can mount/unmount.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readChoice() === null);
  }, []);

  const persist = (choice: Choice) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // Safari private mode etc — banner just stays hidden for this session.
    }
    resetAdProvider();
    window.dispatchEvent(new CustomEvent('playhub:consent-change', { detail: choice }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 text-sm text-neutral-300 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-relaxed">
          PlayHub uses cookies for ads and analytics. By accepting, you allow personalised ads.{' '}
          <Link href="/privacy" className="underline hover:text-white">
            Read our privacy policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => persist('rejected')}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:border-neutral-500 hover:text-white"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => persist('accepted')}
            className="rounded-md bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-neutral-950 transition hover:bg-emerald-400"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
