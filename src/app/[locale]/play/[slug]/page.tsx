import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, BookOpenCheck, Monitor, RefreshCw, Smartphone } from "lucide-react";
import {
  allGames,
  getGameBySlug,
  getGamesByCategory,
  getPlaygamaVideoUrl,
} from "@/lib/games";
import {
  getGameContent,
  hasEditorialGameContent,
  type GameContent,
} from "@/lib/gameContent";
import { getGenericGameFaq } from "@/lib/gameFaqFallback";
import { categoryContent } from "@/lib/categoryContent";
import { getLocalizedCategoryMeta } from "@/lib/categoryI18n";
import type { CategorySlug, Game, GameDeviceSupport } from "@/lib/games";
import GameCard from "@/components/GameCard";
import GameFrame from "@/components/GameFrame";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShareButton from "@/components/ShareButton";
import FavoriteButton from "@/components/FavoriteButton";
import TrackGamePlay from "@/components/TrackGamePlay";
import {
  locales,
  hasLocale,
  localeHref,
  getDict,
  ogLocaleFor,
  pageAlternates,
  type Locale,
} from "@/lib/i18n";
import catalogMeta from "@/data/playgama-catalog-meta.json";

const SITE = "https://www.plixfy.com";

function absoluteUrl(maybeRelative: string): string {
  if (maybeRelative.startsWith("http://") || maybeRelative.startsWith("https://")) {
    return maybeRelative;
  }
  return SITE + (maybeRelative.startsWith("/") ? "" : "/") + maybeRelative;
}

export async function generateStaticParams() {
  return locales.flatMap((locale) =>
    allGames.slice(0, 96).map((game) => ({ locale, slug: game.slug }))
  );
}

export const dynamicParams = true;

function buildDescription(
  locale: Locale,
  game: Game,
  slug: string,
  content: GameContent | null
): string {
  if (content?.metaDescription) return content.metaDescription;

  const support = game.supportedDevices ?? "unknown";
  const deviceClaimEn =
    support === "mobile-only"
      ? " on mobile"
      : support === "desktop-only"
        ? " on desktop"
        : support === "mobile-and-desktop"
          ? " on mobile and desktop"
          : "";

  if (locale === "en") {
    const meta = getLocalizedCategoryMeta(game.categorySlug, "en");
    const catName = meta ? meta.name : game.categorySlug;
    return (
      "Play " +
      game.title +
      " free online on Plixfy — a " +
      catName.toLowerCase() +
      " game that runs right in your browser" +
      deviceClaimEn +
      ". No download, no sign-up."
    );
  }

  const hooks = categoryContent[game.categorySlug as CategorySlug]?.metaHooks;
  // Stable per-slug hash so each game gets a deterministic hook variant
  let slugHash = 0;
  for (let i = 0; i < slug.length; i++) {
    slugHash = (slugHash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  const categoryHook = hooks && hooks.length > 0 ? hooks[slugHash % hooks.length] : undefined;
  return categoryHook
    ? "لعبة " +
        game.title +
        " - " +
        game.category +
        " مجاناً أونلاين على بليكسفاي. " +
        categoryHook +
        ". تعمل من المتصفح مباشرة بدون تحميل."
    : "لعبة " +
        game.title +
        " - " +
        game.category +
        " مجاناً أونلاين على بليكسفاي. العب بدون تحميل من متصفحك مباشرة!";
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/play/[slug]">): Promise<Metadata> {
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
  const content = getGameContent(slug, locale);
  const title = game.title + t.play.metaTitleSuffix;
  const description = buildDescription(locale, game, slug, content);
  const path = "/play/" + slug;
  const url = SITE + localeHref(locale, path);
  return {
    title,
    description,
    ...(!hasEditorialGameContent(slug, locale)
      ? { robots: { index: false, follow: true } }
      : {}),
    alternates: pageAlternates(locale, path),
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "Plixfy",
      locale: ogLocaleFor(locale),
      images: [{ url: absoluteUrl(game.thumbnailWide || game.thumbnail) }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(game.thumbnailWide || game.thumbnail)],
    },
  };
}

export default async function PlayPage({
  params,
}: PageProps<"/[locale]/play/[slug]">) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDict(locale);
  const href = (path: string) => localeHref(locale, path);
  const game = getGameBySlug(slug);
  if (!game) {
    notFound();
  }

  const meta = getLocalizedCategoryMeta(game.categorySlug, locale);
  const related = getGamesByCategory(game.categorySlug)
    .filter((g) => g.slug !== game.slug)
    .slice(0, 6);

  const content = getGameContent(slug, locale);
  const isEditorial = hasEditorialGameContent(slug, locale);
  const deviceSupport = game.supportedDevices ?? "unknown";

  const pageUrl = SITE + href("/play/" + slug);
  const imageUrl = absoluteUrl(game.thumbnailWide || game.thumbnail);
  const genre = meta ? meta.name : game.category;
  const categoryLabel = locale === "en" && meta ? meta.name : game.category;
  const ldDescription =
    content?.metaDescription ?? game.description ?? game.title;

  const videoGameLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: ldDescription,
    image: imageUrl,
    url: pageUrl,
    genre,
    gamePlatform:
      deviceSupport === "mobile-only"
        ? ["Mobile"]
        : deviceSupport === "desktop-only"
          ? ["Web Browser", "Desktop"]
          : deviceSupport === "mobile-and-desktop"
            ? ["Web Browser", "Mobile", "Desktop"]
            : ["Web Browser"],
    applicationCategory: "Game",
    operatingSystem:
      deviceSupport === "mobile-only"
        ? "Android, iOS"
        : deviceSupport === "desktop-only"
          ? "Windows, macOS, Linux"
          : "Any",
    inLanguage: locale,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: locale === "ar" ? "SAR" : "USD",
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
        name: t.nav.home,
        item: SITE + href("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: genre,
        item: SITE + href("/category/" + game.categorySlug),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: game.title,
        item: pageUrl,
      },
    ],
  };

  const hasRichFaq = !!content && content.faq.length > 0;
  // Generic fallback FAQs are still shown to users (helpful info) but we do
  // NOT advertise them as FAQPage schema because they're identical across
  // 342 games — Google may flag near-duplicate FAQ schema as spam.
  const faq = hasRichFaq
    ? content.faq
    : getGenericGameFaq(game.title, locale, deviceSupport);
  const faqLd = hasRichFaq
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
    : game.description
      ? game.description.split("\n\n").filter((p) => p.trim().length > 0)
      : [];
  const videoUrl = game.videoId ? getPlaygamaVideoUrl(game.videoId) : null;
  const catalogDate = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(catalogMeta.syncedAt));

  return (
    <main className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
      <TrackGamePlay slug={game.slug} />
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
        locale={locale}
        items={[
          { label: t.nav.home, href: href("/") },
          { label: genre, href: href("/category/" + game.categorySlug) },
          { label: game.title, latin: true },
        ]}
      />
      <div
        id="play-frame"
        className="overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-black shadow-[0_28px_80px_rgba(0,0,0,.42)] md:rounded-[2.25rem]"
      >
        <GameFrame
          slug={game.slug}
          title={game.title}
          thumbnail={game.thumbnailWide || game.thumbnail}
          fallbackThumbnail={game.thumbnail}
          orientation={game.orientation}
        />
      </div>

      <div className="mt-5 rounded-[1.75rem] border border-white/[0.06] bg-surface/55 p-4 md:mt-6 md:p-6">
        <h1 className="font-latin text-2xl font-black tracking-tight text-text-primary md:text-4xl">
          {game.title}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm md:text-base text-text-secondary">
          <span>{categoryLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{t.play.free}: {t.play.yes}</span>
        </div>

        <a
          href="#play-frame"
          className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-black text-[#090913] shadow-[0_14px_35px_rgba(255,255,255,.12)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-2"
          aria-label={t.common.playAria + game.title}
          data-game-slug={game.slug}
          data-placement="play-cta"
        >
          {t.play.playNowCta}
        </a>

        <div className="mt-4 flex items-center gap-3">
          <ShareButton slug={game.slug} title={game.title} url={pageUrl} />
          <FavoriteButton slug={game.slug} locale={locale} showLabel />
        </div>
      </div>

      {videoUrl ? (
        <section className="mt-6 border-t border-surface-elevated pt-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary md:text-2xl">
                {locale === "ar" ? "فيديو اللعبة" : "Game video"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {locale === "ar"
                  ? "فيديو معاينة رسمي مقدّم من Playgama"
                  : "Official preview video provided by Playgama"}
              </p>
            </div>
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {locale === "ar" ? "فيديو معاينة" : "Preview video"}
            </span>
          </div>

          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/[0.08] bg-black">
            <video
              className="aspect-video w-full object-contain"
              controls
              muted
              playsInline
              preload="metadata"
              poster={game.thumbnailWide || game.thumbnail}
              aria-label={(locale === "ar" ? "فيديو معاينة للعبة " : "Preview video for ") + game.title}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
        </section>
      ) : null}

      <section className="mt-6 pt-6 border-t border-surface-elevated">
        <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-4">
          {t.play.gameInfo}
        </h2>
        <dl className="bg-surface rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
          <InfoRow
            label={t.play.category}
            value={meta ? meta.icon + " " + meta.name : categoryLabel}
          />
          <InfoRow label={t.play.name} value={game.title} valueLatin />
          <InfoRow
            label={t.play.supportedDevices}
            value={
              <DeviceSupportValue
                support={deviceSupport}
                labels={{
                  both: t.play.mobileAndDesktop,
                  mobile: t.play.mobileOnly,
                  desktop: t.play.desktopOnly,
                  unknown: t.play.deviceSupportUnknown,
                }}
              />
            }
          />
          <InfoRow label={t.play.free} value={t.play.yes} />
          <InfoRow
            label={locale === "ar" ? "اللغات" : "Languages"}
            value={game.supportedLanguages.length > 0 ? game.supportedLanguages.join(" · ") : "—"}
            valueLatin
          />
          <InfoRow
            label={locale === "ar" ? "مشتريات داخل اللعبة" : "In-game purchases"}
            value={
              game.inGamePurchases
                ? locale === "ar" ? "متوفرة" : "Available"
                : locale === "ar" ? "غير موجودة" : "None"
            }
          />
        </dl>
      </section>

      {isEditorial ? (
        <aside className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5 md:p-6" aria-label={locale === "ar" ? "شفافية المحتوى" : "Content transparency"}>
          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-300" aria-hidden="true" />
            <div>
              <p className="font-bold text-text-primary">
                {locale === "ar" ? "دليل تحريري من فريق بليكسفاي" : "An editorial guide from the Plixfy team"}
              </p>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                {locale === "ar"
                  ? "وفّرت Playgama اللعبة وبياناتها الأساسية، وأضاف فريق بليكسفاي الشرح العربي، خطوات التحكم، النصائح، وتوضيح الأجهزة المدعومة. لا يؤثر الموزّع أو المعلن في ترتيب اللعبة أو صياغة رأينا التحريري."
                  : "Playgama supplies the game and its core catalog data. Plixfy adds the guide, controls, practical tips, and device information. The distributor and advertisers do not buy rankings or control our editorial wording."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-text-secondary">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/15 px-3 py-2">
                  <BookOpenCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  {locale === "ar" ? "شرح ونصائح مضافة" : "Added guide and tips"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/15 px-3 py-2">
                  <RefreshCw className="h-4 w-4 text-secondary" aria-hidden="true" />
                  {locale === "ar" ? `آخر مزامنة للبيانات: ${catalogDate}` : `Catalog data synced: ${catalogDate}`}
                </span>
              </div>
              <Link href={href("/editorial-policy")} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-primary hover:underline">
                {locale === "ar" ? "كيف نراجع الألعاب ونصحح المعلومات؟" : "How we review games and correct information"}
              </Link>
            </div>
          </div>
        </aside>
      ) : null}

      {descriptionParagraphs.length > 0 ? (
        <section className="mt-6 pt-6 border-t border-surface-elevated">
          <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-4">
            {t.play.about}
          </h2>
          <div dir="auto" className="space-y-4 text-text-secondary leading-relaxed">
            {descriptionParagraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 pt-6 border-t border-surface-elevated">
        <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-3">
          {t.play.howToPlay}
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
        ) : game.howToPlay ? (
          <p dir="auto" className="text-text-secondary leading-relaxed">
            {game.howToPlay}
          </p>
        ) : (
          <p className="text-text-secondary leading-relaxed">{t.play.genericControls}</p>
        )}
      </section>

      {content && content.tips.length > 0 ? (
        <section className="mt-6 pt-6 border-t border-surface-elevated">
          <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-4">
            {t.play.tips}
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

      <section className="mt-6 pt-6 border-t border-surface-elevated pb-4">
        <h2 className="text-lg md:text-2xl font-bold text-text-primary mb-4">
          {t.play.faq}
        </h2>
        <div className="space-y-3">
          {faq.map((qa, idx) => (
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

      <section id="related-games" className="mt-6 border-t border-surface-elevated pt-6 scroll-mt-24">
        <div className="mb-3 flex items-center justify-between md:mb-4">
          <h2 className="text-lg font-bold text-text-primary md:text-2xl">{t.play.similar}</h2>
          <Link
            href={href("/play/" + game.slug + "/like")}
            className="inline-flex min-h-12 items-center px-2 text-sm text-primary hover:underline md:text-base"
            aria-label={t.play.moreLikeAria + game.title}
          >
            {t.play.more}
          </Link>
        </div>
        <div className="md:hidden">
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2" style={{ scrollbarWidth: "none" }}>
            {related.map((g, idx) => (
              <div key={g.slug} className="w-[130px] shrink-0 snap-start">
                <GameCard {...g} locale={locale} position={idx + 1} placement="related-mobile" showStats />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:grid md:grid-cols-6 md:gap-6">
          {related.map((g, idx) => (
            <GameCard key={g.slug} {...g} locale={locale} position={idx + 1} placement="related-desktop" showStats />
          ))}
        </div>
      </section>
    </main>
  );
}

function DeviceSupportValue({
  support,
  labels,
}: {
  support: GameDeviceSupport;
  labels: { both: string; mobile: string; desktop: string; unknown: string };
}) {
  const showMobile = support === "mobile-only" || support === "mobile-and-desktop";
  const showDesktop = support === "desktop-only" || support === "mobile-and-desktop";
  const label =
    support === "unknown"
      ? labels.unknown
      : support === "mobile-only"
      ? labels.mobile
      : support === "desktop-only"
        ? labels.desktop
        : labels.both;

  return (
    <span className="inline-flex items-center gap-1.5 text-text-primary font-semibold">
      {showMobile ? <Smartphone className="h-4 w-4 text-accent-3" aria-hidden="true" /> : null}
      {showDesktop ? <Monitor className="h-4 w-4 text-secondary" aria-hidden="true" /> : null}
      <span>{label}</span>
    </span>
  );
}

function InfoRow(props: { label: string; value: React.ReactNode; valueLatin?: boolean }) {
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
