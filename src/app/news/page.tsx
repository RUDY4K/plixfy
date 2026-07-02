import Link from "next/link";
import type { Metadata } from "next";
import { getAllNews, formatNewsDate } from "@/lib/news";
import { BRAND_AR } from "@/lib/siteContent";

const SITE = "https://www.plixfy.com";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: `أخبار الألعاب - ${BRAND_AR} | آخر أخبار عالم ألعاب الفيديو بالعربية`,
  description:
    "آخر أخبار ألعاب الفيديو بالعربية: بلايستيشن، إكس بوكس، نينتندو، وأهم إصدارات وتحديثات الألعاب حول العالم — ملخّصة ومحدّثة يومياً على بليكسفاي.",
  alternates: { canonical: "/news" },
  openGraph: {
    type: "website",
    title: `أخبار الألعاب - ${BRAND_AR}`,
    description: "آخر أخبار عالم ألعاب الفيديو بالعربية، محدّثة يومياً.",
    url: SITE + "/news",
    siteName: "Plixfy",
    locale: "ar_SA",
  },
};

export default function NewsIndexPage() {
  const items = getAllNews();

  const listLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "أخبار الألعاب - " + BRAND_AR,
    url: SITE + "/news",
    inLanguage: "ar",
    isPartOf: { "@type": "WebSite", name: "Plixfy", url: SITE },
  };

  return (
    // قسم الأخبار يستخدم ثيماً فاتحاً «صحفياً» مقصوداً — مختلف عن بقية الموقع
    <div className="bg-[#f4f6f9] min-h-screen">
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }}
        />

        <nav aria-label="مسار التنقل" className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-700 transition-colors">
            الرئيسية
          </Link>
          <span className="mx-2" aria-hidden="true">
            ‹
          </span>
          <span className="text-slate-800 font-semibold">أخبار الألعاب</span>
        </nav>

        <header className="mb-10 border-b-2 border-slate-200 pb-8">
          <div className="flex items-center gap-3 mb-3">
            <span
              aria-hidden="true"
              className="w-1.5 h-9 rounded-sm bg-blue-700"
            />
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              أخبار الألعاب
            </h1>
          </div>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl">
            آخر أخبار عالم ألعاب الفيديو بالعربية: إصدارات، تحديثات، وقرارات
            كبرى من بلايستيشن وإكس بوكس ونينتندو وغيرها — ملخّصة بعناية مع
            روابط المصادر الأصلية. تُحدَّث القائمة يومياً.
          </p>
        </header>

        <div className="space-y-5">
          {items.map((item, idx) => (
            <article
              key={item.slug}
              className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <Link href={"/news/" + item.slug} className="block group">
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">
                    {item.sourceName}
                  </span>
                  <time dateTime={item.publishedAt} className="text-slate-500">
                    {formatNewsDate(item.publishedAt)}
                  </time>
                  {idx === 0 ? (
                    <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-bold">
                      الأحدث
                    </span>
                  ) : null}
                </div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-blue-800 transition-colors leading-snug">
                  {item.title}
                </h2>
                <p className="text-sm text-slate-600 mt-2.5 leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
                <span className="inline-block mt-3 text-sm font-semibold text-blue-700 group-hover:underline">
                  اقرأ الخبر كاملاً ←
                </span>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-gradient-to-l from-[#1a1030] to-[#2a1245] p-6 text-center shadow-md">
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
      </main>
    </div>
  );
}
