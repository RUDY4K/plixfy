'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import type { CommentWithAuthor } from '@/lib/comments';
import { postComment, voteOnComment, reportComment } from '@/app/actions/comments';

const MAX_LEN = 500;

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

interface Props {
  gameSlug: string;
  initialComments: CommentWithAuthor[];
}

export default function Comments({ gameSlug, initialComments }: Props) {
  const { isSignedIn, isLoaded } = useUser();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // If the server revalidates and re-renders this component with new
  // initialComments, sync our optimistic state. Cheap deep-compare via
  // ids — comments are append-only newest-first so id-order changing
  // means there's something new.
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await postComment(new FormData(e.currentTarget));
      if (!result.ok) setError(result.error ?? 'Could not post.');
      else {
        setText('');
        formRef.current?.reset();
      }
    });
  }

  function handleVote(commentId: number, vote: 'up' | 'down') {
    // Optimistic UI: flip vote locally; server revalidation will reconcile.
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const wasUp = c.myVote === 'up';
        const wasDown = c.myVote === 'down';
        const nextMine = c.myVote === vote ? null : vote;
        let ups = c.ups - (wasUp ? 1 : 0) + (nextMine === 'up' ? 1 : 0);
        let downs = c.downs - (wasDown ? 1 : 0) + (nextMine === 'down' ? 1 : 0);
        ups = Math.max(0, ups);
        downs = Math.max(0, downs);
        return { ...c, myVote: nextMine, ups, downs };
      }),
    );
    startTransition(async () => {
      const r = await voteOnComment(commentId, vote);
      if (!r.ok) setError(r.error ?? 'Vote failed.');
    });
  }

  function handleReport(commentId: number) {
    if (!confirm('Report this comment as inappropriate?')) return;
    startTransition(async () => {
      const r = await reportComment(commentId);
      if (!r.ok) setError(r.error ?? 'Report failed.');
      else setError('Thanks — our team will review it.');
    });
  }

  const remaining = MAX_LEN - text.length;

  return (
    <section className="mt-8" aria-label="Comments">
      <h2 className="mb-3 text-lg font-bold">
        Comments <span className="text-neutral-500">({comments.length})</span>
      </h2>

      {isLoaded && !isSignedIn && (
        <div className="mb-4 rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-400">
          <Link href="/sign-in" className="font-semibold text-cyan-400 hover:underline">
            Sign in
          </Link>{' '}
          to join the conversation.
        </div>
      )}

      {isSignedIn && (
        <form ref={formRef} onSubmit={handleSubmit} className="mb-6">
          <input type="hidden" name="gameSlug" value={gameSlug} />
          <textarea
            name="text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            placeholder="Share your thoughts on this game..."
            rows={3}
            maxLength={MAX_LEN}
            className="w-full resize-y rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-cyan-500/60"
          />
          <div className="mt-1 flex items-center justify-between gap-3">
            <span
              className={`text-xs ${remaining < 50 ? 'text-amber-400' : 'text-neutral-500'}`}
            >
              {remaining} chars left
            </span>
            <button
              type="submit"
              disabled={busy || text.trim().length === 0}
              className="rounded-md bg-cyan-500 px-4 py-1.5 text-sm font-semibold text-neutral-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Posting…' : 'Post'}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-amber-400">{error}</p>}
        </form>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-neutral-500">Be the first to comment.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const score = c.ups - c.downs;
            return (
              <li
                key={c.id}
                className="rounded-lg border border-neutral-800/80 bg-neutral-900/50 p-3"
              >
                <header className="mb-1.5 flex items-center gap-2 text-xs">
                  <Avatar url={c.author.avatarUrl} name={c.author.username} />
                  <Link
                    href={`/profile/${encodeURIComponent(c.author.username)}`}
                    className="font-semibold text-neutral-200 hover:underline"
                  >
                    {c.author.username}
                  </Link>
                  <span className="text-neutral-600">·</span>
                  <time className="text-neutral-500" dateTime={c.createdAt}>
                    {timeAgo(c.createdAt)}
                  </time>
                </header>
                <p className="whitespace-pre-wrap break-words text-sm text-neutral-200">
                  {c.text}
                </p>
                <footer className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                  <button
                    type="button"
                    onClick={() => handleVote(c.id, 'up')}
                    aria-pressed={c.myVote === 'up'}
                    disabled={!isSignedIn || busy}
                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition hover:bg-neutral-800 ${
                      c.myVote === 'up' ? 'text-cyan-400' : ''
                    }`}
                  >
                    ▲ <span>{c.ups}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote(c.id, 'down')}
                    aria-pressed={c.myVote === 'down'}
                    disabled={!isSignedIn || busy}
                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition hover:bg-neutral-800 ${
                      c.myVote === 'down' ? 'text-rose-400' : ''
                    }`}
                  >
                    ▼ <span>{c.downs}</span>
                  </button>
                  {score !== 0 && (
                    <span className="text-neutral-600">
                      ({score > 0 ? '+' : ''}
                      {score})
                    </span>
                  )}
                  {isSignedIn && (
                    <button
                      type="button"
                      onClick={() => handleReport(c.id)}
                      className="ml-auto text-neutral-600 transition hover:text-amber-400"
                      title="Report"
                      aria-label={`Report comment by ${c.author.username}`}
                    >
                      ⚐ Report
                    </button>
                  )}
                </footer>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 rounded-full object-cover ring-1 ring-neutral-700"
        loading="lazy"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid h-5 w-5 place-items-center rounded-full bg-neutral-800 text-[10px] font-bold uppercase text-neutral-300"
    >
      {name.slice(0, 1)}
    </span>
  );
}
