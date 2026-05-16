import type { Metadata } from 'next';
import { GAMES } from '@/games/registry';
import FavoritesGrid from './FavoritesGrid';

export const metadata: Metadata = {
  title: 'My Favorites — PlayHub',
  description: 'Your saved games on PlayHub. Pick up where you left off.',
  alternates: { canonical: '/favorites' },
};

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">
        <span aria-hidden="true">♥ </span>My Favorites
      </h1>
      <p className="mt-2 max-w-xl text-neutral-400">
        Saved on this device. Hit the heart on any game card to keep it here.
      </p>
      <FavoritesGrid allGames={GAMES} />
    </div>
  );
}
