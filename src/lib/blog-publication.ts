import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import reviewData from "@/data/blog-publication-review.json";
import type { Locale } from "@/lib/i18n";

interface PublicationReview {
  slug: string;
  locale: Locale;
  contentSha256: string;
  evidencePath: string;
  evidenceSha256: string;
  reviewer: string;
  reviewedAt: string;
}

/** Hash the complete rendered post, including metadata, in its normalized shape. */
export function blogContentHash(post: { slug: string }): string {
  return createHash("sha256").update(JSON.stringify(post)).digest("hex");
}

/** Fail closed on missing, stale, malformed, or unverifiable review evidence. */
export function isBlogPublicationApproved(post: { slug: string }, locale: Locale): boolean {
  const reviews = reviewData as PublicationReview[];
  if (!Array.isArray(reviews)) return false;
  const matches = reviews.filter((entry) => entry?.slug === post.slug && entry.locale === locale);
  if (matches.length !== 1) return false;
  const review = matches[0];
  const reviewedAt = Date.parse(review.reviewedAt);
  if (typeof review.reviewer !== "string" || !review.reviewer.trim() || !Number.isFinite(reviewedAt) || reviewedAt > Date.now()) return false;
  if (review.contentSha256 !== blogContentHash(post)) return false;
  if (!/^docs\/editorial-evidence\/[a-zA-Z0-9_/-]+\.md$/.test(review.evidencePath)) return false;
  try {
    const evidenceName = review.evidencePath.slice("docs/editorial-evidence/".length);
    const evidence = readFileSync(path.join(process.cwd(), "docs/editorial-evidence", evidenceName));
    return evidence.toString("utf8").trim().length > 0 && createHash("sha256").update(evidence).digest("hex") === review.evidenceSha256;
  } catch {
    return false;
  }
}
