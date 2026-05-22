import type { Metadata } from 'next';
import { SignUp } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create a free Plixfy account to save favorites across devices, comment, rate, and climb leaderboards.',
  alternates: { canonical: '/sign-up' },
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
      <h1 className="mb-2 text-2xl font-extrabold">Join Plixfy</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Free forever. Save favorites across devices. Climb the leaderboards.
      </p>
      <SignUp />
      <p className="mt-6 text-xs text-neutral-500">
        Login is optional — every game on Plixfy plays without an account.
      </p>
    </div>
  );
}
