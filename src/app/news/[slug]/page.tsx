import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getAllNews, getNewsBySlug, getNewsSlugs, formatNewsDate } from "@/lib/news";
import { BRAND_AR } from "@/lib/siteContent";

const SITE = "https://www.plixfy.com";

export const revalidate = 21600;

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getNewsSlugs().map((slug) => ({ slug }));
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
  const { slug } = await params;
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
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify([articleLd, breadcrumbLd]) }}
      />
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/" },
          { label: "أخبار الألعاب", href: "/news" },
          { label: item.title },
        ]}
      />

      <article>
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary leading-snug">
            {item.title}
          </h1>
          <div className="flex items-center gap-3 mt-3 text-sm text-text-secondary">
            <time dateTime={item.publishedAt}>{formatNewsDate(item.publishedAt)}</time>
          </div>
        </header>

        <div className="text-sm md:text-base text-text-secondary leading-loose whitespace-pre-line">
          {item.summary}
        </div>

        <p className="mt-6 text-sm text-text-secondary">
          المصدر الأصلي:{" "}
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-primary hover:underline"
          >
            {item.sourceName}
          </a>
        </p>
      </article>

      <div className="mt-10 rounded-2xl bg-gradient-to-r from-primary/15 to-accent/15 p-5 border border-primary/25 text-center">
        <p className="text-base font-bold text-text-primary mb-1">
          خذ استراحة من الأخبار والعب مجاناً 🎮
        </p>
        <Link href="/" className="text-primary hover:underline text-sm font-semibold">
          تصفّح مئات الألعاب بدون تحميل على بليكسفاي
        </Link>
      </div>

      {otherNews.length > 0 && (
        <section className="mt-10 border-t border-white/10 pt-6">
          <h2 className="text-lg md:text-xl font-bold text-text-primary mb-4">
            أخبار أخرى
          </h2>
          <ul className="space-y-2">
            {otherNews.map((n) => (
              <li key={n.slug}>
                <Link
                  href={"/news/" + n.slug}
                  className="text-primary hover:underline text-sm md:text-base"
                >
                  {n.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
