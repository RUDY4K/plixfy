"use client";

import { useEffect } from "react";
import { trackEventOnce } from "@/components/GoogleAnalytics";

const AI_REFERRERS = [
  "chatgpt.com",
  "openai.com",
  "copilot.microsoft.com",
  "perplexity.ai",
  "gemini.google.com",
] as const;

export default function AeoReferralTracker() {
  useEffect(() => {
    if (!document.referrer) return;

    let hostname: string;
    try {
      hostname = new URL(document.referrer).hostname.toLowerCase();
    } catch {
      return;
    }

    const matchedSource = AI_REFERRERS.find(
      (source) => hostname === source || hostname.endsWith(`.${source}`),
    );
    if (!matchedSource) return;

    trackEventOnce(
      `ai-referral:${matchedSource}:${window.location.pathname}`,
      "ai_referral_landing",
      {
        ai_source: matchedSource,
        landing_path: window.location.pathname,
      },
    );
  }, []);

  return null;
}
