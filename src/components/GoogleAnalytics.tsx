'use client';

import Script from 'next/script';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const QUEUE_KEY = 'plixfy_ga_queue';
const DEDUP_PREFIX = 'plixfy_ga_once:';
const MAX_QUEUE = 50;
const BOT_REGEX = /bot|crawl|spider|headless|lighthouse|pingdom|gtmetrix|preview|insights/i;

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
  try {
    if (sessionStorage.getItem(DEDUP_PREFIX + dedupKey) === '1') return;
    sessionStorage.setItem(DEDUP_PREFIX + dedupKey, '1');
  } catch {
    // sessionStorage unavailable — fire without dedup
  }
  trackEvent(eventName, params);
}

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="lazyOnload"
      />
      <Script
        id="ga-init"
        strategy="lazyOnload"
        onLoad={flushQueuedEvents}
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            send_page_view: false,
            anonymize_ip: true,
            transport_type: 'beacon',
          });
        `}
      </Script>
    </>
  );
}
