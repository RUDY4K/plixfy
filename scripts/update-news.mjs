// يجلب أحدث أخبار الألعاب من مصادر RSS، يختار أهمها ويعيد صياغتها بالعربية
// عبر Claude Code CLI (اشتراك محلي، بدون API)، ثم يحدّث src/data/news.json.
// يعمل عبر Task Scheduler على جهاز المستخدم كل 12 ساعة (scripts/news-cron.cmd).
import fs from "node:fs";
import path from "node:path";
import { runClaude, extractJson } from "./claude-cli.mjs";
import { runCopilotContent, extractJsonObject } from "./copilot-content-client.mjs";

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

async function main() {
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

  const promptCandidates = candidates.map((item, candidateIndex) => ({
    candidateIndex,
    source: item.source,
    title: item.title,
    link: item.link,
    pubDate: item.pubDate,
    description: item.description,
  }));

  const prompt = [
    "أنت محرر أخبار ألعاب فيديو محترف يكتب بالعربية والإنجليزية لموقع بليكسفاي (plixfy.com).",
    `أمامك قائمة أخبار إنجليزية حديثة. اختر أهم ${MAX_NEW_PER_RUN} أخبار (الأوسع اهتماماً: إصدارات كبرى، قرارات المنصات، ألعاب شهيرة)، واكتب لكل خبر نسختين مستقلتين مبنيتين على نفس الوقائع من النص المصدر (وليس ترجمة إحداهما عن الأخرى):`,
    "- عنواناً عربياً أصلياً جذاباً (ليس ترجمة حرفية)",
    "- ملخّصاً عربياً أصلياً مُعاد صياغته بالكامل بأسلوبك (100-180 كلمة). ممنوع الترجمة الحرفية — أعد السرد بصياغة جديدة والتزم فقط بالحقائق الواردة في النص. لا تخترع تفاصيل غير مذكورة.",
    "- عنواناً إنجليزياً أصلياً (titleEn) — مو ترجمة للعنوان العربي، اكتبه مباشرة من النص المصدر بأسلوبك.",
    "- ملخّصاً إنجليزياً أصلياً (summaryEn) بنفس طول الملخص العربي تقريباً (100-180 كلمة) — مبني على النص المصدر مباشرة، وليس ترجمة للملخص العربي.",
    "- slug لاتينياً بصيغة kebab-case",
    "تجاهل الأخبار الإعلانية والمحتوى غير المناسب للعائلات. إن لم تجد أخباراً تستحق، أعد قائمة فارغة.",
    "",
    "مهم: هذه عناوين الأخبار المنشورة لدينا مسبقاً — تجاهل أي خبر مرشّح يغطي نفس القصة حتى لو كان من مصدر مختلف:",
    existing.slice(0, 20).map((n) => "- " + n.title).join("\n"),
    "",
    "الأخبار المرشّحة (JSON):",
    JSON.stringify(promptCandidates, null, 1),
    "",
    'أخرج JSON خاماً فقط — بدون أي تعليق أو سياج أكواد — بهذه البنية بالضبط:',
    '{"items":[{"candidateIndex":0,"slug":"kebab-case-latin","title":"عنوان عربي","summary":"ملخص عربي 100-180 كلمة","titleEn":"English title","summaryEn":"English summary 100-180 words"}]}',
  ].join("\n");

  let parsed;
  try {
    if (process.env.GITHUB_TOKEN) {
      const raw = runCopilotContent({
        prompt,
        system:
          "You are a careful bilingual gaming-news editor. Use only supplied candidates, never invent facts, and return valid JSON only.",
      });
      parsed = extractJsonObject(raw);
    } else {
      parsed = extractJson(runClaude({ prompt }));
    }
  } catch (err) {
    console.error(`News generation failed: ${err.message}`);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const fresh = (parsed.items || [])
    .filter((it) => {
      const candidate = candidates[it.candidateIndex];
      return (
        Number.isInteger(it.candidateIndex) &&
        candidate &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(it.slug || "") &&
        typeof it.title === "string" &&
        typeof it.summary === "string" &&
        typeof it.titleEn === "string" &&
        typeof it.summaryEn === "string" &&
        it.title.length >= 20 &&
        it.summary.length >= 180 &&
        it.titleEn.length >= 20 &&
        it.summaryEn.length >= 180 &&
        !knownUrls.has(candidate.link) &&
        !knownSlugs.has(it.slug)
      );
    })
    .slice(0, MAX_NEW_PER_RUN)
    .map((it) => {
      const candidate = candidates[it.candidateIndex];
      return {
        slug: it.slug,
        title: it.title.trim(),
        summary: it.summary.trim(),
        titleEn: it.titleEn.trim(),
        summaryEn: it.summaryEn.trim(),
        sourceName: candidate.source,
        sourceUrl: candidate.link,
        publishedAt: today,
      };
    });

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
