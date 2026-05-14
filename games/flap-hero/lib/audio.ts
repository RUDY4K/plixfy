/**
 * Tiny WebAudio helper — generates short beeps procedurally so the game
 * needs zero audio asset files. Browsers gate AudioContext behind a user
 * gesture, so the context is created lazily and resumed on demand.
 */

interface BeepOpts {
  frequency: number;
  durationMs: number;
  volume?: number;
  type?: OscillatorType;
  /** Hz to slide toward by the end of the note. */
  sweep?: number;
}

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  return ctx;
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

export function beep(opts: BeepOpts): void {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  const seconds = opts.durationMs / 1000;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.frequency, now);
  if (opts.sweep) {
    osc.frequency.linearRampToValueAtTime(
      Math.max(20, opts.frequency + opts.sweep),
      now + seconds
    );
  }
  gain.gain.setValueAtTime(opts.volume ?? 0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + seconds + 0.02);
}

export const sounds = {
  flap: () => beep({ frequency: 580, durationMs: 70, type: 'square', volume: 0.08, sweep: 120 }),
  score: () => beep({ frequency: 880, durationMs: 110, type: 'triangle', volume: 0.12 }),
  crash: () =>
    beep({ frequency: 220, durationMs: 280, type: 'sawtooth', volume: 0.22, sweep: -160 }),
};
