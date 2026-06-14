"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";
import { getPlaygamaEmbedUrl } from "@/lib/playgama";
import { trackEvent, trackEventOnce } from "./GoogleAnalytics";

export interface GameFrameProps {
  slug: string;
  title: string;
  thumbnail: string;
  orientation?: "landscape" | "portrait" | "both";
}

export default function GameFrame(props: GameFrameProps) {
  const { slug, title, thumbnail, orientation } = props;
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startedAtRef = useRef<number | null>(null);

  function fireGameEnd() {
    if (startedAtRef.current === null) return;
    const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
    startedAtRef.current = null;
    trackEvent("game_end", {
      game_slug: slug,
      game_title: title,
      duration_seconds: elapsed,
    });
  }

  function start() {
    setPlaying(true);
    startedAtRef.current = Date.now();
    trackEventOnce(`game_start:${slug}`, "game_start", {
      game_slug: slug,
      game_title: title,
    });

    const wantsFullscreen =
      typeof window !== "undefined" &&
      window.innerWidth < 768 &&
      (orientation === "landscape" || orientation === undefined);

    if (!wantsFullscreen) return;

    requestAnimationFrame(() => {
      const el = iframeRef.current;
      if (!el) return;
      try {
        const result = el.requestFullscreen({ navigationUI: "hide" });
        if (result && typeof result.catch === "function") {
          result.catch(() => {});
        }
      } catch {
        // fullscreen not supported or denied — ignore
      }
    });
  }

  function stop() {
    fireGameEnd();
    setPlaying(false);
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  useEffect(() => {
    function onUnload() {
      if (startedAtRef.current === null) return;
      const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
      startedAtRef.current = null;
      trackEvent("game_end", {
        game_slug: slug,
        game_title: title,
        duration_seconds: elapsed,
      });
    }
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      onUnload();
    };
  }, [slug, title]);

  return (
    <div className="relative aspect-video md:aspect-[21/9] overflow-hidden rounded-2xl bg-surface">
      {playing ? (
        <>
          <iframe
            ref={iframeRef}
            src={getPlaygamaEmbedUrl(slug)}
            title={title}
            allow="autoplay; encrypted-media; fullscreen"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full border-0 absolute inset-0"
          />
          <button
            type="button"
            onClick={stop}
            aria-label="خروج من ملء الشاشة"
            className="absolute top-3 left-3 z-10 w-12 h-12 inline-flex items-center justify-center bg-bg/80 backdrop-blur text-text-primary rounded-xl hover:bg-bg transition"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={start}
          aria-label={"العب " + title}
          className="group absolute inset-0 block"
        >
          <Image
            src={thumbnail}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 900px"
            className="object-cover"
            priority
          />
          <span className="absolute inset-0 bg-bg/50 flex items-center justify-center transition group-hover:bg-bg/40">
            <span className="w-20 h-20 md:w-24 md:h-24 min-w-12 min-h-12 rounded-full bg-primary flex items-center justify-center shadow-2xl">
              <Play
                className="w-10 h-10 md:w-12 md:h-12 text-bg fill-bg ms-1"
                aria-hidden="true"
              />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
