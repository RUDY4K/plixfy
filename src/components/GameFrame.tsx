"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Play, X, ArrowDown } from "lucide-react";
import GameArtwork from "@/components/GameArtwork";
import { localeFromPathname, getDict } from "@/lib/i18n";
import { getPlaygamaEmbedUrl } from "@/lib/playgama";
import { usePlayerData } from "@/components/PlayerDataProvider";
import { GAME_START_EVENT } from "@/components/PlayNowButton";
import { shouldUseTouchViewportLayer as shouldUseTouchViewportLayerForDevice } from "@/lib/touchViewport.mjs";
import { trackEvent } from "./GoogleAnalytics";

export interface GameFrameProps {
  slug: string;
  title: string;
  thumbnail: string;
  launchHref: string;
  fallbackThumbnail?: string;
  orientation?: "landscape" | "portrait" | "both";
}

function shouldUseTouchViewportLayer(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const hasCoarsePointer = window.matchMedia?.("(pointer: coarse)").matches
    || window.matchMedia?.("(any-pointer: coarse)").matches
    || false;
  const screenWidth = window.screen?.width || window.innerWidth;
  const screenHeight = window.screen?.height || window.innerHeight;

  // iPadOS can request desktop websites and identify itself as Macintosh.
  // Capability checks keep those iPads, wide phones and Android tablets in
  // the full-viewport player without changing mouse-first desktop layouts.
  return shouldUseTouchViewportLayerForDevice({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    coarsePointer: hasCoarsePointer,
    screenWidth,
    screenHeight,
  });
}

export default function GameFrame(props: GameFrameProps) {
  const { slug, title, thumbnail, launchHref, fallbackThumbnail, orientation } = props;
  const t = getDict(localeFromPathname(usePathname()));
  const sourceName = "playgama";
  const embedSrc = getPlaygamaEmbedUrl(slug);
  const [playing, setPlaying] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [justEnded, setJustEnded] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [mobileViewport, setMobileViewport] = useState<{
    height: number;
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const frameRootRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const startButtonRef = useRef<HTMLAnchorElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const loadedForRoundRef = useRef(false);
  const { recordGamePlay } = usePlayerData();

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
    trackEvent(sourceName + "_game_end", params);
  }

  const start = useCallback(() => {
    if (startedAtRef.current !== null) return;
    setPlaying(true);
    setIframeLoaded(false);
    setJustEnded(false);
    setStatusMessage(t.gameFrame.loading.replace("{title}", title));
    loadedForRoundRef.current = false;
    startedAtRef.current = Date.now();
    const params = {
      game_slug: slug,
      game_title: title,
    };
    trackEvent("game_start", params);
    trackEvent(`${sourceName}_game_start`, params);
    recordGamePlay(slug);
    requestAnimationFrame(() => statusRef.current?.focus());

    const wantsFullscreen = shouldUseTouchViewportLayer();

    if (!wantsFullscreen) return;
    setMobileExpanded(true);

    const frame = frameRootRef.current;
    if (!frame?.requestFullscreen) return;
    try {
      const result = frame.requestFullscreen({ navigationUI: "hide" });
      if (result && typeof result.catch === "function") {
        result.catch(() => {});
      }
    } catch {
      // iPhone Safari may deny the Fullscreen API. The fixed mobile layer below
      // remains the reliable fallback and still fills the visible viewport.
    }
  }, [recordGamePlay, slug, t.gameFrame.loading, title]);

  function stop() {
    fireGameEnd();
    setPlaying(false);
    setMobileExpanded(false);
    setMobileViewport(null);
    setJustEnded(true);
    setStatusMessage("");
    requestAnimationFrame(() => startButtonRef.current?.focus());
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  useEffect(() => {
    if (!playing || !mobileExpanded) return;

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;

    function syncViewport() {
      const viewport = window.visualViewport;
      setMobileViewport({
        height: Math.round(viewport?.height ?? window.innerHeight),
        left: Math.round(viewport?.offsetLeft ?? 0),
        top: Math.round(viewport?.offsetTop ?? 0),
        width: Math.round(viewport?.width ?? window.innerWidth),
      });
    }

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    syncViewport();
    window.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("scroll", syncViewport);

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
      window.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("scroll", syncViewport);
    };
  }, [mobileExpanded, playing]);

  useEffect(() => {
    if (!playing) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.fullscreenElement) stop();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    function onExternalStart(event: Event) {
      const detail = (event as CustomEvent<{ slug?: string }>).detail;
      if (detail?.slug !== slug) return;
      start();
    }

    window.addEventListener(GAME_START_EVENT, onExternalStart);
    return () => window.removeEventListener(GAME_START_EVENT, onExternalStart);
  }, [slug, start]);

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
      trackEvent(sourceName + "_game_end", params);
    }
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      onUnload();
    };
  }, [slug, title, sourceName]);

  return (
    <div
      ref={frameRootRef}
      data-orientation={orientation}
      className={mobileExpanded && playing
        ? "fixed z-[200] overflow-hidden rounded-none bg-black"
        : "relative aspect-video overflow-hidden rounded-2xl bg-surface md:aspect-[21/9]"}
      style={mobileExpanded && playing
        ? {
            height: mobileViewport ? `${mobileViewport.height}px` : "100dvh",
            left: mobileViewport ? `${mobileViewport.left}px` : 0,
            top: mobileViewport ? `${mobileViewport.top}px` : 0,
            width: mobileViewport ? `${mobileViewport.width}px` : "100vw",
          }
        : undefined}
    >
      <p
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
        className="sr-only"
      >
        {statusMessage}
      </p>
      {playing ? (
        <>
          <div
            className="absolute flex justify-center bg-black"
            style={mobileExpanded
              ? {
                  top: "calc(env(safe-area-inset-top) + 3.5rem)",
                  right: "env(safe-area-inset-right)",
                  bottom: "env(safe-area-inset-bottom)",
                  left: "env(safe-area-inset-left)",
                }
              : { inset: 0 }}
          >
            <div
              className={mobileExpanded ? "game-viewport-stage relative h-full w-full" : "relative h-full w-full"}
              data-game-orientation={orientation ?? "both"}
            >
              <iframe
                ref={iframeRef}
                src={embedSrc}
                title={title}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer-when-downgrade"
                loading="lazy"
                onLoad={() => {
                  if (loadedForRoundRef.current) return;
                  loadedForRoundRef.current = true;
                  setIframeLoaded(true);
                  setStatusMessage(t.gameFrame.ready);
                  trackEvent("game_loaded", {
                    game_slug: slug,
                    game_title: title,
                  });
                }}
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
          {!iframeLoaded ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center bg-surface animate-pulse pointer-events-none"
            >
              <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            </div>
          ) : null}
          {mobileExpanded ? (
            <div
              className="absolute inset-x-0 top-0 z-[220] flex h-[calc(3.5rem+env(safe-area-inset-top))] items-end justify-between gap-3 border-b border-white/10 bg-bg px-3 pb-2 shadow-xl"
              style={{
                paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
                paddingRight: "max(0.75rem, env(safe-area-inset-right))",
              }}
            >
              <button
                type="button"
                onClick={stop}
                aria-label={t.gameFrame.exitFullscreen}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-surface-elevated px-3 font-bold text-text-primary transition hover:bg-surface focus-visible:outline-offset-4"
              >
                <X className="h-5 w-5" aria-hidden="true" />
                <span>{t.gameFrame.exitFullscreen}</span>
              </button>
              <span className="truncate font-latin text-sm font-bold text-text-secondary" dir="auto">
                {title}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={stop}
              aria-label={t.gameFrame.exitFullscreen}
              className="absolute left-3 top-3 z-[220] inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-bg/90 text-text-primary shadow-2xl backdrop-blur transition hover:bg-bg focus-visible:outline-offset-4"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </>
      ) : (
        <>
          <a
            ref={startButtonRef}
            href={launchHref}
            onClick={(event) => {
              event.preventDefault();
              start();
            }}
            aria-label={t.common.playAria + title}
            className="group absolute inset-0 block"
            data-game-slug={slug}
            data-placement="game-frame"
          >
            <GameArtwork
              src={thumbnail}
              fallbackSrc={fallbackThumbnail}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-cover"
              preload
            />
            <span className="absolute inset-0 bg-bg/50 flex items-center justify-center transition group-hover:bg-bg/40">
              <span className="w-20 h-20 md:w-24 md:h-24 min-w-12 min-h-12 rounded-full bg-primary flex items-center justify-center glow-pink group-hover:scale-110 transition-transform duration-200">
                <Play
                  className="w-10 h-10 md:w-12 md:h-12 text-[#090913] fill-[#090913] ms-1"
                  aria-hidden="true"
                />
              </span>
            </span>
          </a>
          {justEnded ? (
            <a
              href="#related-games"
              onClick={() => {
                trackEvent("playgama_play_more_click", { game_slug: slug });
                setJustEnded(false);
              }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-primary text-[#090913] font-bold px-5 py-3 rounded-2xl min-h-12 inline-flex items-center gap-2 glow-pink hover:scale-105 hover:brightness-110 transition-all duration-200"
              aria-label={t.gameFrame.similarHeading}
            >
              <span>{t.gameFrame.playAnother}</span>
              <ArrowDown className="w-5 h-5" aria-hidden="true" />
            </a>
          ) : null}
        </>
      )}
    </div>
  );
}
