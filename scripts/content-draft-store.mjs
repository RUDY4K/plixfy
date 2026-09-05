// Generated content is untrusted editorial input, never a publication approval.
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

export function contentHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function readArray(file, { missing = false } = {}) {
  let data;
  try { data = JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) {
    if (missing && error.code === "ENOENT") return [];
    throw error;
  }
  if (!Array.isArray(data)) throw new Error(`Expected array: ${file}`);
  return data;
}

export function draftFile(root, kind) {
  if (!["news", "blog", "news-en-revisions", "blog-en-revisions"].includes(kind)) {
    throw new Error("Unknown draft collection");
  }
  return path.join(root, "content-drafts", `${kind}.json`);
}

export function readDrafts(root, kind) {
  return readArray(draftFile(root, kind), { missing: true });
}

export function saveDrafts(root, kind, candidates, { published = [], revision = false } = {}) {
  const file = draftFile(root, kind);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const lock = `${file}.lock`;
  const descriptor = fs.openSync(lock, "wx");
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    const existing = readDrafts(root, kind);
    const slugs = new Set(existing.map((item) => item.slug));
    const urls = new Set(existing.map((item) => item.content?.sourceUrl).filter(Boolean));
    if (!revision) for (const item of published) {
      slugs.add(item.slug);
      if (item.sourceUrl) urls.add(item.sourceUrl);
    }
    const fresh = [];
    for (const candidate of candidates) {
      const { content, evidence, baseHash } = candidate;
      if (!content || typeof content.slug !== "string" || !content.slug.trim()) throw new Error("Draft requires slug");
      if (!evidence || typeof evidence !== "object") throw new Error("Draft requires source evidence");
      if (revision && !/^[a-f0-9]{64}$/.test(baseHash || "")) throw new Error("Revision requires base hash");
      if (slugs.has(content.slug) || (content.sourceUrl && urls.has(content.sourceUrl))) continue;
      slugs.add(content.slug);
      if (content.sourceUrl) urls.add(content.sourceUrl);
      fresh.push({
        slug: content.slug, status: "pending_review", kind,
        generatedAt: new Date().toISOString(), contentHash: contentHash(content),
        ...(revision ? { baseHash } : {}), content, evidence,
      });
    }
    if (fresh.length) {
      fs.writeFileSync(temporary, JSON.stringify([...existing, ...fresh], null, 2) + "\n", { encoding: "utf8", flag: "wx" });
      fs.renameSync(temporary, file);
    }
    return fresh.length;
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    fs.closeSync(descriptor);
    fs.unlinkSync(lock);
  }
}
