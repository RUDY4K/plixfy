/**
 * Procedural beeps for Slither Trail. Independent from Flap Hero's audio
 * module so each game can tune timbre to taste without coupling.
 */

interface BeepOpts {
  frequency: number;
  durationMs: number;
  volume?: number;
  type?: OscillatorType;
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
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setMuted(value: boolean): void {
  muted = value;
}

function beep(opts: BeepOpts): void {
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
  gain.gain.setValueAtTime(opts.volume ?? 0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + seconds + 0.02);
}

export const sounds = {
  eat: () => beep({ frequency: 660, durationMs: 80, type: 'sine', volume: 0.11 }),
  special: () =>
    beep({ frequency: 760, durationMs: 160, type: 'triangle', volume: 0.14, sweep: 280 }),
  crash: () =>
    beep({ frequency: 220, durationMs: 280, type: 'sawtooth', volume: 0.22, sweep: -140 }),
  turn: () => beep({ frequency: 380, durationMs: 25, type: 'square', volume: 0.03 }),
};
