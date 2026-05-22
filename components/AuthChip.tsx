'use client';

import Link from 'next/link';
import { useUser, UserButton } from '@clerk/nextjs';

/**
 * Header auth widget. Renders nothing until Clerk has hydrated so we
 * don't flash a "Sign in" button at signed-in users.
 *
 * Clerk 7 removed the `<SignedIn>` / `<SignedOut>` slot components in
 * favor of the `useUser()` hook for client-side conditional UI.
 */
export default function AuthChip() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return null;
  if (isSignedIn) {
    return (
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'h-7 w-7 ring-1 ring-neutral-700',
          },
        }}
      />
    );
  }
  return (
    <Link
      href="/sign-in"
      className="rounded-md border border-cyan-500/60 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
    >
      Sign in
    </Link>
  );
}
