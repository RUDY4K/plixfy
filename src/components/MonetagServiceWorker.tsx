"use client";

import { useEffect } from "react";
import { getConsent, onConsentChange } from "@/lib/consent";

function register(): void {
  if (typeof navigator === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[MonetagServiceWorker] registration failed:", err);
      }
    });
}

export default function MonetagServiceWorker() {
  useEffect(() => {
    if (getConsent() === "accept") {
      register();
    }
    return onConsentChange((choice) => {
      if (choice === "accept") register();
    });
  }, []);

  return null;
}
