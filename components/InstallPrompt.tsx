'use client';

import { useEffect, useState } from 'react';

/**
 * "Add Plixfy to Home Screen" banner.
 *
 * Listens for the browser-native `beforeinstallprompt` event (Chrome /
 * Edge / Samsung Internet on Android) and lets the user trigger the
 * install dialog. Hidden:
 *   • on desktop (we only show this for touch-pointer + narrow viewport)
 *   • once dismissed (24h cooldown stored in localStorage)
 *   • after install (`appinstalled` event)
 *   • when the page is already running in standalone mode
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'plixfy:install-dismissed-at';
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    // iOS Safari uses a non-standard navigator.standalone
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const touch = window.matchMedia?.('(pointer: coarse)').matches === true;
  const narrow = window.matchMedia?.('(max-width: 768px)').matches === true;
  return touch || narrow;
}

function recentlyDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY) ?? '0');
    return Number.isFinite(at) && Date.now() - at < COOLDOWN_MS;
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || !isMobile() || recentlyDismissed()) return;

    function onPrompt(e: Event) {
      // Prevent Chrome's mini-info bar from auto-showing; we own the UX.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function onInstalled() {
      setVisible(false);
      setDeferred(null);
    }

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!visible || !deferred) return null;

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice; // Outcome handled by `appinstalled` listener.
    setVisible(false);
    setDeferred(null);
  }

  function handleDismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Best-effort — banner just won't suppress next visit.
    }
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Install Plixfy"
      className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-sm rounded-2xl border border-cyan-500/30 bg-neutral-950/95 p-3 shadow-2xl backdrop-blur md:bottom-6 md:left-6 md:right-auto md:mx-0"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/15 text-xl"
        >
          📱
        </span>
        <div className="flex-1 leading-tight">
          <p className="text-sm font-bold text-white">Add Plixfy to Home Screen</p>
          <p className="text-[11px] text-neutral-400">Play offline, no browser bar.</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-400 hover:text-white"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-bold text-neutral-950 transition hover:bg-cyan-400"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
