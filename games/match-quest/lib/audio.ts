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
  gain.gain.setValueAtTime(opts.volume ?? 0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + seconds + 0.02);
}

export const sounds = {
  flip: () => beep({ frequency: 520, durationMs: 50, type: 'square', volume: 0.06 }),
  match: () =>
    beep({ frequency: 720, durationMs: 180, type: 'triangle', volume: 0.13, sweep: 220 }),
  mismatch: () =>
    beep({ frequency: 240, durationMs: 140, type: 'sawtooth', volume: 0.1, sweep: -80 }),
  win: () =>
    beep({ frequency: 660, durationMs: 320, type: 'triangle', volume: 0.18, sweep: 420 }),
};
