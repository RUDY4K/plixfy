'use server';

import { revalidatePath } from 'next/cache';
import { requireDbUser } from '@/lib/users';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sanitizeCommentText, REPORT_HIDE_THRESHOLD } from '@/lib/comments';
import { log } from '@/lib/logger';

interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Server actions powering the Comments component. All paths:
 *   1. Verify Clerk auth via requireDbUser() (throws if anon).
 *   2. Use service-role Supabase client (RLS bypassed; we authorize ourselves).
 *   3. Revalidate the game page so the new comment shows up on next render.
 */

export async function postComment(formData: FormData): Promise<ActionResult> {
  const gameSlug = String(formData.get('gameSlug') ?? '').trim();
  const raw = String(formData.get('text') ?? '');
  if (!gameSlug) return { ok: false, error: 'Missing game.' };
  const text = sanitizeCommentText(raw);
  if (!text) return { ok: false, error: 'Comment must be 1–500 characters.' };

  let user;
  try {
    user = await requireDbUser();
  } catch {
    return { ok: false, error: 'Please sign in to comment.' };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: user.id, game_slug: gameSlug, text })
    .select('id')
    .single();
  if (error) {
    log.warn('postComment insert failed', error.message);
    return { ok: false, error: 'Could not post comment. Try again.' };
  }

  // Drop an activity row so the homepage feed picks this up.
  await supabase.from('activity').insert({
    user_id: user.id,
    verb: 'commented',
    game_slug: gameSlug,
    payload: { comment_id: data.id, preview: text.slice(0, 80) },
  });

  revalidatePath(`/games/${gameSlug}`);
  return { ok: true };
}

export async function voteOnComment(
  commentId: number,
  vote: 'up' | 'down',
): Promise<ActionResult> {
  if (!Number.isFinite(commentId) || commentId <= 0) {
    return { ok: false, error: 'Bad comment id.' };
  }

  let user;
  try {
    user = await requireDbUser();
  } catch {
    return { ok: false, error: 'Please sign in to vote.' };
  }

  const supabase = getSupabaseAdmin();
  // Toggle: same vote clears, different vote replaces.
  const { data: existing } = await supabase
    .from('comment_votes')
    .select('vote')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing && existing.vote === vote) {
    const { error } = await supabase
      .from('comment_votes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id);
    if (error) return { ok: false, error: 'Could not update vote.' };
  } else {
    const { error } = await supabase
      .from('comment_votes')
      .upsert({ comment_id: commentId, user_id: user.id, vote });
    if (error) return { ok: false, error: 'Could not update vote.' };
  }

  // Look up the game_slug to revalidate the right page.
  const { data: comment } = await supabase
    .from('comments')
    .select('game_slug')
    .eq('id', commentId)
    .maybeSingle();
  if (comment?.game_slug) revalidatePath(`/games/${comment.game_slug}`);
  return { ok: true };
}

export async function reportComment(commentId: number): Promise<ActionResult> {
  if (!Number.isFinite(commentId) || commentId <= 0) {
    return { ok: false, error: 'Bad comment id.' };
  }

  try {
    await requireDbUser();
  } catch {
    return { ok: false, error: 'Please sign in to report.' };
  }

  const supabase = getSupabaseAdmin();
  const { data: current, error: readErr } = await supabase
    .from('comments')
    .select('id, reports, game_slug, hidden')
    .eq('id', commentId)
    .maybeSingle();
  if (readErr || !current) return { ok: false, error: 'Comment not found.' };
  if (current.hidden) return { ok: true };

  const nextReports = current.reports + 1;
  const { error } = await supabase
    .from('comments')
    .update({
      reports: nextReports,
      hidden: nextReports >= REPORT_HIDE_THRESHOLD,
    })
    .eq('id', commentId);
  if (error) return { ok: false, error: 'Could not report comment.' };

  revalidatePath(`/games/${current.game_slug}`);
  return { ok: true };
}
