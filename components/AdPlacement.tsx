interface AdPlacementProps {
  slot: 'top' | 'sidebar' | 'between' | 'below-game';
  label?: string;
}

const sizeBySlot: Record<AdPlacementProps['slot'], string> = {
  top: 'h-24',
  sidebar: 'h-[600px] w-[300px]',
  between: 'h-32',
  'below-game': 'h-24',
};

/**
 * Visible placeholder for ad slots. Swapped for real ad code in Prompt 8.
 * Until then it just reserves the layout space and labels itself for QA.
 */
export default function AdPlacement({ slot, label }: AdPlacementProps) {
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
