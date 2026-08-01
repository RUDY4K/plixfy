"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { getConsent, onConsentChange } from "@/lib/consent";
import { trackEvent } from "@/components/GoogleAnalytics";

interface VitalSnapshot {
  id: string;
  name: string;
  value: number;
  rating?: string;
}

function reportVital(metric: VitalSnapshot): void {
  trackEvent("web_vital", {
    metric_id: metric.id,
    metric_name: metric.name,
    metric_value: Math.round(
      metric.name === "CLS" ? metric.value * 1000 : metric.value,
    ),
    metric_rating: metric.rating,
    non_interaction: true,
  });
}

export default function WebVitals() {
  const pending = useRef<Map<string, VitalSnapshot>>(new Map());

  useEffect(
    () =>
      onConsentChange((choice) => {
        if (choice !== "accept") return;
        for (const metric of pending.current.values()) reportVital(metric);
        pending.current.clear();
      }),
    [],
  );

  useReportWebVitals(
    useCallback((metric) => {
      const snapshot: VitalSnapshot = {
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
      };

      if (getConsent() === "accept") {
        reportVital(snapshot);
      } else {
        // Keep only the newest value for each metric in memory until consent.
        pending.current.set(metric.name, snapshot);
      }
    }, []),
  );

  return null;
}
