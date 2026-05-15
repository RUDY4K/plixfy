'use client';

import { useEffect, useRef } from 'react';
import { trackAd } from '@/lib/analytics';

interface AdSenseSlotProps {
  slot: string;
  client: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  fullWidthResponsive?: boolean;
  width?: number;
  height?: number;
  placement: string;
  game?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Renders a single AdSense ad unit. The loader script (AdSenseScript) must
 * already be on the page — this component just declares the slot and pushes
 * it into `adsbygoogle` so Google fills it.
 */
export default function AdSenseSlot({
  slot,
  client,
  format = 'auto',
  fullWidthResponsive = true,
  width,
  height,
  placement,
  game,
  className,
}: AdSenseSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
      trackAd('impression', placement, game);
    } catch (err) {
      trackAd('error', placement, game);
      // eslint-disable-next-line no-console
      console.warn('adsbygoogle push failed', err);
    }
  }, [placement, game]);

  const style: React.CSSProperties = {
    display: 'block',
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <ins
      className={`adsbygoogle ${className ?? ''}`.trim()}
      style={style}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
    />
  );
}
