// Deterministic, AI-independent social publisher for GitHub Actions.
// Usage: node scripts/cloud-social-runner.mjs [--slot=morning|evening|auto] [--dry-run] [--force]
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

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
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
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

function stableIndex(seed, length) {
  const hash = crypto.createHash("sha256").update(seed).digest();
  return hash.readUInt32BE(0) % length;
}

function cleanContentId(value) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 72);
}

function truncate(text, max) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

function loadGames() {
  const files = ["gd-games.json", "gm-games.json"];
  return files
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

function chooseUnused(items, recentIds, seed, idField = "slug") {
  const recent = new Set(recentIds);
  const fresh = items.filter((item) => !recent.has(item[idField]));
  const pool = fresh.length > 0 ? fresh : items;
  if (pool.length === 0) throw new Error("No eligible content found");
  return pool[stableIndex(seed, pool.length)];
}

function gamePack(game, date, slot) {
  const title = truncate(game.title, 70);
  const category = CATEGORY_AR[game.categorySlug] || game.category || "ألعاب";
  const url = `${SITE}/ar/play/${encodeURIComponent(game.slug)}`;
  const contentId = cleanContentId(`game-${game.slug}`);

  return {
    date,
    campaign: "ar_growth_cloud",
    slot,
    source: { kind: "game", id: game.slug },
    items: [
      {
        platform: "telegram",
        kind: "game",
        contentId,
        text: `🎮 لعبة اليوم: ${title}\n\nتبي تحديًا سريعًا من المتصفح؟ جرّبها مجانًا بدون تحميل أو تسجيل. التصنيف: ${category}. شاركنا نتيجتك!`,
        url,
        image: game.thumbnail,
      },
      {
        platform: "x",
        kind: "game",
        contentId,
        text: `🎮 جرّب ${truncate(title, 55)} مجانًا من المتصفح، بدون تحميل أو تسجيل. كم نتيجة تقدر تحقق؟ 👇\n#ألعاب #Plixfy`,
        url,
        image: game.thumbnail,
      },
      {
        platform: "facebook",
        kind: "game",
        contentId,
        text: `🎮 اختيارنا اليوم هو ${title}. لعبة ${category} تعمل مباشرة من المتصفح مجانًا، بدون تحميل أو إنشاء حساب. جرّبها وقل لنا: وصلت لأي نتيجة؟`,
        url,
        image: game.thumbnail,
      },
      {
        platform: "instagram",
        kind: "game",
        contentId,
        text: `🎮 تحدي اليوم: ${title}\n\nالعبها مجانًا من المتصفح وشاركنا نتيجتك. الرابط في Plixfy.\n\n#ألعاب #العاب_مجانية #ألعاب_متصفح #Plixfy`,
        url,
        image: game.thumbnail,
      },
    ],
  };
}

function newsPack(news, date, slot) {
  const title = truncate(news.title, 110);
  const summary = truncate(news.summary, 260);
  const url = `${SITE}/ar/news/${encodeURIComponent(news.slug)}`;
  const contentId = cleanContentId(`news-${news.slug}`);

  return {
    date,
    campaign: "ar_growth_cloud",
    slot,
    source: { kind: "news", id: news.slug },
    items: [
      {
        platform: "telegram",
        kind: "news",
        contentId,
        text: `📰 ${title}\n\n${summary}\n\nاقرأ التفاصيل على Plixfy:`,
        url,
      },
      {
        platform: "x",
        kind: "news",
        contentId,
        text: `📰 ${truncate(title, 145)}\n\nالتفاصيل على Plixfy 👇\n#أخبار_الألعاب`,
        url,
      },
      {
        platform: "facebook",
        kind: "news",
        contentId,
        text: `📰 ${title}\n\n${summary}\n\nما رأيكم بالخبر؟ اقرأوا التفاصيل الكاملة على Plixfy.`,
        url,
      },
      {
        platform: "instagram",
        kind: "news",
        contentId,
        text: `📰 ${title}\n\n${truncate(summary, 180)}\n\nالتفاصيل على Plixfy.\n\n#أخبار_الألعاب #GamingNews #Plixfy`,
        url,
      },
    ],
  };
}

function updateCloudState(state, pack) {
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
  next.runs[runKey] = { status: "published", source: pack.source, completedAt: now };
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
        headers: { "user-agent": "PlixfyCloudSocial/1.0" },
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
  if (!args.dryRun && !args.force && state.runs?.[runKey]?.status === "published") {
    console.log(`Run ${runKey} is already complete; nothing to do.`);
    return;
  }

  let pack;
  if (args.slot === "morning") {
    const game = chooseUnused(loadGames(), state.recentGames || [], runKey);
    pack = gamePack(game, args.date, args.slot);
  } else {
    const newsItems = loadNews(args.date);
    if (newsItems.length > 0) {
      const news = chooseUnused(newsItems, state.recentNews || [], runKey);
      pack = newsPack(news, args.date, args.slot);
    } else {
      const game = chooseUnused(loadGames(), state.recentGames || [], runKey);
      pack = gamePack(game, args.date, args.slot);
    }
  }

  await verifyPublicUrl(pack.items[0].url);
  fs.mkdirSync(SOCIAL_DIR, { recursive: true });
  const packFile = path.join(SOCIAL_DIR, `${args.date}-${args.slot}.json`);
  writeJson(packFile, pack);
  console.log(`Prepared ${pack.source.kind}/${pack.source.id} for ${runKey}.`);

  const publisherArgs = [path.join(ROOT, "scripts", "social-publisher.mjs"), packFile];
  if (args.dryRun) publisherArgs.push("--dry-run");
  const result = spawnSync(process.execPath, publisherArgs, { cwd: ROOT, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Social publisher exited with code ${result.status}`);

  if (!args.dryRun) {
    writeJson(CLOUD_STATE_FILE, updateCloudState(state, pack));
    console.log(`Recorded successful run ${runKey}.`);
  }
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
