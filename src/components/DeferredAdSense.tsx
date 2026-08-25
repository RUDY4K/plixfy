"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SCRIPT_ID = "plixfy-adsense";

/**
 * Loads AdSense only after React has committed the page. Google CMP and auto-ad
 * scripts can otherwise mutate the document while hydration is still running.
 */
export default function DeferredAdSense({ client }: { client: string }) {
  const pathname = usePathname();
  const isContentReviewExcluded =
    /\/(?:en\/)?(?:play|blog|news|search|favorites|profile|auth|dashboard|lab)(?:\/|$)/.test(
      pathname,
    );

  useEffect(() => {
    if (isContentReviewExcluded) return;
    if (document.getElementById(SCRIPT_ID)) return;

    const timer = window.setTimeout(() => {
      if (document.getElementById(SCRIPT_ID)) return;

      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
        encodeURIComponent(client);
      document.head.appendChild(script);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [client, isContentReviewExcluded]);

  return null;
}
