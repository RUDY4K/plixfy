'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEvent } from './GoogleAnalytics';
import { getConsent, onConsentChange, onConsentCleared } from '@/lib/consent';
import {
  buildPageSnapshot,
  pageViewsAfterConsent,
  type PageSnapshot,
} from '@/lib/pageTracking';

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pendingLandingRef = useRef<PageSnapshot | null>(null);
  const currentPageRef = useRef<PageSnapshot | null>(null);
  const acceptedRef = useRef(false);
  const lastReportedLocationRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const snapshot = buildPageSnapshot(
      pathname,
      searchParams?.toString() ?? '',
      window.location.href,
      document.title,
      document.referrer,
    );
    currentPageRef.current = snapshot;

    const consent = getConsent();
    acceptedRef.current = consent === 'accept';
    if (consent === 'accept') {
      if (lastReportedLocationRef.current !== snapshot.page_location) {
        trackEvent('page_view', snapshot);
        lastReportedLocationRef.current = snapshot.page_location;
      }
    } else if (consent === null && pendingLandingRef.current === null) {
      // Keep the original landing URL in memory only. This preserves gclid/UTM
      // through consent without writing analytics data before the visitor accepts.
      pendingLandingRef.current = snapshot;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    acceptedRef.current = getConsent() === 'accept';
    const unsubscribeChange = onConsentChange((choice) => {
      const acceptedNow = choice === 'accept' && !acceptedRef.current;
      acceptedRef.current = choice === 'accept';
      if (choice !== 'accept') {
        lastReportedLocationRef.current = null;
        return;
      }
      if (!acceptedNow || currentPageRef.current === null) return;

      const current = currentPageRef.current;
      for (const page of pageViewsAfterConsent(pendingLandingRef.current, current)) {
        if (lastReportedLocationRef.current === page.page_location) continue;
        trackEvent('page_view', page);
        lastReportedLocationRef.current = page.page_location;
      }
      pendingLandingRef.current = null;
    });
    const unsubscribeClear = onConsentCleared(() => {
      acceptedRef.current = false;
      lastReportedLocationRef.current = null;
    });
    return () => {
      unsubscribeChange();
      unsubscribeClear();
    };
  }, []);

  return null;
}
