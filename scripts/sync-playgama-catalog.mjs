import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ENDPOINT = "https://playgama.com/api/v1/partner/export/catalogue/games";
const PAGE_SIZE = 1000;
const OUTPUT = path.resolve("src/data/playgama-games.json");
const SUMMARY = path.resolve("data/catalog-summary.md");

const categoryLabels = {
  racing: "سباق",
  action: "أكشن",
  puzzle: "ألغاز",
  io: "آيو",
  girls: "بنات",
  casual: "خفيف",
  sports: "رياضة",
  shooting: "تصويب",
};

const categoryMatchers = [
  ["shooting", ["shooter", "shooting", "fps", "sniper", "gun", "archery"]],
  ["racing", ["racing", "driving", "cars", "car", "motorbike", "motorcycle", "drift", "parking", "truck"]],
  ["sports", ["sports", "football", "soccer", "basketball", "golf", "tennis", "boxing", "hockey", "billiards", "pool"]],
  ["io", ["io", "multiplayer", "2-player", "two-player", "online"]],
  ["girls", ["girls", "dress-up", "make-up", "makeover", "cooking", "princess", "fashion", "decoration"]],
  ["puzzle", ["puzzle", "brain", "logic", "hidden-object", "merge", "match-3", "match3", "mahjong", "word", "quiz"]],
  ["action", ["action", "fighting", "combat", "parkour", "zombie", "tower-defense", "adventure", "survival", "horror", "role"]],
];

function cleanText(value, maxLength = 1200) {
  if (typeof value !== "string") return "";
  const withoutInternalQa = value.split(/\s*["']?\[(?:Core Gameplay|Mechanics & Progression|Economy & Customization|Retention & Engagement)\]/i)[0];
  const normalized = withoutInternalQa.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength - 1).trimEnd() + "…";
}

function categoryFor(game) {
  const values = [
    ...(Array.isArray(game.genres) ? game.genres : []),
    ...(Array.isArray(game.tags) ? game.tags : []),
  ].map((value) => String(value).toLowerCase());
  const slug = String(game.slug ?? "").toLowerCase();
  if (/(?:^|[-.])io(?:$|-)/.test(slug)) return "io";
  for (const [category, needles] of categoryMatchers) {
    if (needles.some((needle) => values.some((value) => value === needle || value.includes(`${needle}-games`)))) return category;
  }
  return "casual";
}

function deviceSupport(mobileReady) {
  const values = Array.isArray(mobileReady) ? mobileReady.map((value) => String(value).toLowerCase()) : [];
  const mobile = values.some((value) => /android|ios|mobile/.test(value));
  const desktop = values.some((value) => /desktop|pc/.test(value));
  if (mobile && desktop) return "mobile-and-desktop";
  if (mobile) return "mobile-only";
  if (desktop) return "desktop-only";
  return "unknown";
}

function orientation(screenOrientation) {
  if (!screenOrientation || typeof screenOrientation !== "object") return "both";
  if (screenOrientation.horizontal && screenOrientation.vertical) return "both";
  if (screenOrientation.vertical) return "portrait";
  return "landscape";
}

function normalizeGame(game) {
  const slug = typeof game.slug === "string" ? game.slug.trim() : "";
  const title = cleanText(game.title, 180);
  const images = Array.isArray(game.images)
    ? [...new Set(game.images.filter((image) => typeof image === "string" && image.startsWith("https://")))]
    : [];
  const thumbnailWide = images[0] ?? "";
  const thumbnail = images[1] ?? thumbnailWide;
  if (!slug || !title || !thumbnailWide || !/^[A-Za-z0-9._~-]+$/.test(slug)) return null;
  const categorySlug = categoryFor(game);
  const video = Array.isArray(game.videos)
    ? game.videos.find((item) => item && typeof item.playgama_id === "string" && item.playgama_id.trim())
    : null;
  const supportedLanguages = Array.isArray(game.supportedLanguages)
    ? [...new Set(game.supportedLanguages.map((value) => String(value).trim()).filter(Boolean))]
    : [];
  const genres = Array.isArray(game.genres)
    ? [...new Set(game.genres.map((value) => cleanText(String(value), 80)).filter(Boolean))]
    : [];
  return {
    title,
    slug,
    thumbnail,
    thumbnailWide,
    images,
    videoId: video?.playgama_id.trim() || undefined,
    category: categoryLabels[categorySlug],
    categorySlug,
    description: cleanText(game.description),
    howToPlay: cleanText(game.howToPlayText, 1200),
    supportedLanguages,
    genres,
    inGamePurchases: String(game.inGamePurchases ?? "").toLowerCase() === "yes",
    supportedDevices: deviceSupport(game.mobileReady),
    orientation: orientation(game.screenOrientation),
  };
}

async function fetchPage(offset) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "PlixfyCatalogSync/1.0 (+https://www.plixfy.com)",
    },
    body: JSON.stringify({ pagination: { limit: PAGE_SIZE, offset } }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`Playgama catalog request failed: HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.games) || !Number.isFinite(payload.totalCount)) {
    throw new Error("Playgama returned an unexpected catalog response.");
  }
  return payload;
}

async function readExistingCount() {
  try {
    const existing = JSON.parse(await fs.readFile(OUTPUT, "utf8"));
    return Array.isArray(existing) ? existing.length : 0;
  } catch {
    return 0;
  }
}

async function main() {
  const first = await fetchPage(0);
  const rawGames = [...first.games];
  for (let offset = PAGE_SIZE; offset < first.totalCount; offset += PAGE_SIZE) {
    const page = await fetchPage(offset);
    rawGames.push(...page.games);
  }

  const games = [];
  const seen = new Set();
  let invalid = 0;
  let duplicates = 0;
  for (const rawGame of rawGames) {
    const game = normalizeGame(rawGame);
    if (!game) { invalid += 1; continue; }
    const key = game.slug.toLowerCase();
    if (seen.has(key)) { duplicates += 1; continue; }
    seen.add(key);
    games.push(game);
  }

  const oldCount = await readExistingCount();
  if (games.length < 1000) throw new Error(`Safety stop: only ${games.length} valid games were returned.`);
  if (oldCount >= 1000 && games.length < oldCount * 0.8) {
    throw new Error(`Safety stop: catalog unexpectedly shrank from ${oldCount} to ${games.length}.`);
  }

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, JSON.stringify(games, null, 2) + "\n", "utf8");

  const counts = Object.fromEntries(Object.keys(categoryLabels).map((key) => [key, 0]));
  const devices = { "mobile-and-desktop": 0, "mobile-only": 0, "desktop-only": 0, unknown: 0 };
  let gamesWithVideo = 0;
  let gamesWithMultipleImages = 0;
  for (const game of games) {
    counts[game.categorySlug] += 1;
    devices[game.supportedDevices] += 1;
    if (game.videoId) gamesWithVideo += 1;
    if (game.images.length > 1) gamesWithMultipleImages += 1;
  }
  const now = new Date().toISOString();
  const summary = `# Playgama catalog sync\n\n- Synced: ${now}\n- Source: ${ENDPOINT}\n- Publisher: Playgama only\n- Reported by Playgama: ${first.totalCount}\n- Imported: ${games.length}\n- Games with preview video: ${gamesWithVideo}\n- Games with multiple images: ${gamesWithMultipleImages}\n- Invalid entries skipped: ${invalid}\n- Duplicate slugs skipped: ${duplicates}\n\n## Categories\n\n${Object.entries(counts).map(([key, value]) => `- ${key}: ${value}`).join("\n")}\n\n## Device support\n\n${Object.entries(devices).map(([key, value]) => `- ${key}: ${value}`).join("\n")}\n`;
  await fs.writeFile(SUMMARY, summary, "utf8");
  console.log(`Playgama sync complete: ${games.length}/${first.totalCount} games imported.`);
  console.log(`Skipped ${invalid} invalid entries and ${duplicates} duplicate slugs.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
