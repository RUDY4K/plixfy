"use client";

import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { getConsent, onConsentChange } from "@/lib/consent";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSED_AT_KEY = "plixfy-install-prompt-dismissed-at";
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function isRunningStandalone(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isMobileDevice(): boolean {
  return window.matchMedia("(max-width: 767px)").matches || navigator.maxTouchPoints > 1;
}

function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export default function InstallAppPrompt({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!isMobileDevice() || isRunningStandalone()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY) ?? 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return;

    const ios = isIOSDevice();
    setIsIOS(ios);

    let consentReady = getConsent() !== null || "__tcfapi" in window;
    let revealTimer: number | undefined;

    const scheduleReveal = () => {
      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => setVisible(true), 5000);
    };

    if (consentReady) scheduleReveal();

    const unsubscribeConsent = onConsentChange(() => {
      consentReady = true;
      scheduleReveal();
    });

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      if (consentReady) setVisible(true);
    };

    const onInstalled = () => {
      localStorage.removeItem(DISMISSED_AT_KEY);
      setVisible(false);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.clearTimeout(revealTimer);
      unsubscribeConsent();
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
  };

  if (!visible) return null;

  const copy =
    locale === "ar"
      ? {
          title: "خلّ بليكسفاي مثل التطبيق",
          direct: "ثبّته على جوالك وافتحه من الشاشة الرئيسية بلمسة واحدة.",
          ios: "تقدر تثبّته من Safari ليظهر مع تطبيقات جوالك.",
          iosSteps: "مشاركة ← إضافة إلى الشاشة الرئيسية",
          manual: "من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».",
          install: "ثبّت التطبيق",
          close: "إغلاق تنبيه تثبيت التطبيق",
        }
      : {
          title: "Use Plixfy like an app",
          direct: "Install it on your phone and launch it from your home screen.",
          ios: "Install it from Safari so it appears with your phone apps.",
          iosSteps: "Share → Add to Home Screen",
          manual: "Open your browser menu and choose “Install app” or “Add to Home Screen.”",
          install: "Install app",
          close: "Close app installation notice",
        };

  return (
    <aside
      role="dialog"
      aria-label={copy.title}
      className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[70] md:hidden"
    >
      <div className="mx-auto max-w-md rounded-2xl border border-primary/40 bg-bg/95 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.65),0_0_30px_rgba(168,85,247,0.18)] backdrop-blur-xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label={copy.close}
          className="absolute end-2 top-2 grid size-10 place-items-center rounded-full text-text-secondary hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className="flex items-start gap-3 pe-9">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 shadow-lg">
            <Smartphone className="size-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-text-primary">{copy.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              {isIOS ? copy.ios : installEvent ? copy.direct : copy.manual}
            </p>
          </div>
        </div>

        {installEvent ? (
          <button
            type="button"
            onClick={() => void install()}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 text-sm font-bold text-white shadow-lg active:scale-[0.98]"
          >
            <Download className="size-4" aria-hidden="true" />
            {copy.install}
          </button>
        ) : isIOS ? (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-text-secondary">
            <Share className="size-4" aria-hidden="true" />
            {copy.iosSteps}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
