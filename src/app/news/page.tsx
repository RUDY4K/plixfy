import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
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
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }}
      />
      <Breadcrumbs
        items={[{ label: "الرئيسية", href: "/" }, { label: "أخبار الألعاب" }]}
      />

      <header className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary">
          أخبار الألعاب
        </h1>
        <p className="text-sm md:text-base text-text-secondary mt-3 leading-relaxed">
          آخر أخبار عالم ألعاب الفيديو بالعربية: إصدارات، تحديثات، وقرارات كبرى
          من بلايستيشن وإكس بوكس ونينتندو وغيرها — ملخّصة بعناية مع روابط
          المصادر الأصلية.
        </p>
      </header>

      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.slug}
            className="rounded-2xl bg-surface p-5 border border-white/5 hover:border-primary/30 transition-colors"
          >
            <Link href={"/news/" + item.slug} className="block group">
              <h2 className="text-lg md:text-xl font-bold text-text-primary group-hover:text-primary transition-colors leading-snug">
                {item.title}
              </h2>
              <p className="text-sm text-text-secondary mt-2 leading-relaxed line-clamp-3">
                {item.summary}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-text-secondary">
                <time dateTime={item.publishedAt}>
                  {formatNewsDate(item.publishedAt)}
                </time>
                <span aria-hidden="true">·</span>
                <span>المصدر: {item.sourceName}</span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
