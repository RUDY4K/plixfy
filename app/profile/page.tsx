import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getCurrentDbUser } from '@/lib/users';
import { getUserPublicProfile, type PublicProfileData } from '@/lib/profile-server';
import ProfileDashboard from './ProfileDashboard';

export const metadata: Metadata = {
  title: 'Your Profile',
  description: 'Your Plixfy profile — achievements, play time, and game stats.',
  alternates: { canonical: '/profile' },
  robots: { index: false, follow: false },
};

/**
 * Personal /profile dashboard. Gated by Clerk on the server — anonymous
 * visitors are redirected to /sign-in with /profile as the return URL.
 *
 * We fetch the Supabase-backed slice (favorites, top scores, recent
 * activity, comments-count, games-played) here so the page hydrates
 * with real numbers; play-time / streak / achievements live in
 * localStorage and are hydrated client-side inside <ProfileDashboard>.
 */
export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/profile');
  }

  const [clerkUser, dbUser] = await Promise.all([
    currentUser(),
    getCurrentDbUser().catch(() => null),
  ]);

  if (!clerkUser) {
    redirect('/sign-in?redirect_url=/profile');
  }

  let serverProfile: PublicProfileData | null = null;
  if (dbUser) {
    serverProfile = await getUserPublicProfile(dbUser.id).catch(() => null);
  }

  const displayName =
    clerkUser.username ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    'Player';

  return (
    <ProfileDashboard
      displayName={displayName}
      avatarUrl={clerkUser.imageUrl || null}
      memberSinceIso={new Date(clerkUser.createdAt ?? Date.now()).toISOString()}
      publicUsername={dbUser?.username ?? null}
      serverProfile={serverProfile}
    />
  );
}
