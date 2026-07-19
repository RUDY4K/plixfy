"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Cookie } from "lucide-react";
import { getConsent, setConsent, onConsentCleared } from "@/lib/consent";
import { localeFromPathname, localeHref, getDict } from "@/lib/i18n";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const locale = localeFromPathname(usePathname());
  const t = getDict(locale);

  useEffect(() => {
    const hasGoogleCMP = () =>
      typeof window !== "undefined" && "__tcfapi" in window;

    const evaluate = () => {
      if (hasGoogleCMP()) {
        setVisible(false);
        return;
      }
      if (getConsent() === null) {
        setVisible(true);
      }
    };

    const timer = window.setTimeout(evaluate, 2000);
    const unsubscribe = onConsentCleared(() => {
      if (hasGoogleCMP()) return;
      setVisible(true);
    });

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  if (!visible) return null;

  function onAccept() {
    setConsent("accept");
    setVisible(false);
  }

  function onReject() {
    setConsent("reject");
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t.consent.notice}
      className="fixed bottom-20 md:bottom-4 inset-x-3 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-30 max-w-3xl mx-auto"
    >
      <div className="glass bg-bg/95 backdrop-blur border border-surface-elevated rounded-2xl shadow-2xl p-4 md:p-5 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-start md:items-center gap-3 flex-1">
          <Cookie
            className="w-6 h-6 shrink-0 text-primary mt-0.5 md:mt-0"
            aria-hidden="true"
          />
          <div className="text-sm md:text-base text-text-primary leading-relaxed">
            {t.consent.body} {t.consent.agreeNote}{" "}
            <a
              href={localeHref(locale, "/privacy")}
              className="underline text-primary hover:brightness-110"
            >
              {t.consent.privacyPolicy}
            </a>
            .
          </div>
        </div>
        <div className="flex gap-2 md:gap-3 shrink-0">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl min-h-12 bg-accent-2 text-bg text-sm font-bold neon-glow-cyan hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent-2 focus:ring-offset-2 focus:ring-offset-bg transition-all duration-200"
            aria-label={t.consent.decline}
          >
            {t.consent.decline}
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl min-h-12 bg-primary text-white text-sm font-bold neon-glow-pink hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg transition-all duration-200"
            aria-label={t.consent.accept}
          >
            {t.consent.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
