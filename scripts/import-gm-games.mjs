// Imports games from the GameMonetize public feed into src/data/gm-games.json.
// Run: node scripts/import-gm-games.mjs
// The feed is public (no auth). Revenue attribution happens at embed time via the
// HTTP referrer of the page embedding html5.gamemonetize.co, matched against the
// domain registered in the GameMonetize publisher dashboard.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = join(ROOT, "src", "data", "gm-games.json");
const GAMES_TS = join(ROOT, "src", "lib", "games.ts");
const GD_JSON = join(ROOT, "src", "data", "gd-games.json");

const FEED =
  "https://rss.gamemonetize.com/rssfeed.php?format=json&category=All&type=html5&popularity=newest&company=All&amount=2000";
const PER_CATEGORY_CAP = 20;

// Saudi-market exclusions (same policy as the Playgama/GD imports)
const BANNED = /casino|gambl|poker|blackjack|roulette|slot\s*machine|betting|kissing|flirt|dating|sexy|bikini|drunk|beer\b|vodka|whiskey|vape|smoking/i;

// GM category/tags -> plixfy CategorySlug. First match wins (order matters).
const CATEGORY_MAP = [
  [/racing|driving|drift/i, "racing", "سباق"],
  [/shooter|shooting|sniper|gun\b/i, "shooting", "تصويب"],
  [/sports|soccer|basketball|football|golf/i, "sports", "رياضة"],
  [/girls|dress-?up|cooking|beauty|make-?up|baby\s*hazel/i, "girls", "بنات"],
  [/\.?io\b|multiplayer/i, "io", "آيو"],
  [/puzzle|board|match-?3|cards|logic|mahjong|solitaire/i, "puzzle", "ألغاز"],
  [/action|adventure|fighting|strategy|battle/i, "action", "أكشن"],
  [/casual|arcade|hypercasual|clicker|simulation|educational|family|fun\b/i, "casual", "خفيف"],
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTitle(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function pickCategory(haystack) {
  for (const [re, slug, labelAr] of CATEGORY_MAP) {
    if (re.test(haystack)) return { categorySlug: slug, category: labelAr };
  }
  return null;
}

function extractGmId(url) {
  const m = /html5\.gamemonetize\.(?:co|com)\/([a-z0-9]+)\/?/i.exec(url ?? "");
  return m ? m[1] : null;
}

function extractExistingKeys() {
  const src = readFileSync(GAMES_TS, "utf8");
  const titles = new Set();
  const slugs = new Set();
  for (const m of src.matchAll(/title:\s*"((?:[^"\\]|\\.)*)"/g)) {
    titles.add(normalizeTitle(m[1]));
  }
  for (const m of src.matchAll(/slug:\s*"([^"]+)"/g)) {
    slugs.add(m[1]);
  }
  const gd = JSON.parse(readFileSync(GD_JSON, "utf8"));
  for (const g of gd) {
    titles.add(normalizeTitle(g.title));
    slugs.add(g.slug);
  }
  return { titles, slugs };
}

async function main() {
  const { titles: existingTitles, slugs: existingSlugs } = extractExistingKeys();
  console.error("Existing catalog: " + existingSlugs.size + " slugs, " + existingTitles.size + " titles");

  const res = await fetch(FEED);
  if (!res.ok) throw new Error("GM feed fetch failed: HTTP " + res.status);
  const raw = await res.json();
  if (!Array.isArray(raw)) throw new Error("GM feed: unexpected payload shape");
  console.error("Feed items: " + raw.length);

  const perCategory = new Map();
  const seenTitles = new Set();
  const seenSlugs = new Set();
  const seenIds = new Set();
  const games = [];
  const stats = { banned: 0, noCategory: 0, dupTitle: 0, dupSlug: 0, badData: 0, capped: 0 };

  for (const g of raw) {
    const gmId = extractGmId(g.url);
    if (!gmId || !g.title || seenIds.has(gmId)) {
      stats.badData++;
      continue;
    }
    const title = g.title.trim();
    const haystack = [title, g.description ?? "", g.tags ?? "", g.category ?? ""].join(" ");
    if (BANNED.test(haystack)) {
      stats.banned++;
      continue;
    }
    const cat = pickCategory([g.category ?? "", g.tags ?? "", title].join(" "));
    if (!cat) {
      stats.noCategory++;
      continue;
    }
    const titleKey = normalizeTitle(title);
    if (existingTitles.has(titleKey) || seenTitles.has(titleKey)) {
      stats.dupTitle++;
      continue;
    }
    const slug = slugify(title);
    if (!slug || existingSlugs.has(slug) || seenSlugs.has(slug)) {
      stats.dupSlug++;
      continue;
    }
    const count = perCategory.get(cat.categorySlug) ?? 0;
    if (count >= PER_CATEGORY_CAP) {
      stats.capped++;
      continue;
    }

    perCategory.set(cat.categorySlug, count + 1);
    seenTitles.add(titleKey);
    seenSlugs.add(slug);
    seenIds.add(gmId);
    games.push({
      title,
      slug,
      gmId,
      thumbnail: "https://img.gamemonetize.com/" + gmId + "/512x384.jpg",
      category: cat.category,
      categorySlug: cat.categorySlug,
      description: (g.description ?? "").trim() || undefined,
    });
  }

  writeFileSync(OUTPUT, JSON.stringify(games, null, 2) + "\n", "utf8");
  console.error("\nWrote " + games.length + " games to src/data/gm-games.json");
  console.error("Filters: " + JSON.stringify(stats));
  console.error("Per category: " + JSON.stringify(Object.fromEntries(perCategory)));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
