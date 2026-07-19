import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getAllNews, getNewsBySlug, getNewsSlugs, formatNewsDate } from "@/lib/news";
import { BRAND_AR } from "@/lib/siteContent";

const SITE = "https://www.plixfy.com";

export const revalidate = 21600;

interface PageParams {
  params: Promise<{ locale: string; slug: string }>;
}

// الأخبار عربية فقط — النسخة الإنجليزية تحوَّل للنسخة العربية
export async function generateStaticParams() {
  return getNewsSlugs().map((slug) => ({ locale: "ar", slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const item = getNewsBySlug(slug);
  if (!item) return {};

  const description = item.summary.slice(0, 155);
  return {
    title: item.title + " | " + BRAND_AR,
    description,
    alternates: { canonical: "/news/" + item.slug },
    openGraph: {
      type: "article",
      title: item.title,
      description,
      url: SITE + "/news/" + item.slug,
      siteName: "Plixfy",
      locale: "ar_SA",
      publishedTime: item.publishedAt,
    },
    twitter: { card: "summary_large_image", title: item.title, description },
  };
}

export default async function NewsItemPage({ params }: PageParams) {
  const { locale, slug } = await params;
  if (locale !== "ar") permanentRedirect("/news/" + slug);
  const item = getNewsBySlug(slug);
  if (!item) notFound();

  const otherNews = getAllNews().filter((n) => n.slug !== item.slug).slice(0, 4);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    description: item.summary.slice(0, 155),
    inLanguage: "ar",
    datePublished: item.publishedAt,
    author: { "@type": "Organization", name: BRAND_AR },
    publisher: {
      "@type": "Organization",
      name: BRAND_AR,
      logo: { "@type": "ImageObject", url: SITE + "/opengraph-image.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": SITE + "/news/" + item.slug },
    isBasedOn: item.sourceUrl,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "أخبار الألعاب", item: SITE + "/news" },
      { "@type": "ListItem", position: 3, name: item.title, item: SITE + "/news/" + item.slug },
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

        <nav aria-label="مسار التنقل" className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-700 transition-colors">
            الرئيسية
          </Link>
          <span className="mx-2" aria-hidden="true">
            ‹
          </span>
          <Link href="/news" className="hover:text-blue-700 transition-colors">
            أخبار الألعاب
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
                  {formatNewsDate(item.publishedAt)}
                </time>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug tracking-tight">
                {item.title}
              </h1>
            </header>

            <div className="text-base text-slate-700 leading-loose whitespace-pre-line">
              {item.summary}
            </div>

            <p className="mt-8 pt-5 border-t border-slate-100 text-sm text-slate-500">
              المصدر الأصلي:{" "}
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
          <p className="text-base font-bold text-white mb-1">
            خذ استراحة من الأخبار والعب مجاناً 🎮
          </p>
          <Link
            href="/"
            className="text-pink-400 hover:text-pink-300 text-sm font-semibold transition-colors"
          >
            تصفّح مئات الألعاب بدون تحميل على بليكسفاي
          </Link>
        </div>

        {otherNews.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4">
              أخبار أخرى
            </h2>
            <ul className="space-y-3">
              {otherNews.map((n) => (
                <li
                  key={n.slug}
                  className="rounded-xl bg-white border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <Link
                    href={"/news/" + n.slug}
                    className="text-slate-800 hover:text-blue-800 font-semibold text-sm md:text-base transition-colors"
                  >
                    {n.title}
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
