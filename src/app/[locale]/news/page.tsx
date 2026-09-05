import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllNews, formatNewsDate, newsTitle, newsSummary } from "@/lib/news";
import { BRAND_AR } from "@/lib/siteContent";
import { locales, hasLocale, localeHref, ogLocaleFor, pageAlternates, type Locale } from "@/lib/i18n";
import { newsImageHref } from "@/lib/newsImage";

const SITE = "https://www.plixfy.com";

export const revalidate = 21600;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const COPY = {
  ar: {
    metaTitle: `أخبار الألعاب - ${BRAND_AR} | آخر أخبار عالم ألعاب الفيديو بالعربية`,
    metaDescription:
      "أخبار الألعاب على بليكسفاي: لا تُعرض المواد قبل مراجعة مصادرها ودقتها.",
    ogDescription: "أخبار الألعاب بعد مراجعة المصادر والدقة.",
    home: "الرئيسية",
    news: "أخبار الألعاب",
    h1: "أخبار الألعاب",
    intro:
      "ننشر الأخبار بعد مراجعة مصادرها ودقتها وإضافتها للقارئ. لا نلتزم بتحديث يومي على حساب اكتمال المراجعة.",
    latest: "الأحدث",
    readMore: "اقرأ الخبر كاملاً ←",
    breakTitle: "خذ استراحة من الأخبار والعب مجاناً 🎮",
    breakLink: "تصفّح مئات الألعاب بدون تحميل على بليكسفاي",
    breadcrumbAria: "مسار التنقل",
  },
  en: {
    metaTitle: "Gaming News - Plixfy | Latest Video Game News",
    metaDescription:
      "Gaming news on Plixfy: stories appear after their sources and accuracy have been reviewed.",
    ogDescription: "Gaming news after source and accuracy checks.",
    home: "Home",
    news: "Gaming News",
    h1: "Gaming News",
    intro:
      "Stories are published after checks of their sources, accuracy and value to readers. Publication follows completed review rather than a daily quota.",
    latest: "Latest",
    readMore: "Read full story →",
    breakTitle: "Take a break from the news and play free 🎮",
    breakLink: "Browse hundreds of no-download games on Plixfy",
    breadcrumbAria: "Breadcrumb",
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/news">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const c = COPY[locale];

  return {
    title: c.metaTitle,
    description: c.metaDescription,
    // The feed is useful to visitors, but summaries from external reporting
    // are not submitted as search landing pages without original analysis.
    robots: { index: false, follow: true },
    alternates: pageAlternates(locale, "/news"),
    openGraph: {
      type: "website",
      title: c.metaTitle,
      description: c.ogDescription,
      url: SITE + localeHref(locale, "/news"),
      siteName: "Plixfy",
      locale: ogLocaleFor(locale),
    },
  };
}

export default async function NewsIndexPage({
  params,
}: PageProps<"/[locale]/news">) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const c = COPY[locale];
  const items = getAllNews(locale);

  const listLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: c.h1,
    url: SITE + localeHref(locale, "/news"),
    inLanguage: locale,
    isPartOf: { "@type": "WebSite", name: "Plixfy", url: SITE },
  };

  return (
    // قسم الأخبار يستخدم ثيماً فاتحاً «صحفياً» مقصوداً — مختلف عن بقية الموقع
    <div className="bg-[#f4f6f9] min-h-screen">
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd).replace(/</g, "\\u003c") }}
        />

        <nav aria-label={c.breadcrumbAria} className="mb-6 text-sm text-slate-500">
          <Link href={localeHref(locale, "/")} className="hover:text-blue-700 transition-colors">
            {c.home}
          </Link>
          <span className="mx-2" aria-hidden="true">
            ‹
          </span>
          <span className="text-slate-800 font-semibold">{c.news}</span>
        </nav>

        <header className="mb-10 border-b-2 border-slate-200 pb-8">
          <div className="flex items-center gap-3 mb-3">
            <span
              aria-hidden="true"
              className="w-1.5 h-9 rounded-sm bg-blue-700"
            />
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {c.h1}
            </h1>
          </div>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl">
            {c.intro}
          </p>
        </header>

        {items.length === 0 && <section className="mb-8 rounded-xl bg-white border border-slate-200 p-6 space-y-4 text-slate-700">
          <h2 className="text-xl font-bold">{locale === "ar" ? "نعيد مراجعة مواد هذا القسم" : "We are reviewing this section"}</h2>
          <p>{locale === "ar" ? "لا توجد أخبار معتمدة للنشر حالياً. أوقفنا عرض الملخصات السابقة إلى أن نتحقق من مصادرها ودقتها وما تضيفه للقارئ." : "No stories are currently approved for publication. Previous summaries are paused pending checks of their sources, accuracy and value to readers."}</p>
          <p>{locale === "ar" ? "يمكنك الاستفادة الآن من دليلنا لبدء ألعاب المتصفح، وفهم التحكم والحفظ، والتعامل مع تعطل التحميل." : "Our browser games guide is available now, with help on starting games, controls, saves and loading problems."}</p>
          <Link className="inline-block text-blue-700 underline" href={localeHref(locale, "/guides/browser-games")}>{locale === "ar" ? "اقرأ دليل ألعاب المتصفح" : "Read the browser games guide"}</Link>
        </section>}

        <div className="space-y-5">
          {items.map((item, idx) => (
            <article
              key={item.slug}
              className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <Link href={localeHref(locale, "/news/" + item.slug)} className="block group">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={newsImageHref(item.slug)}
                    alt=""
                    loading="lazy"
                    className="mb-5 h-52 w-full rounded-xl object-cover md:h-64"
                  />
                ) : null}
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">
                    {item.sourceName}
                  </span>
                  <time dateTime={item.publishedAt} className="text-slate-500">
                    {formatNewsDate(item.publishedAt, locale)}
                  </time>
                  {idx === 0 ? (
                    <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-bold">
                      {c.latest}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-blue-800 transition-colors leading-snug">
                  {newsTitle(item, locale)}
                </h2>
                <p className="text-sm text-slate-600 mt-2.5 leading-relaxed line-clamp-3">
                  {newsSummary(item, locale)}
                </p>
                <span className="inline-block mt-3 text-sm font-semibold text-blue-700 group-hover:underline">
                  {c.readMore}
                </span>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-gradient-to-l from-[#1a1030] to-[#2a1245] p-6 text-center shadow-md">
          <p className="text-base font-bold text-white mb-1">{c.breakTitle}</p>
          <Link
            href={localeHref(locale, "/")}
            className="text-pink-400 hover:text-pink-300 text-sm font-semibold transition-colors"
          >
            {c.breakLink}
          </Link>
        </div>
      </main>
    </div>
  );
}
