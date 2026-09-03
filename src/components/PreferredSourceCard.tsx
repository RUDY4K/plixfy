"use client";

import { useEffect } from "react";
import Script from "next/script";
import { trackEvent } from "@/components/GoogleAnalytics";
import type { Locale } from "@/lib/i18n";

const GOOGLE_PREFERRED_SOURCE_URL =
  "https://www.google.com/preferences/source?q=plixfy.com";

const COPY = {
  ar: {
    eyebrow: "أخبار بليكسفاي في Google",
    title: "اجعل بليكسفاي مصدرًا مفضّلًا",
    body: "اختر بليكسفاي لتظهر أخبارنا لك بشكل أوضح ضمن نتائج الأخبار المؤهلة في Google.",
    fallback: "فتح إعدادات المصادر المفضّلة",
  },
  en: {
    eyebrow: "Plixfy on Google",
    title: "Make Plixfy a preferred source",
    body: "Choose Plixfy to see our eligible reporting more prominently in your Google news results.",
    fallback: "Open preferred-source settings",
  },
} as const;

export default function PreferredSourceCard({ locale }: { locale: Locale }) {
  const c = COPY[locale];

  useEffect(() => {
    const keepServiceFrameInsideViewport = () => {
      document
        .querySelectorAll<HTMLIFrameElement>('iframe[title="Subscribe with Google Service"]')
        .forEach((frame) => {
          if (frame.style.getPropertyValue("left") !== "0px") {
            frame.style.setProperty("left", "0px", "important");
          }
          if (frame.style.getPropertyValue("right") !== "auto") {
            frame.style.setProperty("right", "auto", "important");
          }
          if (frame.style.getPropertyValue("top") !== "0px") {
            frame.style.setProperty("top", "0px", "important");
          }
        });
    };

    keepServiceFrameInsideViewport();
    const observer = new MutationObserver(keepServiceFrameInsideViewport);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "title"],
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-labelledby="preferred-source-title"
      onClickCapture={() =>
        trackEvent("preferred_source_click", {
          source_domain: "plixfy.com",
          locale,
        })
      }
      className="rounded-2xl border border-blue-200 bg-gradient-to-l from-blue-50 to-white p-5 shadow-sm md:p-6"
    >
      <Script
        id="google-preferred-source-publisher"
        src="https://news.google.com/swg/js/v1/publisher.js"
        strategy="lazyOnload"
      />
      <p className="text-xs font-extrabold uppercase tracking-wide text-blue-700">
        {c.eyebrow}
      </p>
      <h2 id="preferred-source-title" className="mt-1 text-lg font-extrabold text-slate-900">
        {c.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{c.body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div google-add-preferred-source-btn="" data-theme="light" />
        <a
          href={GOOGLE_PREFERRED_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-blue-700 hover:underline"
        >
          {c.fallback}
        </a>
      </div>
    </section>
  );
}
