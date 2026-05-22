import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from './supabase/admin';
import { isSupabaseConfigured } from './supabase/config';
import type { UserRow } from './supabase/types';
import { log } from './logger';

/**
 * Resolve the currently signed-in Clerk user to their public.users row.
 *
 * The webhook (/api/webhooks/clerk) keeps users in sync, but a fresh
 * sign-up can land on a page before the webhook fires (or local dev runs
 * without the webhook configured at all). To stay robust we lazily
 * provision the row on first read.
 *
 * Returns null when no Clerk user is signed in.
 */
export async function getCurrentDbUser(): Promise<UserRow | null> {
  if (!isSupabaseConfigured()) return null;
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = getSupabaseAdmin();

  const { data: existing, error: readErr } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .maybeSingle();

  if (readErr) {
    log.warn('db user read failed', { userId, error: readErr.message });
    return null;
  }
  if (existing) return existing as UserRow;

  // Lazy provision: webhook not yet fired (or not configured in dev).
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const baseHandle =
    clerkUser.username?.trim() ||
    clerkUser.firstName?.trim() ||
    clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    'player';
  const safeUsername =
    `${baseHandle}_${userId.slice(-4)}`
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 24) || `player_${userId.slice(-6)}`;

  const { data: inserted, error: insertErr } = await supabase
    .from('users')
    .upsert(
      {
        clerk_id: userId,
        username: safeUsername,
        avatar_url: clerkUser.imageUrl || null,
      },
      { onConflict: 'clerk_id' },
    )
    .select()
    .single();

  if (insertErr) {
    log.error('db user provision failed', { userId, error: insertErr.message });
    return null;
  }
  return inserted as UserRow;
}

/** Server-action assertion helper: throws a JSON-friendly error when not signed in. */
export async function requireDbUser(): Promise<UserRow> {
  const user = await getCurrentDbUser();
  if (!user) {
    const err = new Error('You must be signed in to do that.');
    err.name = 'AuthRequiredError';
    throw err;
  }
  return user;
}

export async function findUserByUsername(username: string): Promise<UserRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', username)
    .maybeSingle();
  if (error) {
    log.warn('user lookup by username failed', { username, error: error.message });
    return null;
  }
  return (data as UserRow) ?? null;
}
