import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
          <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-green-400 to-emerald-600" />
          PlayHub
        </Link>
        <nav className="flex items-center gap-5 text-sm text-neutral-400">
          <Link href="/" className="hover:text-white transition">Games</Link>
          <Link href="/about" className="hover:text-white transition">About</Link>
        </nav>
      </div>
    </header>
  );
}
