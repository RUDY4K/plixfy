import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllNews, getNewsBySlug, getNewsSlugs, formatNewsDate, newsTitle, newsSummary } from "@/lib/news";
import { BRAND_AR } from "@/lib/siteContent";
import { locales, hasLocale, localeHref, ogLocaleFor, pageAlternates, type Locale } from "@/lib/i18n";

const SITE = "https://www.plixfy.com";

export const revalidate = 21600;
// أخبار تخرج من نافذة الـ60 عنصراً بعد التدوير تصير slug غير معروف — نرفض
// أي slug خارج القائمة المبنية وقت البناء بدل محاولة عرضها ديناميكياً (كان
// يسبب 500 لو الـ slug فيه أحرف غير ASCII، بسبب x-next-cache-tags header).
export const dynamicParams = false;

interface PageParams {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getNewsSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

const COPY = {
  ar: {
    brand: BRAND_AR,
    home: "الرئيسية",
    news: "أخبار الألعاب",
    source: "المصدر الأصلي:",
    breakTitle: "خذ استراحة من الأخبار والعب مجاناً 🎮",
    breakLink: "تصفّح مئات الألعاب بدون تحميل على بليكسفاي",
    otherNews: "أخبار أخرى",
    breadcrumbAria: "مسار التنقل",
  },
  en: {
    brand: "Plixfy",
    home: "Home",
    news: "Gaming News",
    source: "Original source:",
    breakTitle: "Take a break from the news and play free 🎮",
    breakLink: "Browse hundreds of no-download games on Plixfy",
    otherNews: "Other News",
    breadcrumbAria: "Breadcrumb",
  },
} as const;

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  const item = getNewsBySlug(slug);
  if (!item) return {};
  const c = COPY[locale];

  const title = newsTitle(item, locale);
  const description = newsSummary(item, locale).slice(0, 155);
  return {
    title: title + " | " + c.brand,
    description,
    alternates: pageAlternates(locale, "/news/" + item.slug),
    openGraph: {
      type: "article",
      title,
      description,
      url: SITE + localeHref(locale, "/news/" + item.slug),
      siteName: "Plixfy",
      locale: ogLocaleFor(locale),
      publishedTime: item.publishedAt,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function NewsItemPage({ params }: PageParams) {
  const { locale: rawLocale, slug } = await params;
  if (!hasLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const c = COPY[locale];
  const item = getNewsBySlug(slug);
  if (!item) notFound();

  const title = newsTitle(item, locale);
  const summary = newsSummary(item, locale);
  const otherNews = getAllNews().filter((n) => n.slug !== item.slug).slice(0, 4);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: summary.slice(0, 155),
    inLanguage: locale,
    datePublished: item.publishedAt,
    author: { "@type": "Organization", name: c.brand },
    publisher: {
      "@type": "Organization",
      name: c.brand,
      logo: { "@type": "ImageObject", url: SITE + "/opengraph-image.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": SITE + localeHref(locale, "/news/" + item.slug) },
    isBasedOn: item.sourceUrl,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: c.home, item: SITE + localeHref(locale, "/") },
      { "@type": "ListItem", position: 2, name: c.news, item: SITE + localeHref(locale, "/news") },
      { "@type": "ListItem", position: 3, name: title, item: SITE + localeHref(locale, "/news/" + item.slug) },
    ],
  };

  return (
    // قسم الأخبار يستخدم ثيماً فاتحاً «صحفياً» مقصوداً — مختلف عن بقية الموقع
    <div className="bg-[#f4f6f9] min-h-screen">
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify([articleLd, breadcrumbLd]) }}
        />

        <nav aria-label={c.breadcrumbAria} className="mb-6 text-sm text-slate-500">
          <Link href={localeHref(locale, "/")} className="hover:text-blue-700 transition-colors">
            {c.home}
          </Link>
          <span className="mx-2" aria-hidden="true">
            ‹
          </span>
          <Link href={localeHref(locale, "/news")} className="hover:text-blue-700 transition-colors">
            {c.news}
          </Link>
        </nav>

        <article className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div aria-hidden="true" className="h-1.5 bg-blue-700" />
          <div className="p-6 md:p-8">
            <header className="mb-6 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-2 mb-4 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">
                  {item.sourceName}
                </span>
                <time dateTime={item.publishedAt} className="text-slate-500">
                  {formatNewsDate(item.publishedAt, locale)}
                </time>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug tracking-tight">
                {title}
              </h1>
            </header>

            <div className="text-base text-slate-700 leading-loose whitespace-pre-line">
              {summary}
            </div>

            <p className="mt-8 pt-5 border-t border-slate-100 text-sm text-slate-500">
              {c.source}{" "}
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-blue-700 font-semibold hover:underline"
              >
                {item.sourceName}
              </a>
            </p>
          </div>
        </article>

        <div className="mt-8 rounded-2xl bg-gradient-to-l from-[#1a1030] to-[#2a1245] p-6 text-center shadow-md">
          <p className="text-base font-bold text-white mb-1">{c.breakTitle}</p>
          <Link
            href={localeHref(locale, "/")}
            className="text-pink-400 hover:text-pink-300 text-sm font-semibold transition-colors"
          >
            {c.breakLink}
          </Link>
        </div>

        {otherNews.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4">{c.otherNews}</h2>
            <ul className="space-y-3">
              {otherNews.map((n) => (
                <li
                  key={n.slug}
                  className="rounded-xl bg-white border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <Link
                    href={localeHref(locale, "/news/" + n.slug)}
                    className="text-slate-800 hover:text-blue-800 font-semibold text-sm md:text-base transition-colors"
                  >
                    {newsTitle(n, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
