import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}

/** Includes the complete source record and all editorial enhancements. */
export function newsContentHash(item) {
  return createHash('sha256').update(JSON.stringify(canonical(item))).digest('hex');
}

export function mergeNewsEditorial(item, editorial = {}) {
  return { ...item, ...(editorial[item.slug] ?? {}) };
}

/** A reviewer must approve the exact rendered revision in each language. */
export function isNewsPublicationApproved(item, locale, reviews, root = process.cwd()) {
  if (!item?.slug || !['ar', 'en'].includes(locale) || !Array.isArray(reviews)) return false;
  if (locale === 'en' && (!item.titleEn?.trim() || !item.summaryEn?.trim())) return false;
  if (!item.title?.trim() || !item.summary?.trim() || !item.sourceUrl?.trim()) return false;
  const matches = reviews.filter(entry => entry?.slug === item.slug && entry.locale === locale);
  if (matches.length !== 1) return false;
  const review = matches[0];
  if (typeof review.reviewer !== 'string' || !review.reviewer.trim()) return false;
  const time = Date.parse(review.reviewedAt);
  if (!Number.isFinite(time) || time > Date.now() || review.contentSha256 !== newsContentHash(item)) return false;
  if (typeof review.evidencePath !== 'string' || !/^docs\/editorial-evidence\/[a-zA-Z0-9_/-]+\.md$/.test(review.evidencePath)) return false;
  try {
    const evidence = readFileSync(path.join(root, 'docs/editorial-evidence', review.evidencePath.slice('docs/editorial-evidence/'.length)));
    return evidence.toString('utf8').trim().length > 0 && createHash('sha256').update(evidence).digest('hex') === review.evidenceSha256;
  } catch { return false; }
}

export function getPublishedNews(items, editorial, reviews, locale = 'ar', root = process.cwd()) {
  return items.map(item => mergeNewsEditorial(item, editorial)).filter(item => isNewsPublicationApproved(item, locale, reviews, root));
}
