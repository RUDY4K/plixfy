import newsData from "@/data/news.json";
import editorialData from "@/data/news-editorial.json";

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
  /** Original source publication time when available. */
  sourcePublishedAt?: string;
  /** Human-reviewed, Plixfy-original context layered on top of the sourced report. */
  keyPoints?: readonly string[];
  whyItMatters?: string;
  keyPointsEn?: readonly string[];
  whyItMattersEn?: string;
  /** Search eligibility is deliberately granted by a separate editorial review file. */
  searchEligible?: boolean;
  searchEligibleEn?: boolean;
  /** ISO date of the latest human editorial review. */
  reviewedAt?: string;
}

type EditorialReview = Pick<
  NewsItem,
  | "keyPoints"
  | "whyItMatters"
  | "keyPointsEn"
  | "whyItMattersEn"
  | "searchEligible"
  | "searchEligibleEn"
  | "reviewedAt"
>;

const EDITORIAL_REVIEWS = editorialData as Record<string, EditorialReview>;
const ITEMS: readonly NewsItem[] = (newsData as NewsItem[]).map((item) => ({
  ...item,
  ...(EDITORIAL_REVIEWS[item.slug] ?? {}),
}));

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

/**
 * Fail-closed quality gate for search landing pages. Automated news summaries
 * remain available to visitors but cannot enter search until a separate
 * editorial review adds useful original context.
 */
export function isSearchEligibleNews(
  item: NewsItem,
  locale: "ar" | "en" = "ar",
): boolean {
  const keyPoints = locale === "en" ? item.keyPointsEn : item.keyPoints;
  const whyItMatters = locale === "en" ? item.whyItMattersEn : item.whyItMatters;
  const approved = locale === "en" ? item.searchEligibleEn : item.searchEligible;
  const summary = locale === "en" ? item.summaryEn : item.summary;

  return Boolean(
    approved === true &&
      item.image &&
      item.reviewedAt &&
      summary &&
      summary.length >= 450 &&
      keyPoints &&
      keyPoints.length >= 3 &&
      whyItMatters &&
      whyItMatters.length >= 90,
  );
}

export function getSearchEligibleNews(locale: "ar" | "en" = "ar"): readonly NewsItem[] {
  return getAllNews().filter((item) => isSearchEligibleNews(item, locale));
}

export function newsKeyPoints(item: NewsItem, locale: "ar" | "en"): readonly string[] {
  return locale === "en" ? (item.keyPointsEn ?? []) : (item.keyPoints ?? []);
}

export function newsWhyItMatters(item: NewsItem, locale: "ar" | "en"): string | undefined {
  return locale === "en" ? item.whyItMattersEn : item.whyItMatters;
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
