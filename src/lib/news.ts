import newsData from "@/data/news.json";

export interface NewsItem {
  slug: string;
  /** عنوان عربي أصلي */
  title: string;
  /** ملخّص عربي أصلي مُعاد صياغته — ليس ترجمة حرفية */
  summary: string;
  /** عنوان إنجليزي أصلي — قد يكون غير متوفر للعناصر القديمة قبل الدعم الإنجليزي */
  titleEn?: string;
  /** ملخّص إنجليزي أصلي — قد يكون غير متوفر للعناصر القديمة قبل الدعم الإنجليزي */
  summaryEn?: string;
  /** اسم المصدر الأصلي للخبر (يُعرض مع رابط الإسناد) */
  sourceName: string;
  sourceUrl: string;
  /** Original editorial image used on the news page and branded social card. */
  image?: string;
  /** YYYY-MM-DD */
  publishedAt: string;
}

const ITEMS: readonly NewsItem[] = newsData as NewsItem[];

export function getAllNews(): readonly NewsItem[] {
  return [...ITEMS].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

/** الـ slug يصل من الرابط مُرمَّزًا (percent-encoded) للعناوين العربية — نفكّ الترميز قبل المقارنة */
function normalizeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function getNewsBySlug(slug: string): NewsItem | undefined {
  const decoded = normalizeSlug(slug);
  return ITEMS.find((n) => n.slug === decoded);
}

export function getNewsSlugs(): readonly string[] {
  return ITEMS.map((n) => n.slug);
}

export function formatNewsDate(iso: string, locale: "ar" | "en" = "ar"): string {
  const date = new Date(iso + "T00:00:00Z");
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** العنوان حسب اللغة — يرجع للعربي إذا العنصر قديم وما فيه نسخة إنجليزية بعد */
export function newsTitle(item: NewsItem, locale: "ar" | "en"): string {
  return locale === "en" ? (item.titleEn ?? item.title) : item.title;
}

/** الملخّص حسب اللغة — يرجع للعربي إذا العنصر قديم وما فيه نسخة إنجليزية بعد */
export function newsSummary(item: NewsItem, locale: "ar" | "en"): string {
  return locale === "en" ? (item.summaryEn ?? item.summary) : item.summary;
}
