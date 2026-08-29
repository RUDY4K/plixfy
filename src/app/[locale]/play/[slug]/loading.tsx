export default function LoadingGamePage() {
  return (
    <main
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
      aria-busy="true"
    >
      <div className="sr-only" role="status" aria-live="polite">
        <span lang="ar">جارٍ تحميل صفحة اللعبة</span>
        <span aria-hidden="true"> / </span>
        <span lang="en">Loading game page</span>
      </div>

      <div className="aspect-video w-full animate-pulse rounded-3xl bg-surface-elevated motion-reduce:animate-none" />
      <div className="mt-6 h-8 w-2/3 animate-pulse rounded-full bg-surface-elevated motion-reduce:animate-none" />
      <div className="mt-4 h-5 w-full animate-pulse rounded-full bg-surface-elevated motion-reduce:animate-none" />
      <div className="mt-2 h-5 w-4/5 animate-pulse rounded-full bg-surface-elevated motion-reduce:animate-none" />
    </main>
  );
}
