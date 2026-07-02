import newsData from "@/data/news.json";

export interface NewsItem {
  slug: string;
  /** عنوان عربي أصلي */
  title: string;
  /** ملخّص عربي أصلي مُعاد صياغته — ليس ترجمة حرفية */
  summary: string;
  /** اسم المصدر الأصلي للخبر (يُعرض مع رابط الإسناد) */
  sourceName: string;
  sourceUrl: string;
  /** YYYY-MM-DD */
  publishedAt: string;
}

const ITEMS: readonly NewsItem[] = newsData as NewsItem[];

export function getAllNews(): readonly NewsItem[] {
  return [...ITEMS].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getNewsBySlug(slug: string): NewsItem | undefined {
  return ITEMS.find((n) => n.slug === slug);
}

export function getNewsSlugs(): readonly string[] {
  return ITEMS.map((n) => n.slug);
}

export function formatNewsDate(iso: string): string {
  const date = new Date(iso + "T00:00:00Z");
  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
