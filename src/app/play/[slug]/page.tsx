import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Heart, Share2 } from "lucide-react";
import {
  allGames,
  getGameBySlug,
  getGamesByCategory,
  getCategoryMeta,
} from "@/lib/games";
import { getGameContent } from "@/lib/gameContent";
import GameCard from "@/components/GameCard";
import GameFrame from "@/components/GameFrame";
import Breadcrumbs from "@/components/Breadcrumbs";

const SITE = "https://www.plixfy.com";

interface PageParams {
  params: Promise<{ slug: string }>;
}

function absoluteUrl(maybeRelative: string): string {
  if (maybeRelative.startsWith("http://") || maybeRelative.startsWith("https://")) {
    return maybeRelative;
  }
  return SITE + (maybeRelative.startsWith("/") ? "" : "/") + maybeRelative;
}

export async function generateStaticParams() {
  return allGames.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) {
    return {
      title: "اللعبة غير موجودة | بليكسفاي",
      alternates: { canonical: "/" },
    };
  }
  const content = getGameContent(slug);
  const title = game.title + " - العب مجاناً | بليكسفاي";
  const fallbackDescription =
    "العب " + game.title + " مجاناً على بليكسفاي. " + game.category + " بدون تحميل، من متصفحك مباشرة.";
  const description = content?.metaDescription ?? fallbackDescription;
  const url = SITE + "/play/" + slug;
  const image = absoluteUrl(game.thumbnail);
  return {
    title,
    description,
    alternates: {
      canonical: "/play/" + slug,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "Plixfy",
      locale: "ar_SA",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function PlayPage({ params }: PageParams) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) {
    notFound();
  }

  const meta = getCategoryMeta(game.categorySlug);
  const related = getGamesByCategory(game.categorySlug)
    .filter((g) => g.slug !== game.slug)
    .slice(0, 6);

  const content = getGameContent(slug);

  const pageUrl = SITE + "/play/" + slug;
  const imageUrl = absoluteUrl(game.thumbnail);
  const genre = meta ? meta.name : game.category;
  const ldDescription = game.description ?? game.title;

  const videoGameLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: ldDescription,
    image: imageUrl,
    url: pageUrl,
    genre,
    gamePlatform: ["Web Browser", "Mobile"],
    applicationCategory: "Game",
    operatingSystem: "Any",
    inLanguage: "ar",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "SAR",
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "الرئيسية",
        item: SITE + "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: genre,
        item: SITE + "/category/" + game.categorySlug,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: game.title,
        item: pageUrl,
      },
    ],
  };

  const faqLd =
    content && content.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: content.faq.map((qa) => ({
            "@type": "Question",
            name: qa.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: qa.answer,
            },
          })),
        }
      : null;

  const descriptionParagraphs = content
    ? content.longDescription.split("\n\n").filter((p) => p.trim().length > 0)
    : [];

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      ) : null}
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/" },
          { label: genre, href: "/category/" + game.categorySlug },
          { label: game.title, latin: true },
        ]}
      />
      <div
        id="play-frame"
        className="overflow-hidden rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)]"
      >
        <GameFrame
          slug={game.slug}
          title={game.title}
          thumbnail={game.thumbnail}
        />
      </div>

      <div className="mt-5">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary font-latin">
          {game.title}
        </h1>
        <p className="text-sm md:text-base text-text-secondary mt-1">
          {game.category}
        </p>

        <a
          href="#play-frame"
          className="mt-5 bg-primary text-bg font-bold w-full py-4 rounded-2xl text-lg min-h-12 hover:brightness-110 transition inline-flex items-center justify-center gap-2"
          aria-label={"العب " + game.title}
        >
          العب الآن ▶
        </a>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            className="flex-1 md:flex-none bg-surface text-text-primary px-5 py-3 rounded-xl min-h-12 inline-flex items-center justify-center gap-2 hover:bg-surface-elevated transition"
            aria-label={"احفظ " + game.title + " في المفضلة"}
          >
            <Heart className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm font-semibold">احفظ</span>
          </button>
          <button
            type="button"
            className="flex-1 md:flex-none bg-surface text-text-primary px-5 py-3 rounded-xl min-h-12 inline-flex items-center justify-center gap-2 hover:bg-surface-elevated transition"
            aria-label={"شارك " + game.title}
          >
            <Share2 className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm font-semibold">شارك</span>
          </button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-surface-elevated">
        <div className="bg-surface border-2 border-dashed border-surface-elevated rounded-2xl h-24 flex items-center justify-center text-text-secondary text-sm">
          AdSense Slot — Banner 336x90
        </div>
      </div>

      <section className="mt-6 pt-6 border-t border-surface-elevated">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-lg md:text-2xl font-bold text-text-primary">
            ألعاب مشابهة
          </h2>
          <Link
            href={"/category/" + game.categorySlug}
            className="text-sm md:text-base text-primary hover:underline min-h-12 inline-flex items-center px-2"
            aria-label={"عرض كل ألعاب " + game.category}
          >
            عرض الكل ←
          </Link>
        </div>

        <div className="md:hidden">
          <div
            className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-4 px-4"
            style={{ scrollbarWidth: "none" }}
          >
            {related.map((g) => (
              <div
                key={g.slug}
                className="snap-start shrink-0"
                style={{ width: "130px" }}
              >
                <GameCard {...g} />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:grid md:grid-cols-6 md:gap-6">
          {related.map((g) => (
            <GameCard key={g.slug} {...g} />
          ))}
        </div>
      </section>

      <div className="mt-6 pt-6 border-t border-surface-elevated">
        <div className="bg-surface border-2 border-dashed border-surface-elevated rounded-2xl h-24 md:h-72 flex items-center justify-center text-text-secondary text-sm">
          AdSense Slot — Rectangle 336x280
        </div>
      </div>

      <section className="mt-6 pt-6 border-t border-surface-elevated">
        <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-4">
          معلومات اللعبة
        </h2>
        <dl className="bg-surface rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
          <InfoRow label="الفئة" value={meta ? meta.icon + " " + meta.name : game.category} />
          <InfoRow label="الاسم" value={game.title} valueLatin />
          <InfoRow label="نوع اللعب" value="متصفح" />
          <InfoRow label="مجانية" value="نعم" />
        </dl>
      </section>

      {content ? (
        <section className="mt-6 pt-6 border-t border-surface-elevated">
          <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-4">
            عن اللعبة
          </h2>
          <div className="space-y-4 text-text-secondary leading-relaxed">
            {descriptionParagraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 pt-6 border-t border-surface-elevated">
        <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-3">
          {content ? "كيف تلعب" : "كيفية اللعب"}
        </h2>
        {content ? (
          <ol className="space-y-2.5 text-text-secondary leading-relaxed">
            {content.howToPlay.map((step, idx) => (
              <li key={idx} className="flex gap-3">
                <span
                  className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold inline-flex items-center justify-center mt-0.5"
                  aria-hidden="true"
                >
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-text-secondary leading-relaxed">
            استخدم لوحة المفاتيح أو شاشة اللمس للتحكم في اللعبة. استمتع!
          </p>
        )}
      </section>

      {content && content.tips.length > 0 ? (
        <section className="mt-6 pt-6 border-t border-surface-elevated">
          <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-4">
            حيل ونصائح
          </h2>
          <ul className="space-y-2.5 text-text-secondary leading-relaxed">
            {content.tips.map((tip, idx) => (
              <li key={idx} className="flex gap-3">
                <span
                  className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-secondary"
                  aria-hidden="true"
                />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {content && content.faq.length > 0 ? (
        <section className="mt-6 pt-6 border-t border-surface-elevated pb-4">
          <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-4">
            أسئلة شائعة
          </h2>
          <div className="space-y-3">
            {content.faq.map((qa, idx) => (
              <details
                key={idx}
                className="group bg-surface rounded-2xl p-4 md:p-5 border border-surface-elevated hover:border-primary/30 transition-colors"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-text-primary font-semibold">
                  <span>{qa.question}</span>
                  <span
                    className="shrink-0 w-6 h-6 rounded-full bg-surface-elevated text-primary text-sm font-bold inline-flex items-center justify-center group-open:rotate-45 transition-transform"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm md:text-base text-text-secondary leading-relaxed">
                  {qa.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function InfoRow(props: { label: string; value: string; valueLatin?: boolean }) {
  const valueClass = props.valueLatin
    ? "text-text-primary font-semibold font-latin"
    : "text-text-primary font-semibold";

  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-text-secondary">{props.label}</dt>
      <dd className={"text-sm " + valueClass}>{props.value}</dd>
    </div>
  );
}
