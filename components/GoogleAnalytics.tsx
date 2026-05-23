import { Suspense } from 'react';
import Script from 'next/script';
import GoogleAnalyticsPageviews from './GoogleAnalyticsPageviews';

/**
 * Injects Google Analytics 4 (gtag.js) when `NEXT_PUBLIC_GA_ID` is set
 * at build time. No-op otherwise so local dev / preview deploys don't
 * pollute prod analytics.
 *
 * Two halves:
 *   1. <Script> loads gtag.js + emits the initial pageview (this file).
 *   2. <GoogleAnalyticsPageviews> is a tiny client component that
 *      listens for App Router navigations and fires `page_view` on
 *      each change — Next 16's App Router does not do this on its own.
 *
 * Tracking helpers in `lib/analytics.ts` (window.gtag wrapper) start
 * working as soon as this script runs.
 */
export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${gaId}', { send_page_view: true });`}
      </Script>
      {/* Suspense boundary keeps the rest of the page from de-opting to
          dynamic rendering — `useSearchParams()` in the child would
          otherwise bubble up and force every route to client-render. */}
      <Suspense fallback={null}>
        <GoogleAnalyticsPageviews gaId={gaId} />
      </Suspense>
    </>
  );
}
