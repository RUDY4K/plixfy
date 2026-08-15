import generatedBlogData from "@/data/blog-generated.json";
import type { CategorySlug } from "@/lib/games";

export interface GeneratedBlogSection {
  heading: string;
  paragraphs: readonly string[];
}

export interface GeneratedBlogFaq {
  q: string;
  a: string;
}

export interface GeneratedBlogContent {
  title: string;
  h1: string;
  description: string;
  keywords: readonly string[];
  intro: string;
  sections: readonly GeneratedBlogSection[];
  faq: readonly GeneratedBlogFaq[];
}

export interface GeneratedBlogRecord {
  slug: string;
  publishedAt: string;
  updatedAt: string;
  relatedCategory: CategorySlug;
  relatedCategoryTitle: string;
  ar: GeneratedBlogContent;
  en: GeneratedBlogContent;
}

export function getGeneratedBlogRecords(): readonly GeneratedBlogRecord[] {
  return generatedBlogData as readonly GeneratedBlogRecord[];
}

export function isGeneratedBlogSlug(slug: string): boolean {
  return getGeneratedBlogRecords().some((post) => post.slug === slug);
}
