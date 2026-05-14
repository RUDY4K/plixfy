import type { Metadata } from 'next';
import TestPhaserStage from './TestPhaserStage';

export const metadata: Metadata = {
  title: 'Phaser sanity check',
  robots: { index: false, follow: false },
};

export default function TestPhaserPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Phaser 4 — sanity check</h1>
      <p className="mb-6 text-sm text-neutral-400">
        If you see the green pulse and the “Hello Phaser 4” headline below, the
        Next.js 16 dynamic-import + <code>ssr:false</code> wiring is working.
      </p>
      <TestPhaserStage />
    </div>
  );
}
