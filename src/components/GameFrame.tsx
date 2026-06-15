"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play, X, ArrowDown } from "lucide-react";
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
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [justEnded, setJustEnded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startedAtRef = useRef<number | null>(null);

  function fireGameEnd() {
    if (startedAtRef.current === null) return;
    const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
    startedAtRef.current = null;
    const params = {
      game_slug: slug,
      game_title: title,
      duration_seconds: elapsed,
    };
    trackEvent("game_end", params);
    trackEvent("playgama_game_end", params);
  }

  function start() {
    setPlaying(true);
    setIframeLoaded(false);
    setJustEnded(false);
    startedAtRef.current = Date.now();
    const params = {
      game_slug: slug,
      game_title: title,
    };
    trackEventOnce(`game_start:${slug}`, "game_start", params);
    trackEventOnce(`playgama_game_start:${slug}`, "playgama_game_start", params);

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
    setJustEnded(true);
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  useEffect(() => {
    function onUnload() {
      if (startedAtRef.current === null) return;
      const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
      startedAtRef.current = null;
      const params = {
        game_slug: slug,
        game_title: title,
        duration_seconds: elapsed,
      };
      trackEvent("game_end", params);
      trackEvent("playgama_game_end", params);
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
            loading="lazy"
            onLoad={() => setIframeLoaded(true)}
            className="w-full h-full border-0 absolute inset-0"
          />
          {!iframeLoaded ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center bg-surface animate-pulse pointer-events-none"
            >
              <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            </div>
          ) : null}
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
        <>
          <button
            type="button"
            onClick={start}
            aria-label={"العب " + title}
            className="group absolute inset-0 block"
            data-game-slug={slug}
            data-placement="game-frame"
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
              <span className="w-20 h-20 md:w-24 md:h-24 min-w-12 min-h-12 rounded-full bg-primary flex items-center justify-center glow-pink group-hover:scale-110 transition-transform duration-200">
                <Play
                  className="w-10 h-10 md:w-12 md:h-12 text-white fill-white ms-1"
                  aria-hidden="true"
                />
              </span>
            </span>
          </button>
          {justEnded ? (
            <a
              href="#related-games"
              onClick={() => {
                trackEvent("playgama_play_more_click", { game_slug: slug });
                setJustEnded(false);
              }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-primary text-white font-bold px-5 py-3 rounded-2xl min-h-12 inline-flex items-center gap-2 glow-pink hover:scale-105 hover:brightness-110 transition-all duration-200"
              aria-label="العب ألعاب مشابهة"
            >
              <span>العب لعبة تانية</span>
              <ArrowDown className="w-5 h-5" aria-hidden="true" />
            </a>
          ) : null}
        </>
      )}
    </div>
  );
}
