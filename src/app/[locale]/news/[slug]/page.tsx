import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAllNews,
  getNewsBySlug,
  isKnownNewsSlug,
  getNewsSlugs,
  formatNewsDate,
  isSearchEligibleNews,
  newsKeyPoints,
  newsSummary,
  newsTitle,
  newsWhyItMatters,
} from "@/lib/news";
import { BRAND_AR } from "@/lib/siteContent";
import { locales, hasLocale, localeHref, ogLocaleFor, type Locale } from "@/lib/i18n";
import PreferredSourceCard from "@/components/PreferredSourceCard";
import { newsImageHref } from "@/lib/newsImage";

const SITE = "https://www.plixfy.com";
const SOCIAL_IMAGE = SITE + "/opengraph-image";

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
    quickAnswer: "الخلاصة السريعة",
    whyItMatters: "لماذا يهمك الخبر؟",
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
    quickAnswer: "Quick answer",
    whyItMatters: "Why it matters",
    breadcrumbAria: "Breadcrumb",
  },
} as const;

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  const item = getNewsBySlug(slug, locale);
  if (!item) return isKnownNewsSlug(slug) ? {
    title: locale === "ar" ? "خبر قيد المراجعة | بليكسفاي" : "Story under review | Plixfy",
    description: locale === "ar" ? "هذه المادة غير متاحة حتى اكتمال مراجعتها." : "This story is unavailable pending editorial review.",
    robots: { index: false, follow: true },
  } : {};
  const c = COPY[locale];

  const title = newsTitle(item, locale);
  const description = newsSummary(item, locale).slice(0, 155);
  const socialImage = `${SITE}/api/social-card?kind=news&id=${encodeURIComponent(item.slug)}&v=8`;
  const path = "/news/" + item.slug;
  const canonical = SITE + localeHref(locale, path);
  const eligibleAr = isSearchEligibleNews(item, "ar");
  const eligibleEn = isSearchEligibleNews(item, "en");
  const languages = {
    ...(eligibleAr ? { ar: SITE + localeHref("ar", path), "x-default": SITE + localeHref("ar", path) } : {}),
    ...(eligibleEn ? { en: SITE + localeHref("en", path) } : {}),
  };
  return {
    title: title + " | " + c.brand,
    description,
    robots: { index: isSearchEligibleNews(item, locale), follow: true },
    alternates: {
      canonical,
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: SITE + localeHref(locale, "/news/" + item.slug),
      siteName: "Plixfy",
      locale: ogLocaleFor(locale),
      publishedTime: item.publishedAt,
      images: [{ url: socialImage, width: 1200, height: 1200, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  };
}

export default async function NewsItemPage({ params }: PageParams) {
  const { locale: rawLocale, slug } = await params;
  if (!hasLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const c = COPY[locale];
  const item = getNewsBySlug(slug, locale);
  if (!item) {
    if (!isKnownNewsSlug(slug)) notFound();
    return <section className="mx-auto max-w-3xl px-5 py-12 space-y-5">
      <h1 className="text-3xl font-bold">{locale === "ar" ? "هذا الخبر قيد المراجعة" : "This story is under review"}</h1>
      <p>{locale === "ar" ? "أوقفنا عرض هذه المادة إلى أن نتحقق من مصادرها ونراجع دقتها وما تضيفه للقارئ. رابطها محفوظ، لكن الملخص السابق لا يُعرض أثناء المراجعة." : "We have paused this story while its sources, accuracy and contribution to readers are reviewed. Its address is retained, but the previous summary is unavailable during review."}</p>
      <p>{locale === "ar" ? "إذا كنت تبحث عن مساعدة في اللعب، يشرح دليلنا بدء ألعاب المتصفح وحل مشكلات التحميل والتحكم والحفظ." : "For help playing, our guide covers starting browser games and troubleshooting loading, controls and saves."}</p>
      <Link className="inline-block underline" href={localeHref(locale, "/guides/browser-games")}>{locale === "ar" ? "دليل ألعاب المتصفح" : "Browser games guide"}</Link>
      <Link className="block underline" href={localeHref(locale, "/news")}>{c.news}</Link>
    </section>;
  }

  const title = newsTitle(item, locale);
  const summary = newsSummary(item, locale);
  const keyPoints = newsKeyPoints(item, locale);
  const whyItMatters = newsWhyItMatters(item, locale);
  const otherNews = getAllNews(locale).filter((n) => n.slug !== item.slug).slice(0, 4);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: summary.slice(0, 155),
    image: item.image ? SITE + newsImageHref(item.slug) : SOCIAL_IMAGE,
    inLanguage: locale,
    datePublished: item.publishedAt,
    dateModified: item.reviewedAt ?? item.publishedAt,
    articleBody: [summary, whyItMatters].filter(Boolean).join("\n\n"),
    isAccessibleForFree: true,
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify([articleLd, breadcrumbLd]).replace(/</g, "\\u003c") }}
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
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={newsImageHref(item.slug)} alt="" className="h-64 w-full object-cover md:h-80" />
          ) : null}
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

            {keyPoints.length >= 3 ? (
              <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <h2 className="text-lg font-extrabold text-slate-900">{c.quickAnswer}</h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
                  {keyPoints.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {whyItMatters ? (
              <section className="mt-6">
                <h2 className="text-lg font-extrabold text-slate-900">{c.whyItMatters}</h2>
                <p className="mt-2 text-base leading-loose text-slate-700">{whyItMatters}</p>
              </section>
            ) : null}

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

        <div className="mt-8">
          <PreferredSourceCard locale={locale} />
        </div>

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
