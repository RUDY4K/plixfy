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

function hasPostDates(
  post: BlogPost | BlogPostEn,
): post is (BlogPost | BlogPostEn) & { publishedAt: string; updatedAt: string } {
  return typeof post.publishedAt === "string" && typeof post.updatedAt === "string";
}

const COPY = {
  ar: {
    metaTitle: `المدوّنة - ${BRAND_AR} | أدلّة ونصائح الألعاب`,
    metaDescription:
      "إرشادات لقراءة معلومات الألعاب واختيار الجهاز وحل مشكلات التشغيل في المتصفح.",
    ogDescription: "إرشادات لاختيار ألعاب المتصفح وحل مشكلات التشغيل.",
    home: "الرئيسية",
    blog: "المدوّنة",
    h1: "مدوّنة بليكسفاي",
    intro:
      "ابدأ بدليل اللعب من المتصفح: كيف تقرأ دعم الأجهزة واللغات، وما الفرق بين حفظ المفضلة وحفظ تقدم اللعبة، وماذا تفعل عند تعذر التشغيل. نراجع المقالات السابقة قبل إتاحتها مجددًا.",
    readMore: "اقرأ المقال ←",
  },
  en: {
    metaTitle: "Blog - Plixfy | Game Guides & Tips",
    metaDescription:
      "Guidance for reading game information, choosing a device, and troubleshooting browser playback.",
    ogDescription: "Guidance for choosing browser games and troubleshooting playback.",
    home: "Home",
    blog: "Blog",
    h1: "Plixfy Blog",
    intro:
      "Start with our browser game guide: how to read device and language information, distinguish favorites from saved game progress, and troubleshoot playback. Earlier articles are being reviewed before republication.",
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
    robots: { index: false, follow: true },
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
      ...(hasPostDates(p) ? { datePublished: p.publishedAt, dateModified: p.updatedAt } : {}),
      description: p.description,
    })),
  };

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd).replace(/</g, "\\u003c") }}
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

      <section className="mb-8 rounded-2xl border border-primary/20 bg-surface p-6">
        <h2 className="text-xl font-bold text-text-primary">{locale === "ar" ? "اختر لعبة واعرف ما تفعله إذا لم تعمل" : "Choose a game and know what to do if it will not run"}</h2>
        <p className="mt-3 leading-7 text-text-secondary">{locale === "ar" ? "شرح عملي لمعلومات الأجهزة واللغات، وحفظ التقدم، والشاشة الفارغة، والتحكم باللمس والصوت." : "Practical guidance on devices, languages, saved progress, blank screens, touch controls, and sound."}</p>
        <Link href={localeHref(locale, "/guides/browser-games")} className="mt-4 inline-flex min-h-11 items-center font-bold text-primary underline">{locale === "ar" ? "اقرأ دليل اللعب من المتصفح" : "Read the browser game guide"}</Link>
      </section>
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
