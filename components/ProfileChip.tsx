'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProfile } from '@/lib/profile';
import ProfileSetupModal from './ProfileSetupModal';

/**
 * Small avatar + nickname pill in the header. Two states:
 *   - No profile yet → "👋 Sign in" → opens setup modal.
 *   - Profile saved → avatar + nickname → links to /profile.
 *
 * Mounted client-only so the SSR'd header has a stable structure and we
 * avoid hydration mismatches.
 */
export default function ProfileChip() {
  const profile = useProfile();
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!profile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 hover:text-emerald-200"
        >
          <span aria-hidden="true">👋</span>
          <span>Sign in</span>
        </button>
        <ProfileSetupModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </>
    );
  }

  return (
    <Link
      href="/profile"
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-neutral-200 transition hover:border-emerald-500/60 hover:text-white"
      aria-label={`Profile: ${profile.nickname}`}
    >
      <span aria-hidden="true" className="text-base leading-none">{profile.avatar}</span>
      <span className="max-w-[7rem] truncate">{profile.nickname}</span>
    </Link>
  );
}
