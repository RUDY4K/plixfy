import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "بحث | بليكسفاي",
  description: "ابحث في مكتبة ألعاب بليكسفاي.",
  alternates: {
    canonical: "/search",
  },
};

export default function SearchPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
        بحث
      </h1>

      <div className="bg-surface rounded-2xl p-4 mb-6">
        <input
          type="search"
          placeholder="دور على لعبتك المفضلة..."
          className="w-full bg-surface-elevated text-text-primary placeholder:text-text-secondary rounded-xl px-4 py-3 min-h-12 outline-none focus:ring-2 focus:ring-primary"
          aria-label="بحث"
        />
      </div>

      <div className="text-center text-text-secondary py-12">
        <p className="text-base md:text-lg">اكتب لتبدأ البحث</p>
      </div>
    </main>
  );
}
