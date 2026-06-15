"use client";

import { useEffect, useId, useRef } from "react";
import { trackEvent } from "./GoogleAnalytics";

export type MonetagAdType = "banner" | "sidebar" | "footer";

interface MonetagAdsProps {
  type: MonetagAdType;
  zoneId?: number;
  className?: string;
}

const DEFAULT_ZONE_ID = 11150632;
const MONETAG_DOMAIN = "5gvci.com";

const SIZE_BY_TYPE: Record<MonetagAdType, { width: string; height: string; maxWidth: string }> = {
  banner: { width: "100%", height: "90px", maxWidth: "728px" },
  sidebar: { width: "300px", height: "250px", maxWidth: "300px" },
  footer: { width: "300px", height: "250px", maxWidth: "300px" },
};

export default function MonetagAds({ type, zoneId = DEFAULT_ZONE_ID, className }: MonetagAdsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const slotId = "monetag-" + type + "-" + reactId.replace(/[^a-zA-Z0-9_-]/g, "");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const script = document.createElement("script");
    script.async = true;
    script.dataset.zoneId = String(zoneId);
    script.dataset.adType = type;
    script.src =
      "https://" +
      MONETAG_DOMAIN +
      "/act/files/ssp.js?r=" +
      encodeURIComponent(String(zoneId)) +
      "&z=" +
      encodeURIComponent(String(zoneId));

    script.onload = () => {
      if (cancelled) return;
      trackEvent("ad_impression", {
        ad_network: "monetag",
        ad_type: type,
        ad_zone_id: zoneId,
      });
    };

    script.onerror = () => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[MonetagAds] script failed to load for type:", type);
      }
    };

    container.appendChild(script);

    return () => {
      cancelled = true;
      try {
        script.remove();
      } catch {
        // ignore
      }
    };
  }, [type, zoneId]);

  const size = SIZE_BY_TYPE[type];

  const baseClasses =
    "flex items-center justify-center overflow-hidden bg-surface/40 rounded-2xl mx-auto";

  if (type === "footer") {
    return (
      <div
        className={
          "fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-30 md:hidden " +
          (className ?? "")
        }
        aria-hidden="true"
      >
        <div
          ref={containerRef}
          id={slotId}
          data-monetag-zone={zoneId}
          data-monetag-type={type}
          className={baseClasses + " shadow-2xl"}
          style={{
            width: size.width,
            height: size.height,
            maxWidth: size.maxWidth,
          }}
        />
      </div>
    );
  }

  if (type === "sidebar") {
    return (
      <aside
        className={"hidden lg:block " + (className ?? "")}
        aria-label="إعلان"
      >
        <div
          ref={containerRef}
          id={slotId}
          data-monetag-zone={zoneId}
          data-monetag-type={type}
          className={baseClasses}
          style={{
            width: size.width,
            height: size.height,
            maxWidth: size.maxWidth,
          }}
        />
      </aside>
    );
  }

  return (
    <div
      className={"w-full flex justify-center " + (className ?? "")}
      aria-label="إعلان"
    >
      <div
        ref={containerRef}
        id={slotId}
        data-monetag-zone={zoneId}
        data-monetag-type={type}
        className={baseClasses}
        style={{
          width: size.width,
          height: size.height,
          maxWidth: size.maxWidth,
        }}
      />
    </div>
  );
}
