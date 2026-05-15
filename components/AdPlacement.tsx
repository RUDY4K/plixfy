'use client';

import { useEffect, useState } from 'react';
import { hasConsent } from '@/lib/ads';
import AdSenseSlot from './AdSenseSlot';

export type AdSlot = 'top' | 'sidebar' | 'between' | 'above-game' | 'below-game' | 'footer';

interface AdPlacementProps {
  slot: AdSlot;
  label?: string;
  game?: string;
}

const sizeBySlot: Record<AdSlot, string> = {
  top: 'h-24',
  sidebar: 'h-[600px] w-[300px]',
  between: 'h-32',
  'above-game': 'h-24 w-full',
  'below-game': 'h-24',
  footer: 'h-24 w-full',
};

const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

/**
 * AdSense slot IDs per placement. Fill these in from your AdSense dashboard
 * once you have approved ad units — until then placement renders a styled
 * placeholder. Each slot ID is a 10-digit number assigned by AdSense.
 */
const SLOT_IDS: Record<AdSlot, string> = {
  top: '',
  sidebar: '',
  between: '',
  'above-game': '',
  'below-game': '',
  footer: '',
};

/**
 * Renders either a real AdSense slot or a dashed placeholder, depending on
 * whether (a) NEXT_PUBLIC_ADSENSE_CLIENT_ID is set, (b) the user has accepted
 * cookies, and (c) a SLOT_ID has been configured for this placement.
 */
export default function AdPlacement({ slot, label, game }: AdPlacementProps) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(hasConsent());
    const onChange = () => setConsented(hasConsent());
    window.addEventListener('playhub:consent-change', onChange);
    return () => window.removeEventListener('playhub:consent-change', onChange);
  }, []);

  const adSlotId = SLOT_IDS[slot];
  const showReal = Boolean(CLIENT_ID && consented && adSlotId);

  if (showReal) {
    return (
      <div className={sizeBySlot[slot]} data-ad-slot={slot}>
        <AdSenseSlot
          client={CLIENT_ID!}
          slot={adSlotId}
          format={slot === 'sidebar' ? 'vertical' : 'auto'}
          placement={slot}
          game={game}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center rounded-lg border border-dashed border-neutral-800 bg-neutral-900/40 text-xs uppercase tracking-wider text-neutral-600 ${sizeBySlot[slot]}`}
      data-ad-slot={slot}
    >
      {label ?? `Ad · ${slot}`}
    </div>
  );
}
