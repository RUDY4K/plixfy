import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  allGames,
  getGameBySlug,
  getGamesByCategory,
} from "@/lib/games";
import { getLocalizedCategoryMeta } from "@/lib/categoryI18n";
import GameCard from "@/components/GameCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  locales,
  hasLocale,
  localeHref,
  getDict,
  ogLocaleFor,
  pageAlternates,
  type Locale,
} from "@/lib/i18n";

const SITE = "https://www.plixfy.com";
const SIMILAR_COUNT = 12;

export async function generateStaticParams() {
  return locales.flatMap((locale) =>
    allGames.map((g) => ({ locale, slug: g.slug }))
  );
}

function buildMetaCopy(locale: Locale, title: string, category: string) {
  if (locale === "en") {
    return {
      title: `Games Like ${title} - ${SIMILAR_COUNT} Similar Games | Plixfy`,
      description: `${SIMILAR_COUNT} games similar to ${title} in the ${category} category on Plixfy. All free, playable in your browser with no download.`,
    };
  }
  return {
    title: `ألعاب مثل ${title} - ${SIMILAR_COUNT} لعبة مشابهة | بليكسفاي`,
    description: `${SIMILAR_COUNT} لعبة شبيهة بـ ${title} في فئة ${category} على بليكسفاي. كلها مجانية، تعمل من المتصفح بدون تحميل.`,
  };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/play/[slug]/like">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDict(locale);
  const game = getGameBySlug(slug);
  if (!game) {
    return {
      title: t.play.notFoundTitle,
      alternates: { canonical: localeHref(locale, "/") },
    };
  }
  const category =
    locale === "en"
      ? getLocalizedCategoryMeta(game.categorySlug, "en")?.name ?? game.category
      : game.category;
  const copy = buildMetaCopy(locale, game.title, category);
  const path = "/play/" + slug + "/like";
  return {
    title: copy.title,
    description: copy.description,
    alternates: pageAlternates(locale, path),
    openGraph: {
      type: "website",
      title: copy.title,
      description: copy.description,
      url: SITE + localeHref(locale, path),
      siteName: "Plixfy",
      locale: ogLocaleFor(locale),
    },
    twitter: { card: "summary_large_image", title: copy.title, description: copy.description },
  };
}

export const revalidate = 86400;

export default async function SimilarGamesPage({
  params,
}: PageProps<"/[locale]/play/[slug]/like">) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDict(locale);
  const href = (path: string) => localeHref(locale, path);
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const catMeta = getLocalizedCategoryMeta(game.categorySlug, locale);
  if (!catMeta) notFound();

  const similar = getGamesByCategory(game.categorySlug, [game.slug]).slice(
    0,
    SIMILAR_COUNT,
  );
  if (similar.length === 0) notFound();

  const url = SITE + href("/play/" + slug + "/like");

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name:
      locale === "en" ? `Games like ${game.title}` : `ألعاب مثل ${game.title}`,
    description:
      locale === "en"
        ? `${similar.length} games similar to ${game.title} in the ${catMeta.name} category`
        : `${similar.length} لعبة شبيهة بـ ${game.title} في فئة ${catMeta.name}`,
    url,
    numberOfItems: similar.length,
    itemListElement: similar.map((g, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: SITE + href("/play/" + g.slug),
      name: g.title,
      image: g.thumbnail,
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.nav.home, item: SITE + href("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: catMeta.name,
        item: SITE + href("/category/" + game.categorySlug),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: game.title,
        item: SITE + href("/play/" + slug),
      },
      {
        "@type": "ListItem",
        position: 4,
        name: t.play.similar,
        item: url,
      },
    ],
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([itemListLd, breadcrumbLd]),
        }}
      />
      <Breadcrumbs
        locale={locale}
        items={[
          { label: t.nav.home, href: href("/") },
          { label: catMeta.name, href: href("/category/" + game.categorySlug) },
          { label: game.title, href: href("/play/" + slug), latin: true },
          { label: t.play.similar },
        ]}
      />

      <header className="mb-6 md:mb-8">
        {locale === "ar" ? (
          <>
            <h1
              className="text-2xl md:text-4xl font-bold text-text-primary mb-3"
              dir="rtl"
            >
              ألعاب مثل{" "}
              <span dir="ltr" className="font-latin">
                {game.title}
              </span>
            </h1>
            <p className="text-sm md:text-base text-text-secondary max-w-3xl leading-relaxed">
              إذا أعجبتك <span dir="ltr" className="font-latin font-semibold">{game.title}</span>،
              ستعجبك هذه الـ {similar.length} لعبة المختارة من نفس فئة{" "}
              <strong className="text-text-primary">{catMeta.name}</strong>. كلها
              مجانية على بليكسفاي وتعمل من المتصفح مباشرة بدون تحميل.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl md:text-4xl font-bold text-text-primary mb-3 font-latin">
              Games Like {game.title}
            </h1>
            <p className="text-sm md:text-base text-text-secondary max-w-3xl leading-relaxed">
              If you enjoyed{" "}
              <span className="font-latin font-semibold">{game.title}</span>, you
              will love these {similar.length} hand-picked games from the{" "}
              <strong className="text-text-primary">{catMeta.name}</strong>{" "}
              category. All free on Plixfy — play right in your browser with no
              download.
            </p>
          </>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={href("/play/" + slug)}
            className="inline-flex items-center min-h-12 px-5 rounded-xl bg-primary text-white font-bold hover:brightness-110 transition"
            dir="ltr"
          >
            ▶ {locale === "en" ? "Play" : "العب"} {game.title}
          </Link>
          <Link
            href={href("/category/" + game.categorySlug)}
            className="inline-flex items-center min-h-12 px-5 rounded-xl bg-surface text-text-primary hover:bg-surface-elevated transition"
          >
            {locale === "en"
              ? "All " + catMeta.name
              : "كل ألعاب " + catMeta.name}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
        {similar.map((g, idx) => (
          <GameCard
            key={g.slug}
            {...g}
            locale={locale}
            position={idx + 1}
            placement={"similar-to-" + slug}
          />
        ))}
      </div>
    </main>
  );
}
