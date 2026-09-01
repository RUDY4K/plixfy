// يجلب أحدث أخبار الألعاب من مصادر RSS، ثم ينشئ نسختين أصليتين بالعربية والإنجليزية.
// يستخدم Gemini API في GitHub Actions، مع Claude CLI كخيار محلي عند التشغيل اليدوي.
import fs from "node:fs";
import path from "node:path";
import { runClaude, extractJson } from "./claude-cli.mjs";
import { runGeminiJson } from "./gemini-content-client.mjs";
import {
  findRepairableMojibake,
  repairObjectStrings,
  repairUtf8Mojibake,
} from "./text-encoding.mjs";

const NEWS_FILE = path.join(process.cwd(), "src", "data", "news.json");
const MAX_STORED = 60;
const MAX_NEW_PER_RUN = 4;
const CANDIDATE_WINDOW_HOURS = 36;

const FEEDS = [
  { name: "GameSpot", url: "https://www.gamespot.com/feeds/game-news/" },
  { name: "VG247", url: "https://www.vg247.com/feed/news" },
  { name: "Eurogamer", url: "https://www.eurogamer.net/feed/news" },
  { name: "PC Gamer", url: "https://www.pcgamer.com/rss/" },
  { name: "PlayStation Blog", url: "https://blog.playstation.com/feed/" },
  { name: "Xbox Wire", url: "https://news.xbox.com/en-us/feed/" },
  { name: "Gematsu", url: "https://www.gematsu.com/feed" },
  { name: "VGC", url: "https://www.videogameschronicle.com/feed/" },
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

function asHttpsImage(value, baseUrl) {
  if (!value) return "";
  try {
    const url = new URL(decodeEntities(value), baseUrl);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function extractFeedImage(block, articleUrl) {
  const patterns = [
    /<media:content\b[^>]*\burl=["']([^"']+)["'][^>]*>/i,
    /<media:thumbnail\b[^>]*\burl=["']([^"']+)["'][^>]*>/i,
    /<enclosure\b(?=[^>]*\btype=["']image\/)[^>]*\burl=["']([^"']+)["'][^>]*>/i,
    /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const found = block.match(pattern)?.[1];
    const image = asHttpsImage(found, articleUrl);
    if (image) return image;
  }
  const channelImage = extractTag(extractTag(block, "image"), "url");
  return asHttpsImage(channelImage, articleUrl);
}

function extractMetaImage(html, articleUrl) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (!/(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["']/i.test(tag)) continue;
    const content = tag.match(/\bcontent=["']([^"']+)["']/i)?.[1];
    const image = asHttpsImage(content, articleUrl);
    if (image) return image;
  }
  return "";
}

async function fetchMetadataServiceImage(articleUrl) {
  try {
    const metadataUrl = new URL("https://api.microlink.io");
    metadataUrl.searchParams.set("url", articleUrl);
    const response = await fetch(metadataUrl, {
      headers: { "user-agent": "PlixfyNewsBot/2.0 (+https://www.plixfy.com)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return "";
    const payload = await response.json();
    return asHttpsImage(payload?.data?.image?.url, articleUrl);
  } catch {
    return "";
  }
}

async function fetchArticleImage(articleUrl) {
  try {
    const response = await fetch(articleUrl, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; PlixfyNewsBot/2.0; +https://www.plixfy.com)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (response.ok) {
      const image = extractMetaImage(await response.text(), response.url || articleUrl);
      if (image) return image;
    }
  } catch {
    // Some publishers block automated article requests. The metadata service
    // below is the deterministic fallback used by the news pipeline.
  }
  return fetchMetadataServiceImage(articleUrl);
}

async function backfillMissingImages(items, limit = 12) {
  const targets = items.filter((item) => item?.sourceUrl && !item.image).slice(0, limit);
  const images = await Promise.all(targets.map((item) => fetchArticleImage(item.sourceUrl)));
  let updated = 0;
  targets.forEach((item, index) => {
    if (images[index]) {
      item.image = images[index];
      updated += 1;
    }
  });
  return updated;
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
      .map((block) => {
        const link = decodeEntities(extractTag(block, "link"));
        return {
          source: feed.name,
          title: decodeEntities(extractTag(block, "title")),
          link,
          pubDate: extractTag(block, "pubDate"),
          description: stripHtml(extractTag(block, "description")).slice(0, 1200),
          image: extractFeedImage(block, link),
        };
      })
      .filter((it) => it.title && it.link);
  } catch (err) {
    console.error(`[${feed.name}] fetch failed: ${err.message} — skipping`);
    return [];
  }
}

function loadExisting() {
  try {
    const original = JSON.parse(fs.readFileSync(NEWS_FILE, "utf8"));
    const repairable = findRepairableMojibake(original);
    return {
      items: repairObjectStrings(original),
      encodingWasRepaired: repairable.length > 0,
    };
  } catch (err) {
    console.error(`Cannot read ${NEWS_FILE}: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  const { items: existing, encodingWasRepaired } = loadExisting();
  const imagesOnly = process.argv.includes("--images-only");
  const backfilledImages = await backfillMissingImages(existing, imagesOnly ? MAX_STORED : 12);
  if (imagesOnly) {
    fs.writeFileSync(NEWS_FILE, JSON.stringify(existing, null, 2) + "\n", "utf8");
    console.log(`Added source images to ${backfilledImages} existing news items.`);
    return;
  }
  const knownUrls = new Set(existing.map((n) => n.sourceUrl));
  const knownSlugs = new Set(existing.map((n) => n.slug));

  const feedResults = await Promise.all(FEEDS.map(fetchFeed));
  const cutoff = Date.now() - CANDIDATE_WINDOW_HOURS * 3600 * 1000;

  const candidateStubs = feedResults
    .flat()
    .filter((it) => {
      const t = Date.parse(it.pubDate);
      return (!Number.isNaN(t) ? t >= cutoff : true) && !knownUrls.has(it.link);
    })
    .sort((a, b) => (Date.parse(b.pubDate) || 0) - (Date.parse(a.pubDate) || 0))
    .slice(0, 40);
  const candidates = (await Promise.all(
    candidateStubs.map(async (item) => ({
      ...item,
      image: item.image || (await fetchArticleImage(item.link)),
    })),
  )).filter((item) => Boolean(item.image));

  console.log(`Candidates: ${candidates.length}`);
  if (candidates.length === 0) {
    if (encodingWasRepaired || backfilledImages > 0) {
      fs.writeFileSync(NEWS_FILE, JSON.stringify(existing, null, 2) + "\n", "utf8");
      console.log("Repaired existing news encoding.");
    }
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
    if (process.env.GEMINI_API_KEY) {
      parsed = await runGeminiJson({
        prompt,
        system:
          "You are a careful bilingual gaming-news editor. Use only supplied candidates, never invent facts, and return valid JSON only.",
        maxTokens: 5_500,
        validate: (value) => {
          if (!value || !Array.isArray(value.items)) {
            throw new Error("Gemini news response must contain an items array");
          }
        },
      });
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
        title: repairUtf8Mojibake(it.title.trim()),
        summary: repairUtf8Mojibake(it.summary.trim()),
        titleEn: repairUtf8Mojibake(it.titleEn.trim()),
        summaryEn: repairUtf8Mojibake(it.summaryEn.trim()),
        sourceName: candidate.source,
        sourceUrl: candidate.link,
        image: candidate.image,
        sourcePublishedAt: Number.isNaN(Date.parse(candidate.pubDate))
          ? new Date().toISOString()
          : new Date(candidate.pubDate).toISOString(),
        publishedAt: today,
      };
    });

  console.log(`New items accepted: ${fresh.length}`);
  if (fresh.length === 0) {
    if (encodingWasRepaired || backfilledImages > 0) {
      fs.writeFileSync(NEWS_FILE, JSON.stringify(existing, null, 2) + "\n", "utf8");
      console.log("Repaired existing news encoding.");
    }
    console.log("Nothing new to write.");
    return;
  }

  const merged = [...fresh, ...existing]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, MAX_STORED);

  const invalidEncoding = findRepairableMojibake(merged);
  if (invalidEncoding.length > 0) {
    throw new Error(`Refusing to publish mojibake: ${invalidEncoding.slice(0, 5).join(", ")}`);
  }

  fs.writeFileSync(NEWS_FILE, JSON.stringify(merged, null, 2) + "\n", "utf8");
  console.log(`Wrote ${merged.length} items to news.json`);
  for (const it of fresh) console.log(`  + ${it.slug}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
