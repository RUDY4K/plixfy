'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { hasConsent } from '@/lib/ads';

const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

/**
 * Loads the AdSense JS only when (a) a client ID is configured and (b) the
 * user has accepted cookies. Re-checks consent on the `playhub:consent-change`
 * window event so accepting the banner mounts the script without a reload.
 */
export default function AdSenseScript() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(hasConsent());
    const onChange = () => setConsented(hasConsent());
    window.addEventListener('playhub:consent-change', onChange);
    return () => window.removeEventListener('playhub:consent-change', onChange);
  }, []);

  if (!CLIENT_ID || !consented) return null;

  return (
    <Script
      id="adsbygoogle-loader"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT_ID}`}
    />
  );
}
