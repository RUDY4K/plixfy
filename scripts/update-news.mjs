// يجلب أحدث أخبار الألعاب من مصادر RSS، يختار أهمها ويعيد صياغتها بالعربية
// عبر Claude Haiku، ثم يحدّث src/data/news.json.
// يعمل عبر GitHub Action كل 12 ساعة. يتطلب ANTHROPIC_API_KEY في البيئة.
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const NEWS_FILE = path.join(process.cwd(), "src", "data", "news.json");
const MAX_STORED = 60;
const MAX_NEW_PER_RUN = 4;
const CANDIDATE_WINDOW_HOURS = 36;

const FEEDS = [
  { name: "GameSpot", url: "https://www.gamespot.com/feeds/game-news/" },
  { name: "VG247", url: "https://www.vg247.com/feed/news" },
  { name: "Eurogamer", url: "https://www.eurogamer.net/feed/news" },
  { name: "PC Gamer", url: "https://www.pcgamer.com/rss/" },
];

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

function stripHtml(s) {
  return decodeEntities(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1] : "";
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { "user-agent": "PlixfyNewsBot/1.0 (+https://www.plixfy.com)" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error(`[${feed.name}] HTTP ${res.status} — skipping`);
      return [];
    }
    const xml = await res.text();
    const items = [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/g)].map((m) => m[0]);
    return items
      .map((block) => ({
        source: feed.name,
        title: decodeEntities(extractTag(block, "title")),
        link: decodeEntities(extractTag(block, "link")),
        pubDate: extractTag(block, "pubDate"),
        description: stripHtml(extractTag(block, "description")).slice(0, 1200),
      }))
      .filter((it) => it.title && it.link);
  } catch (err) {
    console.error(`[${feed.name}] fetch failed: ${err.message} — skipping`);
    return [];
  }
}

function loadExisting() {
  try {
    return JSON.parse(fs.readFileSync(NEWS_FILE, "utf8"));
  } catch (err) {
    console.error(`Cannot read ${NEWS_FILE}: ${err.message}`);
    process.exit(1);
  }
}

const NEWS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["slug", "title", "summary", "sourceName", "sourceUrl"],
        properties: {
          slug: { type: "string", description: "kebab-case Latin slug, Arabic transliteration ok" },
          title: { type: "string", description: "عنوان عربي أصلي جذاب" },
          summary: {
            type: "string",
            description: "ملخّص عربي أصلي مُعاد صياغته بالكامل، 100-180 كلمة، ليس ترجمة حرفية",
          },
          sourceName: { type: "string" },
          sourceUrl: { type: "string" },
        },
      },
    },
  },
};

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set");
    process.exit(1);
  }

  const existing = loadExisting();
  const knownUrls = new Set(existing.map((n) => n.sourceUrl));
  const knownSlugs = new Set(existing.map((n) => n.slug));

  const feedResults = await Promise.all(FEEDS.map(fetchFeed));
  const cutoff = Date.now() - CANDIDATE_WINDOW_HOURS * 3600 * 1000;

  const candidates = feedResults
    .flat()
    .filter((it) => {
      const t = Date.parse(it.pubDate);
      return (!Number.isNaN(t) ? t >= cutoff : true) && !knownUrls.has(it.link);
    })
    .slice(0, 40);

  console.log(`Candidates: ${candidates.length}`);
  if (candidates.length === 0) {
    console.log("No new candidates — nothing to do.");
    return;
  }

  const client = new Anthropic();

  const prompt = [
    "أنت محرر أخبار ألعاب فيديو محترف في موقع بليكسفاي العربي (plixfy.com).",
    `أمامك قائمة أخبار إنجليزية حديثة. اختر أهم ${MAX_NEW_PER_RUN} أخبار (الأوسع اهتماماً لجمهور عربي: إصدارات كبرى، قرارات المنصات، ألعاب شهيرة)، واكتب لكل خبر:`,
    "- عنواناً عربياً أصلياً جذاباً (ليس ترجمة حرفية)",
    "- ملخّصاً عربياً أصلياً مُعاد صياغته بالكامل بأسلوبك (100-180 كلمة). ممنوع الترجمة الحرفية — أعد السرد بصياغة جديدة والتزم فقط بالحقائق الواردة في النص. لا تخترع تفاصيل غير مذكورة.",
    "- slug لاتينياً بصيغة kebab-case",
    "تجاهل الأخبار الإعلانية والمحتوى غير المناسب للعائلات. إن لم تجد أخباراً تستحق، أعد قائمة فارغة.",
    "",
    "الأخبار المرشّحة (JSON):",
    JSON.stringify(candidates, null, 1),
  ].join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 8000,
    output_config: { format: { type: "json_schema", schema: NEWS_SCHEMA } },
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal") {
    console.error("Model refused the request — aborting without changes.");
    process.exit(1);
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) {
    console.error("No text block in response — aborting.");
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch (err) {
    console.error(`Model output is not valid JSON: ${err.message}`);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const fresh = (parsed.items || [])
    .filter(
      (it) =>
        it.slug &&
        it.title &&
        it.summary &&
        it.sourceUrl &&
        !knownUrls.has(it.sourceUrl) &&
        !knownSlugs.has(it.slug),
    )
    .slice(0, MAX_NEW_PER_RUN)
    .map((it) => ({
      slug: it.slug,
      title: it.title,
      summary: it.summary,
      sourceName: it.sourceName,
      sourceUrl: it.sourceUrl,
      publishedAt: today,
    }));

  console.log(`New items accepted: ${fresh.length}`);
  if (fresh.length === 0) {
    console.log("Nothing new to write.");
    return;
  }

  const merged = [...fresh, ...existing]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, MAX_STORED);

  fs.writeFileSync(NEWS_FILE, JSON.stringify(merged, null, 2) + "\n", "utf8");
  console.log(`Wrote ${merged.length} items to news.json`);
  for (const it of fresh) console.log(`  + ${it.slug}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
