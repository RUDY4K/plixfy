import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "المفضلة | بليكسفاي",
  description: "ألعابك المحفوظة في مكان واحد.",
  alternates: {
    canonical: "/favorites",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function FavoritesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
        المفضلة
      </h1>

      <div className="bg-surface rounded-2xl p-8 md:p-12 text-center">
        <div className="text-5xl mb-4">⭐</div>
        <p className="text-base md:text-lg text-text-secondary">
          لم تضف ألعاب بعد
        </p>
        <p className="text-sm text-text-secondary mt-2">
          الألعاب اللي تحبها تطلع هنا
        </p>
      </div>
    </main>
  );
}
