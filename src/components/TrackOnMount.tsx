'use client';

import { useEffect } from 'react';
import { trackEvent, trackEventOnce } from './GoogleAnalytics';

interface TrackOnMountProps {
  eventName: string;
  params?: Record<string, unknown>;
  dedupKey?: string;
}

export default function TrackOnMount({ eventName, params, dedupKey }: TrackOnMountProps) {
  useEffect(() => {
    if (dedupKey) {
      trackEventOnce(dedupKey, eventName, params);
    } else {
      trackEvent(eventName, params);
    }
    // Fire exactly once on mount — props are stable per page navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
