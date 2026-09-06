'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { getConsent, onConsentChange, onConsentCleared } from '@/lib/consent';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    plixfyAnalyticsInitialized?: string;
  }
}

const QUEUE_KEY = 'plixfy_ga_queue';
const DEDUP_PREFIX = 'plixfy_ga_once:';
const MAX_QUEUE = 50;
const BOT_REGEX = /bot|crawl|spider|headless|lighthouse|pingdom|gtmetrix|preview|insights/i;

function applyConsent(choice: 'accept' | 'reject'): void {
  if (typeof window === 'undefined') return;
  const granted = choice === 'accept';
  if (!granted) {
    try { localStorage.removeItem(QUEUE_KEY); } catch { /* storage unavailable */ }
  }
  if (!window.gtag) return;
  window.gtag('consent', 'update', {
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
  });
}

type EventParams = Record<string, unknown>;
type QueuedEvent = { name: string; params?: EventParams };

function isBot(): boolean {
  if (typeof navigator === 'undefined') return true;
  return BOT_REGEX.test(navigator.userAgent);
}

function readQueue(): QueuedEvent[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedEvent[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedEvent[]): void {
  try {
    const trimmed = queue.length > MAX_QUEUE ? queue.slice(-MAX_QUEUE) : queue;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    // quota or disabled — drop silently
  }
}

export function flushQueuedEvents(): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  if (getConsent() !== 'accept' || isBot()) return;
  const queue = readQueue();
  if (queue.length === 0) return;
  for (const { name, params } of queue) {
    window.gtag('event', name, params);
  }
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // ignore
  }
}

export function trackEvent(eventName: string, params?: EventParams): void {
  if (typeof window === 'undefined') return;
  if (isBot()) return;
  if (getConsent() !== 'accept') return;

  if (window.gtag) {
    flushQueuedEvents();
    window.gtag('event', eventName, params);
    return;
  }

  const queue = readQueue();
  queue.push({ name: eventName, params });
  writeQueue(queue);
}

export function trackEventOnce(
  dedupKey: string,
  eventName: string,
  params?: EventParams,
): void {
  if (typeof window === 'undefined') return;
  if (isBot()) return;
  if (getConsent() !== 'accept') return;
  try {
    if (sessionStorage.getItem(DEDUP_PREFIX + dedupKey) === '1') return;
    sessionStorage.setItem(DEDUP_PREFIX + dedupKey, '1');
  } catch {
    // sessionStorage unavailable — fire without dedup
  }
  trackEvent(eventName, params);
}

// onReady runs after the first load and again on later Script mounts. Checking
// consent here allows recovery if an earlier load completed while consent was off.
function initializeAnalytics(gaId: string): void {
  if (typeof window === 'undefined' || getConsent() !== 'accept' || isBot()) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer!.push(arguments); };
  applyConsent('accept');
  if (window.plixfyAnalyticsInitialized !== gaId) {
    window.gtag('js', new Date());
    window.gtag('config', gaId, {
      send_page_view: false,
      anonymize_ip: true,
      transport_type: 'beacon',
    });
    window.plixfyAnalyticsInitialized = gaId;
  }
  flushQueuedEvents();
}

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let previous = getConsent();
    applyConsent(previous ?? 'reject');
    setEnabled(previous === 'accept');
    const unsubscribeChange = onConsentChange((choice) => {
      const acceptedNow = choice === 'accept' && previous !== 'accept';
      previous = choice;
      applyConsent(choice);
      setEnabled(choice === 'accept');
      if (acceptedNow) {
        trackEvent('consent_accept', { consent_source: 'banner' });
      }
    });
    const unsubscribeClear = onConsentCleared(() => {
      previous = null;
      applyConsent('reject');
      setEnabled(false);
    });
    return () => { unsubscribeChange(); unsubscribeClear(); };
  }, []);

  if (!gaId || !enabled) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      strategy="lazyOnload"
      onReady={() => initializeAnalytics(gaId)}
    />
  );
}
