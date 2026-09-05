// Prepare English news revision drafts; published news is read-only.
import fs from "node:fs";
import { readDrafts, saveDrafts, contentHash } from "./content-draft-store.mjs";
import path from "node:path";
import { runClaude, extractJson } from "./claude-cli.mjs";

const NEWS_FILE = path.join("src", "data", "news.json");
const BATCH = 10;

function buildPrompt(batch) {
  const block = batch
    .map(
      (n, i) =>
        `${i + 1}. slug: "${n.slug}"\n   Arabic title: ${n.title}\n   Arabic summary: ${n.summary}`,
    )
    .join("\n\n");

  return `You are a professional video game news editor writing English content for Plixfy (plixfy.com). Below are video game news items currently published in Arabic only. For EACH one, write an ORIGINAL English title and summary conveying the exact same facts as the Arabic version (do not invent new details, do not translate word-for-word — write it as if reporting the same story independently).

- "titleEn": a natural, engaging English news headline
- "summaryEn": 100-180 words, same facts as the Arabic summary

Items:

${block}

Return ONLY a JSON object mapping each slug to {"titleEn": "...", "summaryEn": "..."}:
{"<slug>": {"titleEn": "...", "summaryEn": "..."}}`;
}

function main() {
  const items = JSON.parse(fs.readFileSync(NEWS_FILE, "utf8"));
  const pending = new Set(readDrafts(process.cwd(), "news-en-revisions").map((draft) => draft.slug));
  const targets = items.filter((n) => (!n.titleEn || !n.summaryEn) && !pending.has(n.slug));
  console.log(`${targets.length}/${items.length} items need English backfill.`);

  if (targets.length === 0) {
    console.log("Nothing to do.");
    return;
  }



  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    console.log(`Batch ${Math.floor(i / BATCH) + 1}: ${batch.map((n) => n.slug).join(", ")}`);
    const raw = runClaude({
      prompt: buildPrompt(batch),
      model: "haiku",
      timeoutMs: 15 * 60 * 1000,
    });
    const json = extractJson(raw);

    const drafts = [];
    let ok = 0;
    for (const n of batch) {
      const c = json[n.slug];
      if (c && typeof c.titleEn === "string" && typeof c.summaryEn === "string") {
        drafts.push({ content: { slug: n.slug, titleEn: c.titleEn, summaryEn: c.summaryEn },
          baseHash: contentHash(n), evidence: { generator: "claude-cli", original: n, operation: "English revision" } });
        ok++;
      } else {
        console.warn(`  ! missing/invalid English for ${n.slug} — will retry on next run`);
      }
    }
    saveDrafts(process.cwd(), "news-en-revisions", drafts, { revision: true });
    console.log(`  ✓ ${ok}/${batch.length} saved`);
  }

  const drafted = new Set(readDrafts(process.cwd(), "news-en-revisions").map((draft) => draft.slug));
  const remaining = targets.filter((n) => !drafted.has(n.slug)).length;
  console.log(`Done. ${remaining} items still need revision drafts. Published content unchanged.`);
}

main();
