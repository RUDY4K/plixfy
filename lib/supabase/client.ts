'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Browser-side Supabase client. Uses the public anon key — RLS policies
 * enforce what anonymous visitors can read. Writes from the client are
 * never made directly; everything that mutates goes through a server
 * action that re-checks Clerk auth and uses the service-role client.
 *
 * Memoized per module to keep a single connection across hooks.
 */
let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowser() {
  if (_client) return _client;
  _client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return _client;
}
