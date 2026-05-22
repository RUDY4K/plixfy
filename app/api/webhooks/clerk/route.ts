import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * Clerk → Supabase user-sync webhook.
 *
 * Configure once in Clerk Dashboard:
 *   1. Webhooks → "Add Endpoint"
 *   2. URL: https://<your-prod-domain>/api/webhooks/clerk
 *      (or use ngrok / `clerk localdev` for local development)
 *   3. Subscribe to events: user.created, user.updated, user.deleted
 *   4. Copy "Signing Secret" → CLERK_WEBHOOK_SIGNING_SECRET in env
 *
 * Svix signature verification is mandatory — without it, anyone who knows
 * the URL could create users in our DB.
 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    log.error('CLERK_WEBHOOK_SIGNING_SECRET not configured');
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'missing svix headers' }, { status: 400 });
  }

  const body = await req.text();
  let event: WebhookEvent;
  try {
    event = new Webhook(secret).verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    log.warn('clerk webhook signature failed', err);
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  try {
    if (event.type === 'user.created' || event.type === 'user.updated') {
      const { id, username, first_name, last_name, image_url, email_addresses } = event.data;
      const primaryEmail = email_addresses?.[0]?.email_address ?? null;
      const baseHandle =
        username?.trim() ||
        first_name?.trim() ||
        primaryEmail?.split('@')[0] ||
        'player';
      // Make-unique fallback: append last 4 of Clerk id so collisions on
      // common handles ("john", "alex") resolve deterministically.
      const safeUsername = `${baseHandle}_${id.slice(-4)}`
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 24) || `player_${id.slice(-6)}`;
      const fullName = [first_name, last_name].filter(Boolean).join(' ').trim() || null;

      const { error } = await supabase
        .from('users')
        .upsert(
          {
            clerk_id: id,
            username: safeUsername,
            avatar_url: image_url || null,
          },
          { onConflict: 'clerk_id' },
        );
      if (error) {
        log.error('clerk user upsert failed', { id, error: error.message });
        return NextResponse.json({ error: 'db upsert failed' }, { status: 500 });
      }
      log.info('clerk user synced', { id, username: safeUsername, fullName });
    }

    if (event.type === 'user.deleted') {
      const { id } = event.data;
      if (id) {
        const { error } = await supabase.from('users').delete().eq('clerk_id', id);
        if (error) log.warn('clerk user delete failed', { id, error: error.message });
      }
    }
  } catch (err) {
    log.error('clerk webhook handler error', err);
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
