import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { isSupabaseConfigured, SupabaseNotConfiguredError } from './config';

/**
 * Service-role Supabase client. BYPASSES RLS — never expose to the
 * browser. Use only in server actions / route handlers AFTER verifying
 * Clerk auth (`auth()` from `@clerk/nextjs/server`).
 *
 * The `server-only` import at the top makes Next.js fail the build with
 * a clear error if any module that imports this is reachable from a
 * client bundle.
 *
 * When env vars are placeholders (local dev / freshly-imported Vercel
 * project) we throw SupabaseNotConfiguredError early. All read helpers
 * pre-check `isSupabaseConfigured()` and return safe defaults; server
 * actions surface the error to the caller.
 */
let _admin: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    throw new SupabaseNotConfiguredError();
  }
  if (_admin) return _admin;
  _admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  return _admin;
}
