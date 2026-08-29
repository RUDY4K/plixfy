'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEvent } from './GoogleAnalytics';
import { onConsentChange } from '@/lib/consent';

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const reportCurrentPage = () => {
      const qs = searchParams?.toString();
      const fullPath = qs ? `${pathname}?${qs}` : pathname;
      trackEvent('page_view', {
        page_path: fullPath,
        page_location: window.location.href,
        page_title: document.title,
      });
    };

    reportCurrentPage();
    return onConsentChange((choice) => {
      if (choice === 'accept') reportCurrentPage();
    });
  }, [pathname, searchParams]);

  return null;
}
