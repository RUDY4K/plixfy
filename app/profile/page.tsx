import type { Metadata } from 'next';
import ProfileView from './ProfileView';

export const metadata: Metadata = {
  title: 'Your Profile',
  description: 'Your Plixfy profile — achievements, play time, and game stats.',
  alternates: { canonical: '/profile' },
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileView />;
}
