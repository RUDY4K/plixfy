'use client';

import { useEffect, useId, useState } from 'react';
import {
  AVATARS,
  randomAvatar,
  randomNickname,
  sanitizeNickname,
  saveProfile,
  type Profile,
} from '@/lib/profile';

interface ProfileSetupModalProps {
  open: boolean;
  initial?: Profile | null;
  onClose: () => void;
  onSaved?: (p: Profile) => void;
}

/**
 * First-run nickname + avatar picker. Pre-fills a fun random combo so the
 * user can hit Save without typing — but they can edit either field.
 *
 * COPPA-safe by design: copy explicitly warns against using a real name.
 */
export default function ProfileSetupModal({ open, initial, onClose, onSaved }: ProfileSetupModalProps) {
  const [nickname, setNickname] = useState(() => initial?.nickname ?? randomNickname());
  const [avatar, setAvatar] = useState(() => initial?.avatar ?? randomAvatar());
  const [error, setError] = useState<string | null>(null);
  const headingId = useId();

  useEffect(() => {
    if (!open) return;
    if (!initial) {
      setNickname(randomNickname());
      setAvatar(randomAvatar());
    } else {
      setNickname(initial.nickname);
      setAvatar(initial.avatar);
    }
    setError(null);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleSave() {
    const cleaned = sanitizeNickname(nickname);
    if (cleaned.length < 2) {
      setError('Pick a nickname with at least 2 characters');
      return;
    }
    const saved = saveProfile({ nickname: cleaned, avatar });
    if (!saved) {
      setError('Couldn’t save — try a different nickname or avatar');
      return;
    }
    onSaved?.(saved);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id={headingId} className="text-lg font-bold text-white sm:text-xl">
            {initial ? 'Edit your profile' : 'Pick your player'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            ×
          </button>
        </div>

        <p className="mb-4 text-xs text-neutral-400">
          Make up a nickname — never use your real name. Saved on this device only.
        </p>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-400">Nickname</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 15))}
              maxLength={15}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-cyan-500 focus:outline-none"
              placeholder="CosmicNinja42"
            />
            <button
              type="button"
              onClick={() => setNickname(randomNickname())}
              aria-label="Randomize nickname"
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 text-sm text-neutral-300 transition hover:border-neutral-600 hover:text-white"
              title="Random"
            >
              🎲
            </button>
          </div>
        </label>

        <fieldset className="mb-5">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Avatar</legend>
          <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-10">
            {AVATARS.map((a) => {
              const selected = a === avatar;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  aria-pressed={selected}
                  aria-label={`Avatar ${a}`}
                  className={`flex aspect-square items-center justify-center rounded-lg border text-xl transition ${
                    selected
                      ? 'border-cyan-500 bg-cyan-500/15 scale-110'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p className="mb-3 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:border-neutral-600 hover:text-white"
          >
            {initial ? 'Cancel' : 'Maybe later'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-cyan-400"
          >
            {initial ? 'Save' : 'Let’s play →'}
          </button>
        </div>
      </div>
    </div>
  );
}
