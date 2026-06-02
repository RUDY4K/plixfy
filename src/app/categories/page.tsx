import Link from "next/link";
import type { Metadata } from "next";
import { categories } from "@/lib/games";

export const metadata: Metadata = {
  title: "الفئات | بليكسفاي",
  description: "تصفّح كل فئات الألعاب — سباق، أكشن، ألغاز، رياضة وأكثر.",
  alternates: {
    canonical: "/categories",
  },
};

export default function CategoriesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
        الفئات
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={"/category/" + cat.slug}
            className="block bg-surface hover:bg-surface-elevated transition-colors rounded-2xl p-4 md:p-6 min-h-24 flex flex-col items-start justify-center"
          >
            <span className="text-xs text-text-secondary font-latin mb-1">
              {cat.labelEn}
            </span>
            <span className="text-lg md:text-xl font-bold text-text-primary">
              {cat.labelAr}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
