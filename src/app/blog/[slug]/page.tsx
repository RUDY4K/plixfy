import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryStrip from "@/components/CategoryStrip";
import { getPostBySlug, getPostSlugs, getAllPosts } from "@/lib/blog";
import { getGamesByCategory } from "@/lib/games";
import { BRAND_AR } from "@/lib/siteContent";

const SITE = "https://www.plixfy.com";

export const revalidate = 86400;

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    keywords: [...post.keywords],
    alternates: { canonical: "/blog/" + post.slug },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: SITE + "/blog/" + post.slug,
      siteName: "Plixfy",
      locale: "ar_SA",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: PageParams) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const relatedGames = getGamesByCategory(post.relatedCategory).slice(0, 12);
  const otherPosts = getAllPosts().filter((p) => p.slug !== post.slug).slice(0, 3);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.h1,
    description: post.description,
    inLanguage: "ar",
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: BRAND_AR },
    publisher: {
      "@type": "Organization",
      name: BRAND_AR,
      logo: { "@type": "ImageObject", url: SITE + "/opengraph-image.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": SITE + "/blog/" + post.slug },
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
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "المدوّنة", item: SITE + "/blog" },
      { "@type": "ListItem", position: 3, name: post.h1, item: SITE + "/blog/" + post.slug },
    ],
  };

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([articleLd, faqLd, breadcrumbLd]),
        }}
      />
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/" },
          { label: "المدوّنة", href: "/blog" },
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
            أسئلة شائعة
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
            title={"جرّب " + post.relatedCategoryTitle + " الآن"}
            viewAllHref={"/category/" + post.relatedCategory}
            games={relatedGames}
          />
        </div>
      )}

      {otherPosts.length > 0 && (
        <section className="border-t border-white/10 pt-6">
          <h2 className="text-lg md:text-xl font-bold text-text-primary mb-4">
            مقالات أخرى
          </h2>
          <ul className="space-y-2">
            {otherPosts.map((p) => (
              <li key={p.slug}>
                <Link
                  href={"/blog/" + p.slug}
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
