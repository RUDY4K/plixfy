import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from './types';
import { isSupabaseBrowserConfigured, SupabaseNotConfiguredError } from './config';

/**
 * Server-side anon Supabase client for use in Server Components and Server
 * Actions where we only need to READ public data. RLS still applies — the
 * client is unauthenticated as far as Postgres is concerned. Cookie passing
 * is here for completeness (so future Supabase native auth works) but is
 * unused under the Clerk+service-role pattern.
 *
 * Throws SupabaseNotConfiguredError when env still looks like placeholders.
 */
export async function getSupabaseServer() {
  if (!isSupabaseBrowserConfigured()) {
    throw new SupabaseNotConfiguredError();
  }
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component context — cookie setting throws; safe to ignore
            // because middleware will refresh the session on next navigation.
          }
        },
      },
    },
  );
}
