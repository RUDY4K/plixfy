'use client';

import { log } from './logger';

/**
 * Outbound-share helpers — text-only intents. Each platform takes a
 * pre-baked URL with the message in the query string; we don't open
 * popups, the user clicks the link in their browser.
 */

export interface ShareInput {
  title: string;
  text: string;
  /** Absolute URL to share. */
  url: string;
}

export type ShareTarget = 'twitter' | 'whatsapp' | 'copy' | 'native';

export function buildTwitterUrl({ text, url }: ShareInput): string {
  const params = new URLSearchParams({ text: `${text} ${url}` });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildWhatsappUrl({ text, url }: ShareInput): string {
  const params = new URLSearchParams({ text: `${text} ${url}` });
  return `https://wa.me/?${params.toString()}`;
}

/**
 * Attempt native Web Share. Falls back to clipboard copy. Returns a
 * symbol describing what actually happened so the UI can show a toast.
 */
export async function share(input: ShareInput): Promise<'native' | 'copied' | 'failed'> {
  if (typeof navigator === 'undefined') return 'failed';
  try {
    if (navigator.share && typeof navigator.share === 'function') {
      await navigator.share(input);
      return 'native';
    }
  } catch (err) {
    log.warn('navigator.share failed', err);
    // Fall through to clipboard fallback below.
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${input.text} ${input.url}`);
      return 'copied';
    }
  } catch (err) {
    log.warn('clipboard write failed', err);
  }
  return 'failed';
}
