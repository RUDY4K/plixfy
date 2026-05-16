'use client';

import { useEffect } from 'react';
import { recordPlay } from '@/lib/userStateClient';

/**
 * Fire-and-forget hook that records a play event when the game-detail
 * page mounts. Renders nothing. Lives in its own component so the parent
 * page can stay a Server Component.
 */
export default function PlayTracker({ slug }: { slug: string }) {
  useEffect(() => {
    recordPlay(slug);
  }, [slug]);
  return null;
}
