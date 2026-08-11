// Local, deterministic social agents for GitHub Actions.
// Usage: node scripts/cloud-social-runner.mjs [--slot=morning|evening|auto] [--dry-run] [--force]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  ContentScoutAgent,
  EditorialAgent,
  PublicationAuditAgent,
} from "./social-agents.mjs";

const ROOT = process.cwd();
const SOCIAL_DIR = path.join(ROOT, ".social");
const CLOUD_STATE_FILE = path.join(SOCIAL_DIR, "cloud-state.json");
const SITE = "https://www.plixfy.com";

const CATEGORY_AR = {
  racing: "سباق",
  action: "أكشن",
  puzzle: "ألغاز",
  io: "ألعاب .io",
  girls: "تلبيس وتصميم",
  casual: "ألعاب خفيفة",
  sports: "رياضة",
  shooting: "تصويب",
};

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n");
  fs.renameSync(temporary, file);
}

function riyadhParts(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
  };
}

function parseArgs() {
  const value = process.argv.find((arg) => arg.startsWith("--slot="))?.split("=")[1] || "auto";
  if (!["auto", "morning", "evening"].includes(value)) {
    throw new Error("--slot must be morning, evening, or auto");
  }
  const { date, hour } = riyadhParts();
  return {
    date,
    slot: value === "auto" ? (hour < 15 ? "morning" : "evening") : value,
    dryRun: process.argv.includes("--dry-run"),
    force: process.argv.includes("--force"),
  };
}

function cleanContentId(value) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 72);
}

function truncate(text, max) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

function socialCardUrl(kind, id) {
  const url = new URL("/api/social-card", SITE);
  url.searchParams.set("kind", kind);
  url.searchParams.set("id", id);
  url.searchParams.set("v", "4");
  return url.toString();
}

function loadGames() {
  return ["gd-games.json", "gm-games.json"]
    .flatMap((name) => readJson(path.join(ROOT, "src", "data", name), []))
    .filter((game) => game?.slug && game?.title && game?.thumbnail)
    .map((game) => ({
      slug: game.slug,
      title: game.title,
      thumbnail: game.thumbnail,
      category: game.category || CATEGORY_AR[game.categorySlug] || "ألعاب",
      categorySlug: game.categorySlug || "casual",
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function loadNews(referenceDate) {
  const referenceTime = Date.parse(`${referenceDate}T23:59:59Z`);
  const cutoffTime = referenceTime - 7 * 24 * 60 * 60 * 1000;
  return readJson(path.join(ROOT, "src", "data", "news.json"), [])
    .filter((item) => item?.slug && item?.title && item?.summary && item?.publishedAt)
    .filter((item) => {
      const publishedTime = Date.parse(`${item.publishedAt}T00:00:00Z`);
      return Number.isFinite(publishedTime) && publishedTime >= cutoffTime && publishedTime <= referenceTime;
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function gamePack(game, date, slot) {
  const title = truncate(game.title, 70);
  const category = CATEGORY_AR[game.categorySlug] || game.category || "ألعاب";
  const url = `${SITE}/ar/play/${encodeURIComponent(game.slug)}`;
  const contentId = cleanContentId(`game-${game.slug}`);
  const image = socialCardUrl("game", game.slug);
  return {
    date,
    campaign: "ar_growth_cloud",
    slot,
    source: { kind: "game", id: game.slug },
    items: [
      { platform: "telegram", kind: "game", contentId, text: `🎮 لعبة اليوم: ${title}\n\nتبي تحديًا سريعًا من المتصفح؟ جرّبها مجانًا بدون تحميل أو تسجيل. التصنيف: ${category}. شاركنا نتيجتك!`, url, image },
      { platform: "discord", kind: "game", contentId, title: `🎮 لعبة اليوم: ${title}`, text: `جاهز لتحدٍ سريع؟ جرّب ${title} مجانًا من المتصفح، بدون تحميل أو تسجيل، ثم شاركنا نتيجتك في الديسكورد.`, url, image },
      { platform: "x", kind: "game", contentId, text: `🎮 جرّب ${truncate(title, 55)} مجانًا من المتصفح، بدون تحميل أو تسجيل. كم نتيجة تقدر تحقق؟ 👇\n#ألعاب #Plixfy`, url, image },
      { platform: "facebook", kind: "game", contentId, text: `🎮 اختيارنا اليوم هو ${title}. لعبة ${category} تعمل مباشرة من المتصفح مجانًا، بدون تحميل أو إنشاء حساب. جرّبها وقل لنا: وصلت لأي نتيجة؟`, url, image },
      { platform: "instagram", kind: "game", contentId, text: `🎮 تحدي اليوم: ${title}\n\nالعبها مجانًا من المتصفح وشاركنا نتيجتك. الرابط في Plixfy.\n\n#ألعاب #ألعاب_مجانية #ألعاب_متصفح #Plixfy`, url, image },
      { platform: "tiktok", kind: "game", contentId, title: `تحدي ${title}`, text: `🎮 تحدي اليوم: ${title}\n\nالعبها مجانًا من المتصفح وشاركنا نتيجتك. الرابط في Plixfy.\n\n#ألعاب #ألعاب_مجانية #Gaming #Plixfy`, url, image },
    ],
  };
}

function newsPack(news, date, slot) {
  const title = truncate(news.title, 110);
  const summary = truncate(news.summary, 260);
  const url = `${SITE}/ar/news/${encodeURIComponent(news.slug)}`;
  const contentId = cleanContentId(`news-${news.slug}`);
  const image = socialCardUrl("news", news.slug);
  return {
    date,
    campaign: "ar_growth_cloud",
    slot,
    source: { kind: "news", id: news.slug },
    items: [
      { platform: "telegram", kind: "news", contentId, text: `📰 ${title}\n\n${summary}\n\nاقرأ التفاصيل على Plixfy:`, url, image },
      { platform: "discord", kind: "news", contentId, title: `📰 ${title}`, text: `${truncate(summary, 420)}\n\nناقش الخبر معنا ثم اقرأ التفاصيل الكاملة على Plixfy.`, url, image },
      { platform: "x", kind: "news", contentId, text: `📰 ${truncate(title, 145)}\n\nالتفاصيل على Plixfy 👇\n#أخبار_الألعاب`, url, image },
      { platform: "facebook", kind: "news", contentId, text: `📰 ${title}\n\n${summary}\n\nما رأيكم بالخبر؟ اقرأوا التفاصيل الكاملة على Plixfy.`, url, image },
      { platform: "instagram", kind: "news", contentId, text: `📰 ${title}\n\n${truncate(summary, 180)}\n\nالتفاصيل على Plixfy.\n\n#أخبار_الألعاب #GamingNews #Plixfy`, url, image },
      { platform: "tiktok", kind: "news", contentId, title: truncate(title, 80), text: `📰 ${truncate(title, 115)}\n\nأبرز التفاصيل على Plixfy. ما رأيك بالخبر؟\n\n#أخبار_الألعاب #GamingNews #Plixfy`, url, image },
    ],
  };
}

function updateCloudState(state, pack, audit) {
  const now = new Date().toISOString();
  const runKey = `${pack.date}:${pack.slot}`;
  const next = {
    recentGames: state.recentGames || [],
    recentNews: state.recentNews || [],
    runs: state.runs || {},
  };
  if (pack.source.kind === "game") {
    next.recentGames = [pack.source.id, ...next.recentGames.filter((id) => id !== pack.source.id)].slice(0, 30);
  } else {
    next.recentNews = [pack.source.id, ...next.recentNews.filter((id) => id !== pack.source.id)].slice(0, 30);
  }
  next.runs[runKey] = { status: "delivered", source: pack.source, counts: audit.counts, completedAt: now };
  next.runs = Object.fromEntries(Object.entries(next.runs).slice(-90));
  return next;
}

async function verifyPublicUrl(url) {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(12_000),
        headers: { "user-agent": "PlixfyCloudSocial/2.0" },
      });
      lastStatus = response.status;
      if (response.ok) return;
    } catch {
      lastStatus = 0;
    }
  }
  throw new Error(`Selected content URL is unavailable (HTTP ${lastStatus || "network error"}): ${url}`);
}

async function main() {
  const args = parseArgs();
  const state = readJson(CLOUD_STATE_FILE, { recentGames: [], recentNews: [], runs: {} });
  const runKey = `${args.date}:${args.slot}`;
  if (!args.dryRun && !args.force && state.runs?.[runKey]?.status === "delivered") {
    console.log(`Run ${runKey} is already complete; nothing to do.`);
    return;
  }

  const selection = new ContentScoutAgent().select({
    slot: args.slot,
    games: loadGames(),
    newsItems: loadNews(args.date),
    recentGames: state.recentGames || [],
    recentNews: state.recentNews || [],
    seed: runKey,
  });
  console.log(`[ScoutAgent] selected ${selection.kind}/${selection.item.slug}`);

  const rawPack = selection.kind === "news"
    ? newsPack(selection.item, args.date, args.slot)
    : gamePack(selection.item, args.date, args.slot);
  const pack = new EditorialAgent().review(rawPack);
  console.log(`[EditorAgent] approved ${pack.items.length} platform drafts`);

  await verifyPublicUrl(pack.items[0].url);
  fs.mkdirSync(SOCIAL_DIR, { recursive: true });
  const packFile = path.join(SOCIAL_DIR, `${args.date}-${args.slot}.json`);
  const reportFile = path.join(SOCIAL_DIR, `${args.date}-${args.slot}-delivery.json`);
  writeJson(packFile, pack);

  const publisherArgs = [path.join(ROOT, "scripts", "social-publisher.mjs"), packFile, `--report=${reportFile}`];
  if (args.dryRun) publisherArgs.push("--dry-run");
  if (args.force) publisherArgs.push("--force");
  const result = spawnSync(process.execPath, publisherArgs, { cwd: ROOT, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`PublisherAgent exited with code ${result.status}`);

  const report = readJson(reportFile, null);
  const audit = new PublicationAuditAgent().evaluate(report, { requirePublicDelivery: !args.dryRun });
  console.log(`[AuditAgent] public=${audit.counts.publishedPublic}, accepted=${audit.counts.acceptedByBuffer}, fallback=${audit.counts.fallbackAdmin}, disconnected=${audit.counts.skippedDisconnected}, failed=${audit.counts.failed}`);

  if (!args.dryRun) {
    writeJson(CLOUD_STATE_FILE, updateCloudState(state, pack, audit));
    console.log(`Recorded successful run ${runKey}.`);
  }
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
