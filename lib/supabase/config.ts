/**
 * Env-detection helpers. Phase 1 ships with placeholder Clerk/Supabase
 * keys in the example env so the local build runs cleanly without real
 * services. At runtime we want to skip every Supabase round-trip when
 * the env still looks unconfigured — both for local dev AND for the
 * Vercel build phase when a project has been imported but the env vars
 * haven't been filled in yet.
 *
 * `isSupabaseConfigured()` is the canonical guard — all read helpers
 * (lib/users, lib/comments, lib/ratings-server, ...) call this BEFORE
 * touching the network so no `fetch failed` errors land in the build
 * log.
 */

const PLACEHOLDER_HINTS = ['xxx', 'placeholder', 'your_', 'example'];

function looksPlaceholder(value: string | undefined | null): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  if (v.length < 10) return true;
  return PLACEHOLDER_HINTS.some((hint) => v.includes(hint));
}

/**
 * True when both the public Supabase URL and the service-role key look
 * like real values. We treat any URL containing `xxx`/`placeholder`/etc
 * as unconfigured to keep the contract simple — projects that legitimately
 * want one of those words in a host can lift the heuristic later.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (looksPlaceholder(url) || looksPlaceholder(serviceKey)) return false;
  try {
    const parsed = new URL(url as string);
    return parsed.hostname.endsWith('.supabase.co') || parsed.hostname.endsWith('.supabase.in') || parsed.hostname === 'localhost';
  } catch {
    return false;
  }
}

/**
 * True when both the public Supabase URL and the anon key look real.
 * Used by the browser client + cookie-based server client.
 */
export function isSupabaseBrowserConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (looksPlaceholder(url) || looksPlaceholder(anonKey)) return false;
  try {
    new URL(url as string);
    return true;
  } catch {
    return false;
  }
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase env vars not configured');
    this.name = 'SupabaseNotConfiguredError';
  }
}
