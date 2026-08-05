// Publishes one validated bilingual evergreen article from a fixed editorial queue.
// Usage: GITHUB_TOKEN=... node scripts/update-blog.mjs [--dry-run]
import fs from "node:fs";
import path from "node:path";
import { runCopilotContent, extractJsonObject } from "./copilot-content-client.mjs";

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, "src", "data", "blog-generated.json");
const STATIC_BLOG_FILE = path.join(ROOT, "src", "lib", "blog.ts");
const DRY_RUN = process.argv.includes("--dry-run");

const CATEGORY_AR = {
  racing: "ألعاب السباق",
  action: "ألعاب الأكشن",
  puzzle: "ألعاب الألغاز",
  io: "ألعاب آيو",
  girls: "ألعاب البنات",
  casual: "الألعاب الخفيفة",
  sports: "الألعاب الرياضية",
  shooting: "ألعاب التصويب",
};

const TOPICS = [
  {
    slug: "alaab-browser-lil-jawal-bidon-tahmil-2026",
    category: "casual",
    ar: "دليل ألعاب المتصفح المجانية المناسبة للجوال بدون تحميل",
    en: "A practical guide to free mobile browser games with no download",
  },
  {
    slug: "afdal-alaab-multiplayer-maa-alasdiqaa-2026",
    category: "io",
    ar: "أفضل أنواع ألعاب المتصفح الجماعية للعب مع الأصدقاء",
    en: "The best kinds of multiplayer browser games to play with friends",
  },
  {
    slug: "alaab-qasira-lil-istiraha-2026",
    category: "casual",
    ar: "ألعاب متصفح قصيرة وممتعة تناسب وقت الاستراحة",
    en: "Quick browser games that fit into a short break",
  },
  {
    slug: "kayf-takhtar-laabat-browser-munasiba-2026",
    category: "puzzle",
    ar: "كيف تختار لعبة متصفح تناسب وقتك وجهازك ومستوى التحدي",
    en: "How to choose a browser game for your time, device, and skill level",
  },
  {
    slug: "alaab-sibaq-jawal-w-computer-2026",
    category: "racing",
    ar: "كيف تختلف ألعاب السباق على الجوال والكمبيوتر ونصائح التحكم",
    en: "How racing games differ on mobile and desktop, with control tips",
  },
  {
    slug: "dalil-alaab-hidden-object-online-2026",
    category: "puzzle",
    ar: "دليل ألعاب البحث عن الأشياء المخفية وأفضل طرق حلها",
    en: "A guide to hidden-object browser games and how to solve them",
  },
  {
    slug: "alaab-action-browser-nasaeh-2026",
    category: "action",
    ar: "نصائح عملية للتفوق في ألعاب الأكشن من المتصفح",
    en: "Practical ways to improve at browser action games",
  },
  {
    slug: "alaab-kurat-qadam-penalty-browser-2026",
    category: "sports",
    ar: "دليل ألعاب كرة القدم وركلات الجزاء المجانية من المتصفح",
    en: "A guide to free browser football and penalty games",
  },
  {
    slug: "alaab-tasweeb-browser-lilmubtadieen-2026",
    category: "shooting",
    ar: "دليل المبتدئين لألعاب التصويب المجانية من المتصفح",
    en: "A beginner guide to free browser shooting games",
  },
  {
    slug: "alaab-fashion-design-online-2026",
    category: "girls",
    ar: "ألعاب الأزياء والتصميم أونلاين وكيف تستفيد من خياراتها الإبداعية",
    en: "Online fashion and design games and how to use their creative tools",
  },
  {
    slug: "alaab-browser-low-end-devices-2026",
    category: "casual",
    ar: "كيفية اختيار ألعاب متصفح تعمل جيدًا على الأجهزة المتوسطة",
    en: "How to choose browser games that run well on modest devices",
  },
  {
    slug: "alaab-alghaz-tadrib-almukh-2026",
    category: "puzzle",
    ar: "أنواع ألعاب الألغاز التي تدرب الملاحظة والمنطق والذاكرة",
    en: "Puzzle game types that exercise observation, logic, and memory",
  },
];

function readJson(file, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function todayInRiyadh() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function loadGames(category) {
  return ["gd-games.json", "gm-games.json"]
    .flatMap((name) => readJson(path.join(ROOT, "src", "data", name)))
    .filter((game) => game?.categorySlug === category && game?.slug && game?.title)
    .sort((a, b) => {
      const rank = { top: 0, hot: 1, new: 2 };
      return (rank[a.badge] ?? 3) - (rank[b.badge] ?? 3) || a.slug.localeCompare(b.slug);
    })
    .slice(0, 10)
    .map((game) => ({
      title: game.title,
      slug: game.slug,
      description: String(game.description || "").replace(/\s+/g, " ").trim().slice(0, 320),
    }));
}

function localizedWordCount(content) {
  return [
    content.intro,
    ...content.sections.flatMap((section) => [section.heading, ...section.paragraphs]),
    ...content.faq.flatMap((item) => [item.q, item.a]),
  ]
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function validateLocalized(content, language) {
  if (!content || typeof content !== "object") throw new Error(`Missing ${language} content`);
  for (const key of ["title", "h1", "description", "intro"]) {
    if (typeof content[key] !== "string" || content[key].trim().length < 20) {
      throw new Error(`Invalid ${language}.${key}`);
    }
  }
  if (!Array.isArray(content.keywords) || content.keywords.length !== 5) {
    throw new Error(`${language}.keywords must contain exactly 5 items`);
  }
  if (!Array.isArray(content.sections) || content.sections.length !== 3) {
    throw new Error(`${language}.sections must contain exactly 3 sections`);
  }
  for (const section of content.sections) {
    if (typeof section.heading !== "string" || !Array.isArray(section.paragraphs) || section.paragraphs.length < 2) {
      throw new Error(`Invalid ${language} section`);
    }
  }
  if (!Array.isArray(content.faq) || content.faq.length !== 3) {
    throw new Error(`${language}.faq must contain exactly 3 items`);
  }
  for (const item of content.faq) {
    if (typeof item.q !== "string" || typeof item.a !== "string") throw new Error(`Invalid ${language} FAQ`);
  }
  if (localizedWordCount(content) < 320) throw new Error(`${language} article is too short`);
  if (/https?:\/\//i.test(JSON.stringify(content))) throw new Error(`${language} content contains an unsupported URL`);
  if (language === "ar" && !/[\u0600-\u06ff]/.test(content.h1)) throw new Error("Arabic article is not Arabic");
}

function validateRecord(record, topic) {
  if (record.slug !== topic.slug) throw new Error("The model changed the required slug");
  if (record.relatedCategory !== topic.category) throw new Error("The model changed the required category");
  validateLocalized(record.ar, "ar");
  validateLocalized(record.en, "en");
}

async function main() {
  const generated = readJson(OUT_FILE);
  const staticSource = fs.readFileSync(STATIC_BLOG_FILE, "utf8");
  const existingSlugs = new Set([
    ...generated.map((post) => post.slug),
    ...[...staticSource.matchAll(/\bslug:\s*"([^"]+)"/g)].map((match) => match[1]),
  ]);
  const topic = TOPICS.find((candidate) => !existingSlugs.has(candidate.slug));
  if (!topic) {
    console.log("Editorial queue is complete; no blog post is due.");
    return;
  }

  const games = loadGames(topic.category);
  if (games.length < 4) throw new Error(`Not enough ${topic.category} games for a grounded article`);
  const date = todayInRiyadh();
  const prompt = `Write one original, useful, bilingual evergreen article for Plixfy, a free browser-games site. Ground game examples only in the supplied catalogue. Do not invent features, statistics, accounts, scores, safety certifications, or external facts.

Required slug: ${topic.slug}
Required category: ${topic.category}
Arabic topic: ${topic.ar}
English topic: ${topic.en}
Catalogue examples: ${JSON.stringify(games)}

Return JSON only with this exact structure:
{
  "slug":"${topic.slug}",
  "relatedCategory":"${topic.category}",
  "ar":{"title":"SEO title ending with | بليكسفاي","h1":"...","description":"140-165 characters","keywords":["five","short","phrases","only","here"],"intro":"80-120 words","sections":[{"heading":"...","paragraphs":["70-100 words","70-100 words"]},{"heading":"...","paragraphs":["70-100 words","70-100 words"]},{"heading":"...","paragraphs":["70-100 words","70-100 words"]}],"faq":[{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}]},
  "en":{"title":"SEO title ending with | Plixfy","h1":"...","description":"140-165 characters","keywords":["five","short","phrases","only","here"],"intro":"80-120 words","sections":[{"heading":"...","paragraphs":["70-100 words","70-100 words"]},{"heading":"...","paragraphs":["70-100 words","70-100 words"]},{"heading":"...","paragraphs":["70-100 words","70-100 words"]}],"faq":[{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}]}
}

Write Arabic naturally for Gulf readers and write the English version independently, not as a literal translation. Mention Plixfy sparingly. Do not add URLs; the site adds internal game links separately.`;

  const raw = runCopilotContent({
    prompt,
    system: "You are a meticulous bilingual gaming editor. Return valid JSON only and stay grounded in supplied catalogue data.",
    timeoutMs: 300_000,
  });
  const record = extractJsonObject(raw);
  validateRecord(record, topic);

  const finalRecord = {
    slug: topic.slug,
    publishedAt: date,
    updatedAt: date,
    relatedCategory: topic.category,
    relatedCategoryTitle: CATEGORY_AR[topic.category],
    ar: record.ar,
    en: record.en,
  };

  if (DRY_RUN) {
    console.log(`Dry run validated ${topic.slug}; no file was changed.`);
    return;
  }

  const next = [finalRecord, ...generated].slice(0, 24);
  fs.writeFileSync(OUT_FILE, JSON.stringify(next, null, 2) + "\n", "utf8");
  console.log(`Published bilingual blog post ${topic.slug}.`);
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
