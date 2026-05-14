import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-900 bg-neutral-950 py-8 text-sm text-neutral-500">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <p>© {new Date().getFullYear()} PlayHub. Free browser games, no download required.</p>
        <nav className="flex items-center gap-4">
          <Link href="/about" className="hover:text-white transition">About</Link>
          <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
