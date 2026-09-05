// Prepare English blog revision drafts; never overwrite live blogEn.ts.
import fs from "node:fs";
import { readDrafts, saveDrafts, contentHash } from "./content-draft-store.mjs";
import path from "node:path";
import { runClaude, extractJson } from "./claude-cli.mjs";

const BATCH = 2;

const OUT_FILE = path.join("src", "lib", "blogEn.ts");

// نفس الـ 15 موضوعاً والتصنيفات الموجودة في src/lib/blog.ts — arH1 للسياق فقط.
const TOPICS = [
  { slug: "afdal-alaab-sibaq-online-2026", categorySlug: "racing", arH1: "أفضل ألعاب السباق المجانية أونلاين لعام 2026", topic: "best free online racing games (cars, motorbikes) for 2026" },
  { slug: "afdal-alaab-banat-bidon-tahmil", categorySlug: "girls", arH1: "أفضل ألعاب البنات المجانية بدون تحميل", topic: "best free girls games with no download (fashion, cooking, makeup, dress-up)" },
  { slug: "afdal-alaab-io-maa-alasdiqaa", categorySlug: "io", arH1: "أفضل ألعاب آيو (.io) للعب مع الأصدقاء", topic: "best .io multiplayer games to play with friends" },
  { slug: "afdal-alaab-action-online-2026", categorySlug: "action", arH1: "أفضل ألعاب الأكشن والقتال المجانية أونلاين", topic: "best free online action and fighting games for 2026" },
  { slug: "afdal-alaab-alghaz-online-2026", categorySlug: "puzzle", arH1: "أفضل ألعاب الألغاز والذكاء المجانية أونلاين", topic: "best free online puzzle and brain games for 2026" },
  { slug: "afdal-alaab-riyada-online-2026", categorySlug: "sports", arH1: "أفضل ألعاب الرياضة المجانية أونلاين", topic: "best free online sports games (football, basketball, tennis) for 2026" },
  { slug: "afdal-alaab-tasweeb-online-2026", categorySlug: "shooting", arH1: "أفضل ألعاب التصويب والرماية المجانية أونلاين", topic: "best free online shooting games for 2026" },
  { slug: "afdal-alaab-khafifa-online-2026", categorySlug: "casual", arH1: "أفضل الألعاب الخفيفة والمسلية المجانية أونلاين", topic: "best free casual, quick-fun online games for 2026" },
  { slug: "alaab-online-bidon-tahmil-dalil-2026", categorySlug: "casual", arH1: "ألعاب أونلاين مجانية بدون تحميل: الدليل الشامل لعام 2026", topic: "comprehensive 2026 guide to free online games with no download at all" },
  { slug: "afdal-alaab-atfal-online-amina", categorySlug: "puzzle", arH1: "أفضل ألعاب الأطفال المجانية والآمنة أونلاين", topic: "best free and safe online games for kids" },
  { slug: "afdal-alaab-sayarat-online-2026", categorySlug: "racing", arH1: "أفضل ألعاب السيارات المجانية أونلاين لعام 2026", topic: "best free online car games for 2026" },
  { slug: "afdal-alaab-harb-online-2026", categorySlug: "shooting", arH1: "أفضل ألعاب الحرب والمعارك المجانية أونلاين", topic: "best free online war and battle games" },
  { slug: "afdal-alaab-kurat-qadam-online-2026", categorySlug: "sports", arH1: "أفضل ألعاب كرة القدم المجانية أونلاين بدون تحميل", topic: "best free online soccer/football games with no download" },
  { slug: "afdal-alaab-thaka-wa-tafkir-2026", categorySlug: "puzzle", arH1: "أفضل ألعاب الذكاء والتفكير المجانية أونلاين", topic: "best free online brain and logic/thinking games for 2026" },
  { slug: "afdal-alaab-tabkh-online-2026", categorySlug: "girls", arH1: "أفضل ألعاب الطبخ والمطاعم المجانية أونلاين", topic: "best free online cooking and restaurant management games" },
];

function buildPrompt(batch) {
  const block = batch
    .map(
      (t, i) =>
        `${i + 1}. slug: "${t.slug}"\n   topic: ${t.topic}\n   category: ${t.categorySlug}`,
    )
    .join("\n\n");

  return `You are writing an original long-form English SEO blog article for Plixfy (plixfy.com), a free browser-games site (no download, no sign-up, works on mobile and desktop). Do NOT translate anything — write fresh, natural, helpful English content for each topic below.

For EACH topic, write a JSON object with:
- "title": SEO title tag, 50-60 chars, include "Free" and "Online", end with "| Plixfy"
- "h1": on-page H1, 40-70 chars, natural phrasing
- "description": meta description, 140-160 chars
- "keywords": array of 5 short SEO keyword phrases
- "intro": 1 paragraph, 60-90 words, hooks the reader and introduces the topic
- "sections": array of exactly 3 objects, each {"heading": "...", "paragraphs": [2-3 paragraphs of 40-70 words each]} — cover: why play in-browser, the types/variety within this game category, and tips to get better
- "faq": array of exactly 3 objects {"q": "...", "a": "..."} — practical questions (free? works on mobile? need download/signup?) with concise answers

Topics:

${block}

Return ONLY a JSON object mapping each slug to its content object:
{"<slug>": {"title": "...", "h1": "...", "description": "...", "keywords": [...], "intro": "...", "sections": [...], "faq": [...]}}`;
}

function main() {
  const original = fs.readFileSync(OUT_FILE, "utf8");
  const pending = new Set(readDrafts(process.cwd(), "blog-en-revisions").map((draft) => draft.slug));
  const targets = TOPICS.filter((t) => !pending.has(t.slug));
  console.log(`${targets.length}/${TOPICS.length} remaining to generate.`);

  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    console.log(`Batch ${Math.floor(i / BATCH) + 1}: ${batch.map((t) => t.slug).join(", ")}`);
    const raw = runClaude({
      prompt: buildPrompt(batch),
      model: "sonnet",
      timeoutMs: 20 * 60 * 1000,
    });
    const json = extractJson(raw);

    const drafts = [];
    let ok = 0;
    for (const t of batch) {
      const c = json[t.slug];
      if (
        c &&
        typeof c.title === "string" &&
        typeof c.h1 === "string" &&
        typeof c.description === "string" &&
        Array.isArray(c.keywords) &&
        typeof c.intro === "string" &&
        Array.isArray(c.sections) &&
        c.sections.length === 3 &&
        Array.isArray(c.faq)
      ) {
        drafts.push({ content: { ...c, slug: t.slug }, baseHash: contentHash(original),
          evidence: { generator: "claude-cli", topic: t, originalFile: "src/lib/blogEn.ts", limitation: "Topic-only draft; claims require verification" } });
        ok++;
      } else {
        console.warn(`  ! missing/invalid content for ${t.slug} — will retry on next run`);
      }
    }
    saveDrafts(process.cwd(), "blog-en-revisions", drafts, { revision: true });
    console.log(`Saved ${ok} revision drafts; live English blog unchanged.`);
  }

  console.log("Done. Review drafts in content-drafts/blog-en-revisions.json before any publication.");
}

main();
