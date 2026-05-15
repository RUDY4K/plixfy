'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EmbedAspect } from '@/types/game';

interface EmbedGameProps {
  embedUrl: string;
  title: string;
  aspect?: EmbedAspect;
}

const aspectClassMap: Record<EmbedAspect, string> = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '3:4': 'aspect-[3/4] max-w-md mx-auto',
};

/**
 * Responsive iframe wrapper for third-party HTML5 games. Provider-agnostic;
 * works with any `embedUrl` (GameDistribution, GameMonetize, GamePix, etc).
 *
 * Fullscreen targets the wrapper div rather than the iframe — more reliable
 * across providers and avoids iOS Safari quirks with iframe-direct fullscreen.
 */
export default function EmbedGame({ embedUrl, title, aspect = '16:9' }: EmbedGameProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Browser denied (e.g. no user gesture, or permission policy) — silently ignore.
    }
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full overflow-hidden rounded-xl border border-neutral-800 bg-black ${aspectClassMap[aspect]}`}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 text-sm text-neutral-500">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-neutral-300" />
            <span>Loading {title}…</span>
          </div>
        </div>
      )}

      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-orientation-lock"
        allow="autoplay; fullscreen; gamepad; gyroscope; accelerometer"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />

      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        className="absolute right-3 top-3 z-10 rounded-md bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/80"
      >
        {isFullscreen ? '⤢ Exit' : '⤢ Fullscreen'}
      </button>
    </div>
  );
}
