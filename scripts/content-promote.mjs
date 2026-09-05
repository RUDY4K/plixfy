// Explicit local editorial promotion. No network, commit, or deployment.
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { contentHash, readArray, readDrafts } from "./content-draft-store.mjs";
import { newsContentHash, mergeNewsEditorial } from "./news-publication.mjs";

export function fileHash(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function required(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing ${label}`);
  return value;
}
function localFile(root, relative) {
  required(relative, "relative file path");
  const target = path.resolve(root, relative);
  const rel = path.relative(root, target);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel) || rel.split(/[\\/]/).some((part) => part === ".private" || part.startsWith(".env"))) throw new Error("File must stay inside the review workspace");
  const real = fs.realpathSync(target);
  const realRelative = path.relative(fs.realpathSync(root), real);
  if (realRelative.startsWith("..") || path.isAbsolute(realRelative)) throw new Error("Review file escapes workspace");
  return target;
}

export function promoteContent(root, review) {
  if (review.kind === "blog-en-revisions") throw new Error("Legacy TypeScript revisions require a separate code-reviewed patch; whole-module replacement is disabled");
  if (!Array.isArray(review.locales) || !review.locales.length || new Set(review.locales).size !== review.locales.length || review.locales.some((locale) => !["ar", "en"].includes(locale))) throw new Error("Explicit reviewed locales required");
  if (review.kind === "news-en-revisions" && (review.locales.length !== 1 || review.locales[0] !== "en")) throw new Error("English revision can approve only English");
  required(review.reviewer, "reviewer");
  required(review.originalValue, "original value explanation");
  const time = Date.parse(review.reviewedAt);
  if (!Number.isFinite(time) || !/^\d{4}-\d{2}-\d{2}/.test(review.reviewedAt) || time > Date.now()) throw new Error("Invalid review date");
  if (!/^docs\/editorial-evidence\/[a-zA-Z0-9_/-]+\.md$/.test(review.evidenceFile)) throw new Error("Evidence must be a dated editorial evidence document");
  const evidence = fs.readFileSync(localFile(root, review.evidenceFile));
  if (!evidence.toString("utf8").trim() || fileHash(evidence) !== review.evidenceHash) throw new Error("Evidence hash mismatch");
  const draft = readDrafts(root, review.kind).find((item) => item.slug === review.slug);
  if (!draft || draft.status !== "pending_review") throw new Error("Pending draft not found");
  if (draft.contentHash !== review.draftHash || contentHash(draft.content) !== review.draftHash) throw new Error("Draft hash mismatch");
  if (!Number.isFinite(Date.parse(draft.generatedAt)) || time < Date.parse(draft.generatedAt)) throw new Error("Review predates draft or draft date is invalid");
  const targets = { news: "src/data/news.json", blog: "src/data/blog-generated.json", "news-en-revisions": "src/data/news.json", "blog-en-revisions": "src/lib/blogEn.ts" };
  const target = localFile(root, targets[review.kind]);
  const registryPath = localFile(root, `src/data/${review.kind === "blog" ? "blog" : "news"}-publication-review.json`);
  const lock = `${target}.review.lock`;
  const descriptor = fs.openSync(lock, "wx");
  const temporary = `${target}.${randomUUID()}.tmp`;
  const registryTemporary = `${registryPath}.${randomUUID()}.tmp`;
  try {
    const current = fs.readFileSync(target, "utf8");
    let output;
    let approvedRecord;
    {
      const items = readArray(target);
      const index = items.findIndex((item) => item.slug === draft.slug);
      if (review.kind === "news-en-revisions") {
        if (index < 0 || contentHash(items[index]) !== draft.baseHash) throw new Error("Published record changed since drafting");
        required(draft.content.titleEn, "English title");
        required(draft.content.summaryEn, "English summary");
        items[index] = { ...items[index], titleEn: draft.content.titleEn, summaryEn: draft.content.summaryEn };
      } else {
        if (index >= 0 || (draft.content.sourceUrl && items.some((item) => item.sourceUrl === draft.content.sourceUrl))) throw new Error("Already published slug or source");
        const { generatedDate, ...content } = draft.content;
        const date = review.reviewedAt.slice(0, 10);
        if (review.kind === "news") {
          for (const key of ["title", "summary", "titleEn", "summaryEn", "sourceName", "sourceUrl"]) required(content[key], key);
          if (new URL(content.sourceUrl).protocol !== "https:") throw new Error("News source must use HTTPS");
        } else {
          for (const language of ["ar", "en"]) {
            const localized = content[language];
            for (const key of ["title", "h1", "description", "intro"]) required(localized?.[key], `${language}.${key}`);
            if (!Array.isArray(localized.keywords) || localized.keywords.some((word) => typeof word !== "string" || !word.trim())) throw new Error("Invalid article keywords");
            if (!Array.isArray(localized.sections) || !localized.sections.length) throw new Error("Missing article sections");
            for (const section of localized.sections) {
              required(section?.heading, "section heading");
              if (!Array.isArray(section.paragraphs) || !section.paragraphs.length || section.paragraphs.some((paragraph) => typeof paragraph !== "string" || !paragraph.trim())) throw new Error("Invalid section paragraphs");
            }
            if (!Array.isArray(localized.faq)) throw new Error("Invalid article faq");
            for (const item of localized.faq) {
              required(item?.q, "FAQ question");
              required(item?.a, "FAQ answer");
            }
          }
          required(content.relatedCategory, "category");
          required(content.relatedCategoryTitle, "category title");
        }
        items.unshift({ ...content, publishedAt: date, ...(review.kind === "blog" ? { updatedAt: date } : {}) });
      }
      approvedRecord = items.find((item) => item.slug === draft.slug);
      output = JSON.stringify(items, null, 2) + "\n";
    }
    const registry = readArray(registryPath);
    const editorial = review.kind === "blog" ? {} : JSON.parse(fs.readFileSync(localFile(root, "src/data/news-editorial.json"), "utf8"));
    const entries = review.locales.map((locale) => {
      let hash;
      if (review.kind === "blog") {
        const c = approvedRecord[locale];
        const post = locale === "ar" ? {
          slug: approvedRecord.slug, title: c.title, h1: c.h1, description: c.description,
          publishedAt: approvedRecord.publishedAt, updatedAt: approvedRecord.updatedAt,
          keywords: c.keywords, intro: c.intro, sections: c.sections, faq: c.faq,
          relatedCategory: approvedRecord.relatedCategory, relatedCategoryTitle: approvedRecord.relatedCategoryTitle,
        } : {
          slug: approvedRecord.slug, title: c.title, h1: c.h1, description: c.description,
          keywords: c.keywords, intro: c.intro, sections: c.sections, faq: c.faq,
          relatedCategory: approvedRecord.relatedCategory, publishedAt: approvedRecord.publishedAt, updatedAt: approvedRecord.updatedAt,
        };
        hash = contentHash(post);
      } else hash = newsContentHash(mergeNewsEditorial(approvedRecord, editorial));
      return { slug: review.slug, locale, contentSha256: hash, evidencePath: review.evidenceFile,
        evidenceSha256: review.evidenceHash, reviewer: review.reviewer, reviewedAt: review.reviewedAt };
    });
    const nextRegistry = [...registry.filter((entry) => !(entry.slug === review.slug && review.locales.includes(entry.locale))), ...entries];
    const registryOutput = JSON.stringify(nextRegistry, null, 2) + "\n";
    // Receipt is prepared before the atomic target replacement. A failed receipt
    // leaves publication untouched; a failed replacement leaves a 'prepared'
    // receipt, never a false success record. Drafts remain as evidence.
    const receiptDirectory = path.join(root, "content-reviews");
    fs.mkdirSync(receiptDirectory, { recursive: true });
    const receipt = path.join(receiptDirectory, `${randomUUID()}.json`);
    fs.writeFileSync(receipt, JSON.stringify({ ...review, target: targets[review.kind], previousFileHash: fileHash(current), proposedFileHash: fileHash(output), status: "prepared" }, null, 2) + "\n", { flag: "wx" });
    fs.writeFileSync(temporary, output, { encoding: "utf8", flag: "wx" });
    fs.writeFileSync(registryTemporary, registryOutput, { encoding: "utf8", flag: "wx" });
    fs.renameSync(temporary, target);
    // Content goes first: interruption leaves it hidden by the stale/absent hash.
    fs.renameSync(registryTemporary, registryPath);
    return { target: targets[review.kind], receipt: path.relative(root, receipt), outputHash: fileHash(output) };
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    if (fs.existsSync(registryTemporary)) fs.unlinkSync(registryTemporary);
    fs.closeSync(descriptor);
    fs.unlinkSync(lock);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 2 || args[0] !== "--review") throw new Error("Usage: node scripts/content-promote.mjs --review <review.json>");
    const root = process.cwd();
    const result = promoteContent(root, JSON.parse(fs.readFileSync(localFile(root, args[1]), "utf8")));
    console.log(`Locally updated ${result.target}; receipt ${result.receipt}. No deployment performed.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
