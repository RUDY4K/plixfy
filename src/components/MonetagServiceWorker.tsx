"use client";

import { useEffect } from "react";

// Monetag معطّل مؤقتاً أثناء مراجعة AdSense (2026-07-06).
// المكوّن الآن يلغي تسجيل أي service worker سابق عند الزوار العائدين فقط.
// للاستعادة: git log -- src/components/MonetagServiceWorker.tsx
async function unregisterAll(): Promise<void> {
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
    void unregisterAll();
  }, []);

  return null;
}
