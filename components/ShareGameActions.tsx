'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { topScore } from '@/lib/leaderboard';
import { buildChallengeUrl } from '@/lib/challenge';
import { buildTwitterUrl, buildWhatsappUrl, share } from '@/lib/share';

interface ShareGameActionsProps {
  slug: string;
  title: string;
}

/**
 * Two-button row beside the game: "Challenge a friend" and "Share".
 *
 * Challenge — needs a Clerk-authed player + a score on this game; if the
 * user isn't signed in we send them to /sign-in. If they're signed in but
 * haven't played a round yet we flash a hint. The challenge URL bakes the
 * score into the path so no backend is needed.
 *
 * Share — opens an action sheet (native Web Share if available, otherwise
 * Twitter / WhatsApp / copy-link).
 */
export default function ShareGameActions({ slug, title }: ShareGameActionsProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2000);
  }

  function handleChallenge() {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      router.push('/sign-in');
      return;
    }
    const score = topScore(slug);
    if (score == null) {
      flash('Play a round first, then challenge!');
      return;
    }
    const nickname = user.username ?? user.firstName ?? 'Player';
    // Clerk doesn't ship emoji avatars — use the first letter of the
    // handle (rendered as a glyph by the receiver's challenge page).
    const avatar = nickname.slice(0, 1).toUpperCase();
    const url = buildChallengeUrl(origin, slug, {
      score,
      nickname,
      avatar,
    });
    void share({
      title: `${title} — Challenge`,
      text: `I scored ${score.toLocaleString()} in ${title} on Plixfy. Beat it!`,
      url,
    }).then((result) => {
      if (result === 'copied') flash('Challenge link copied');
      else if (result === 'failed') flash('Share unavailable');
    });
  }

  const shareUrl = origin ? `${origin}/games/${slug}` : '';
  const shareText = `Playing ${title} on Plixfy — give it a try!`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleChallenge}
          className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-neutral-950 transition hover:bg-amber-300"
        >
          <span aria-hidden="true">⚔️</span>
          Challenge a friend
        </button>
        <button
          type="button"
          onClick={() => setActionsOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-semibold text-neutral-200 transition hover:border-cyan-500/60 hover:text-white"
          aria-expanded={actionsOpen}
        >
          <span aria-hidden="true">📤</span>
          Share
        </button>
        {toast && <span className="text-xs text-cyan-400">{toast}</span>}
      </div>

      {actionsOpen && (
        <div className="mt-2 flex flex-wrap gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-2">
          <a
            href={buildTwitterUrl({ title, text: shareText, url: shareUrl })}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-[#1da1f2]/20 px-2 py-1 text-xs font-semibold text-[#7cc8ff] transition hover:bg-[#1da1f2]/30"
          >
            𝕏 / Twitter
          </a>
          <a
            href={buildWhatsappUrl({ title, text: shareText, url: shareUrl })}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-[#25d366]/20 px-2 py-1 text-xs font-semibold text-[#7ce0a3] transition hover:bg-[#25d366]/30"
          >
            WhatsApp
          </a>
          <button
            type="button"
            onClick={async () => {
              const result = await share({ title, text: shareText, url: shareUrl });
              if (result === 'copied') flash('Link copied');
              else if (result === 'failed') flash('Share unavailable');
              setActionsOpen(false);
            }}
            className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs font-semibold text-neutral-200 transition hover:border-cyan-500/60 hover:text-white"
          >
            Copy link
          </button>
        </div>
      )}
    </>
  );
}
