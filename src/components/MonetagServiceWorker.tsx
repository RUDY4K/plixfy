"use client";

import { useEffect } from "react";

export default function MonetagServiceWorker() {
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[MonetagServiceWorker] registration failed:", err);
        }
      });
  }, []);

  return null;
}
