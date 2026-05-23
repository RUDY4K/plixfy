'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Fires a `page_view` to GA4 on every client-side App Router
 * navigation. Loaded by <GoogleAnalytics> only when GA_ID is set.
 *
 * The initial pageview is sent by `gtag('config', ...)` in the inline
 * script in GoogleAnalytics.tsx, so we deliberately skip the first
 * mount here to avoid double-counting it.
 */
interface Props {
  gaId: string;
}

export default function GoogleAnalyticsPageviews({ gaId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.gtag !== 'function') return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    window.gtag('config', gaId, {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [gaId, pathname, searchParams]);

  return null;
}
