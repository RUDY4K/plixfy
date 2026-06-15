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

async function unregister(): Promise<void> {
  if (typeof navigator === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {
    // ignore — best-effort cleanup
  }
}

export default function MonetagServiceWorker() {
  useEffect(() => {
    if (getConsent() === "accept") {
      register();
    } else if (getConsent() === "reject") {
      void unregister();
    }
    return onConsentChange((choice) => {
      if (choice === "accept") register();
      else void unregister();
    });
  }, []);

  return null;
}
