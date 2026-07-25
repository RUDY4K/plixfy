import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getAllPosts, type BlogPost } from "@/lib/blog";
import { getAllPostsEn, type BlogPostEn } from "@/lib/blogEn";
import { BRAND_AR } from "@/lib/siteContent";
import {
  locales,
  hasLocale,
  localeHref,
  ogLocaleFor,
  pageAlternates,
  type Locale,
} from "@/lib/i18n";

const SITE = "https://www.plixfy.com";

export const revalidate = 86400;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** يفرّق بين النسخة العربية (فيها تواريخ نشر) والإنجليزية */
function isArPost(post: BlogPost | BlogPostEn): post is BlogPost {
  return "relatedCategoryTitle" in post;
}

const COPY = {
  ar: {
    metaTitle: `المدوّنة - ${BRAND_AR} | أدلّة ونصائح الألعاب`,
    metaDescription:
      "مقالات وأدلّة عن أفضل الألعاب المجانية أونلاين: ألعاب سباق، بنات، آيو، وأكثر. نصائح للّعب وترشيحات مختارة من بليكسفاي.",
    ogDescription: "أدلّة ونصائح وترشيحات لأفضل الألعاب المجانية أونلاين.",
    home: "الرئيسية",
    blog: "المدوّنة",
    h1: "مدوّنة بليكسفاي",
    intro:
      "أدلّة ونصائح وترشيحات مختارة لأفضل الألعاب المجانية أونلاين. اكتشف ألعاباً جديدة وتعلّم كيف تتفوّق فيها.",
    readMore: "اقرأ المقال ←",
  },
  en: {
    metaTitle: "Blog - Plixfy | Game Guides & Tips",
    metaDescription:
      "Articles and guides on the best free online games: racing, girls games, .io, and more. Tips and hand-picked recommendations from Plixfy.",
    ogDescription: "Guides, tips, and hand-picked recommendations for the best free online games.",
    home: "Home",
    blog: "Blog",
    h1: "Plixfy Blog",
    intro:
      "Hand-picked guides, tips, and recommendations for the best free online games. Discover new games and learn how to master them.",
    readMore: "Read article →",
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const c = COPY[locale];

  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: {
      ...pageAlternates(locale, "/blog"),
      ...(locale === "ar" ? { types: { "application/rss+xml": "/blog/rss.xml" } } : {}),
    },
    openGraph: {
      type: "website",
      title: c.metaTitle,
      description: c.ogDescription,
      url: SITE + localeHref(locale, "/blog"),
      siteName: "Plixfy",
      locale: ogLocaleFor(locale),
    },
  };
}

export default async function BlogIndexPage({
  params,
}: PageProps<"/[locale]/blog">) {
  const { locale } = (await params) as { locale: Locale };
  if (!hasLocale(locale)) notFound();
  const c = COPY[locale];
  const posts = locale === "en" ? getAllPostsEn() : getAllPosts();

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: c.h1,
    url: SITE + localeHref(locale, "/blog"),
    inLanguage: locale,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.h1,
      url: SITE + localeHref(locale, "/blog/" + p.slug),
      ...(isArPost(p) ? { datePublished: p.publishedAt, dateModified: p.updatedAt } : {}),
      description: p.description,
    })),
  };

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }}
      />
      <Breadcrumbs
        locale={locale}
        items={[{ label: c.home, href: localeHref(locale, "/") }, { label: c.blog }]}
      />

      <header className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary">{c.h1}</h1>
        <p className="text-sm md:text-base text-text-secondary mt-2 max-w-3xl leading-relaxed">
          {c.intro}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={localeHref(locale, "/blog/" + post.slug)}
            className="block rounded-2xl bg-surface p-5 md:p-6 border border-white/5 hover:border-primary/40 transition-colors"
          >
            <h2 className="text-lg md:text-xl font-bold text-text-primary mb-2">
              {post.h1}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
              {post.description}
            </p>
            <span className="inline-block mt-3 text-sm font-semibold text-primary">
              {c.readMore}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
