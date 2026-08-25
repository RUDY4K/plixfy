import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryStrip from "@/components/CategoryStrip";
import { getPostBySlug, getPostSlugs, getAllPosts, type BlogPost } from "@/lib/blog";
import { getPostEnBySlug, getPostEnSlugs, getAllPostsEn, type BlogPostEn } from "@/lib/blogEn";
import { getGamesByCategory } from "@/lib/games";
import { getLocalizedCategoryMeta } from "@/lib/categoryI18n";
import { BRAND_AR } from "@/lib/siteContent";
import { hasLocale, localeHref, ogLocaleFor, pageAlternates, type Locale } from "@/lib/i18n";

const SITE = "https://www.plixfy.com";

export const revalidate = 86400;

interface PageParams {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  return [
    ...getPostSlugs().map((slug) => ({ locale: "ar", slug })),
    ...getPostEnSlugs().map((slug) => ({ locale: "en", slug })),
  ];
}

const COPY = {
  ar: {
    brand: BRAND_AR,
    home: "الرئيسية",
    blog: "المدوّنة",
    faqHeading: "أسئلة شائعة",
    playNow: (category: string) => "جرّب " + category + " الآن",
    otherPosts: "مقالات أخرى",
  },
  en: {
    brand: "Plixfy",
    home: "Home",
    blog: "Blog",
    faqHeading: "FAQ",
    playNow: (category: string) => "Try " + category + " Now",
    otherPosts: "Other Articles",
  },
} as const;

function getPost(locale: Locale, slug: string) {
  return locale === "en" ? getPostEnBySlug(slug) : getPostBySlug(slug);
}

/** يفرّق بين النسخة العربية (فيها تواريخ نشر وعنوان تصنيف) والإنجليزية */
function isArPost(post: BlogPost | BlogPostEn): post is BlogPost {
  return "relatedCategoryTitle" in post;
}

function hasPostDates(
  post: BlogPost | BlogPostEn,
): post is (BlogPost | BlogPostEn) & { publishedAt: string; updatedAt: string } {
  return typeof post.publishedAt === "string" && typeof post.updatedAt === "string";
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  const post = getPost(locale, slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    keywords: [...post.keywords],
    // The current category roundups remain available to readers, but are kept
    // out of search until each one is rebuilt around verified, first-hand
    // comparisons. This prevents template-style articles from weakening the
    // site's overall content-quality signals.
    robots: { index: false, follow: true },
    alternates: pageAlternates(locale, "/blog/" + post.slug),
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: SITE + localeHref(locale, "/blog/" + post.slug),
      siteName: "Plixfy",
      locale: ogLocaleFor(locale),
      ...(hasPostDates(post) ? { publishedTime: post.publishedAt, modifiedTime: post.updatedAt } : {}),
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function BlogPostPage({ params }: PageParams) {
  const { locale: rawLocale, slug } = await params;
  if (!hasLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const c = COPY[locale];
  const post = getPost(locale, slug);
  if (!post) notFound();

  const relatedGames = getGamesByCategory(post.relatedCategory).slice(0, 12);
  const allPosts = locale === "en" ? getAllPostsEn() : getAllPosts();
  const others = allPosts.filter((p) => p.slug !== post.slug);
  const otherPosts = [
    ...others.filter((p) => p.relatedCategory === post.relatedCategory),
    ...others.filter((p) => p.relatedCategory !== post.relatedCategory),
  ].slice(0, 3);

  const categoryTitle = isArPost(post)
    ? post.relatedCategoryTitle
    : getLocalizedCategoryMeta(post.relatedCategory, "en")?.name ?? post.relatedCategory;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.h1,
    description: post.description,
    inLanguage: locale,
    ...(hasPostDates(post) ? { datePublished: post.publishedAt, dateModified: post.updatedAt } : {}),
    author: { "@type": "Organization", name: c.brand },
    publisher: {
      "@type": "Organization",
      name: c.brand,
      logo: { "@type": "ImageObject", url: SITE + "/opengraph-image.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": SITE + localeHref(locale, "/blog/" + post.slug) },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: c.home, item: SITE + localeHref(locale, "/") },
      { "@type": "ListItem", position: 2, name: c.blog, item: SITE + localeHref(locale, "/blog") },
      { "@type": "ListItem", position: 3, name: post.h1, item: SITE + localeHref(locale, "/blog/" + post.slug) },
    ],
  };

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify([articleLd, faqLd, breadcrumbLd]) }}
      />
      <Breadcrumbs
        locale={locale}
        items={[
          { label: c.home, href: localeHref(locale, "/") },
          { label: c.blog, href: localeHref(locale, "/blog") },
          { label: post.h1 },
        ]}
      />

      <article>
        <header className="mb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-text-primary leading-snug">
            {post.h1}
          </h1>
          <p className="text-sm md:text-base text-text-secondary mt-4 leading-loose">
            {post.intro}
          </p>
        </header>

        {post.sections.map((section) => (
          <section key={section.heading} className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
              {section.heading}
            </h2>
            {section.paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-sm md:text-base text-text-secondary leading-loose mb-3"
              >
                {p}
              </p>
            ))}
          </section>
        ))}

        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
            {c.faqHeading}
          </h2>
          <div className="space-y-4">
            {post.faq.map((f) => (
              <div key={f.q} className="rounded-2xl bg-surface p-4 border border-white/5">
                <h3 className="text-base font-semibold text-text-primary mb-1.5">
                  {f.q}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      {relatedGames.length > 0 && (
        <div className="mb-8">
          <CategoryStrip
            title={c.playNow(categoryTitle)}
            viewAllHref={localeHref(locale, "/category/" + post.relatedCategory)}
            games={relatedGames}
            locale={locale}
          />
        </div>
      )}

      {otherPosts.length > 0 && (
        <section className="border-t border-white/10 pt-6">
          <h2 className="text-lg md:text-xl font-bold text-text-primary mb-4">
            {c.otherPosts}
          </h2>
          <ul className="space-y-2">
            {otherPosts.map((p) => (
              <li key={p.slug}>
                <Link
                  href={localeHref(locale, "/blog/" + p.slug)}
                  className="text-primary hover:underline text-sm md:text-base"
                >
                  {p.h1}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
