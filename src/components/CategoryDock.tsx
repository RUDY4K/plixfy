import Link from "next/link";
import { CarFront, Crosshair, Gamepad2, Globe2, Puzzle, Sparkles, Swords, Trophy } from "lucide-react";
import { categories } from "@/lib/games";
import { localeHref, type Locale } from "@/lib/i18n";

const icons = {
  racing: CarFront,
  action: Swords,
  puzzle: Puzzle,
  io: Globe2,
  girls: Sparkles,
  casual: Gamepad2,
  sports: Trophy,
  shooting: Crosshair,
} as const;

export default function CategoryDock({ locale }: { locale: Locale }) {
  return (
    <section className="mb-9 px-4 md:px-0" aria-label={locale === "ar" ? "تصنيفات الألعاب" : "Game categories"}>
      <div className="scrollbar-hide flex gap-2.5 overflow-x-auto pb-2 md:grid md:grid-cols-8 md:overflow-visible">
        {categories.map((category, index) => {
          const Icon = icons[category.slug];
          return (
            <Link
              key={category.slug}
              href={localeHref(locale, `/category/${category.slug}`)}
              className="group relative flex min-w-[104px] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/[0.07] bg-surface/75 px-3 py-4 text-center transition duration-200 hover:-translate-y-1 hover:border-white/15 hover:bg-surface-elevated"
            >
              <span
                className="absolute inset-x-0 bottom-0 h-px opacity-70"
                style={{ background: `linear-gradient(90deg,transparent,${index % 2 === 0 ? "#00E5FF" : "#FF2D8B"},transparent)` }}
              />
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-white ring-1 ring-white/[0.08] transition group-hover:scale-110 group-hover:text-accent-2">
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <span className="text-xs font-extrabold text-white/80 group-hover:text-white">
                {locale === "ar" ? category.labelAr : category.labelEn}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
