import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getAllPosts } from "@/lib/blog";
import { BRAND_AR } from "@/lib/siteContent";

const SITE = "https://www.plixfy.com";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `المدوّنة - ${BRAND_AR} | أدلّة ونصائح الألعاب`,
  description:
    "مقالات وأدلّة عن أفضل الألعاب المجانية أونلاين: ألعاب سباق، بنات، آيو، وأكثر. نصائح للّعب وترشيحات مختارة من بليكسفاي.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: `المدوّنة - ${BRAND_AR}`,
    description: "أدلّة ونصائح وترشيحات لأفضل الألعاب المجانية أونلاين.",
    url: SITE + "/blog",
    siteName: "Plixfy",
    locale: "ar_SA",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `مدوّنة ${BRAND_AR}`,
    url: SITE + "/blog",
    inLanguage: "ar",
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.h1,
      url: SITE + "/blog/" + p.slug,
      datePublished: p.publishedAt,
      dateModified: p.updatedAt,
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
        items={[{ label: "الرئيسية", href: "/" }, { label: "المدوّنة" }]}
      />

      <header className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary">
          مدوّنة بليكسفاي
        </h1>
        <p className="text-sm md:text-base text-text-secondary mt-2 max-w-3xl leading-relaxed">
          أدلّة ونصائح وترشيحات مختارة لأفضل الألعاب المجانية أونلاين. اكتشف
          ألعاباً جديدة وتعلّم كيف تتفوّق فيها.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={"/blog/" + post.slug}
            className="block rounded-2xl bg-surface p-5 md:p-6 border border-white/5 hover:border-primary/40 transition-colors"
          >
            <h2 className="text-lg md:text-xl font-bold text-text-primary mb-2">
              {post.h1}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
              {post.description}
            </p>
            <span className="inline-block mt-3 text-sm font-semibold text-primary">
              اقرأ المقال ←
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
