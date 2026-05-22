'use client';

import { useEffect } from 'react';
import { log } from '@/lib/logger';

/**
 * Headless component that registers /sw.js once on mount.
 *
 * Production only — registering in dev kills hot-reload by serving stale
 * cached bundles. Mounted high in the layout so registration happens
 * regardless of route.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => log.warn('sw register failed', err));
    };

    // Wait for `load` so SW install can't compete with the page's
    // critical-path fetches on slow connections.
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });

    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
