import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Plixfy to comment on games, rate, and climb the global leaderboards.',
  alternates: { canonical: '/sign-in' },
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
      <h1 className="mb-2 text-2xl font-extrabold">Welcome back</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Sign in to comment, rate games, and climb the global leaderboards.
      </p>
      <SignIn />
      <p className="mt-6 text-xs text-neutral-500">
        Login is optional — every game on Plixfy plays without an account.
      </p>
    </div>
  );
}
