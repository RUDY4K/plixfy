// Imports games from the GameDistribution public catalog into src/data/gd-games.json.
// Run: node scripts/import-gd-games.mjs
// The catalog API is public (no auth). Revenue attribution happens at embed time
// via gd_sdk_referrer_url + the domain registered in the GD publisher dashboard.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = join(ROOT, "src", "data", "gd-games.json");
const GAMES_TS = join(ROOT, "src", "lib", "games.ts");

const API = "https://catalog.api.gamedistribution.com/api/v2.0/rss/All/";
const PAGES = 30; // 100 games per page
const PER_CATEGORY_CAP = 25;

// Saudi-market exclusions (same policy as the Playgama import)
const BANNED = /casino|gambl|poker|blackjack|roulette|slot\s*machine|betting|kissing|flirt|dating|sexy|bikini|drunk|beer\b|vodka|whiskey|vape|smoking/i;

// GD category -> plixfy CategorySlug. First match wins (order matters).
const CATEGORY_MAP = [
  [/racing|driving/i, "racing", "سباق"],
  [/shooter|shooting/i, "shooting", "تصويب"],
  [/sports|soccer|basketball|football/i, "sports", "رياضة"],
  [/girls|dress-?up|cooking|beauty|make-?up/i, "girls", "بنات"],
  [/\.?io\b|multiplayer/i, "io", "آيو"],
  [/puzzle|board|match-?3|cards/i, "puzzle", "ألغاز"],
  [/action|adventure|fighting|strategy/i, "action", "أكشن"],
  [/casual|arcade|hypercasual|simulation|educational|family/i, "casual", "خفيف"],
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

function pickCategory(categories) {
  const joined = categories.join(" ");
  for (const [re, slug, labelAr] of CATEGORY_MAP) {
    if (re.test(joined)) return { categorySlug: slug, category: labelAr };
  }
  return null;
}

async function fetchPage(page) {
  const url =
    API +
    "?format=json&collection=all&categories=All&type=all&mobile=all&amount=100&page=" +
    page;
  const res = await fetch(url);
  if (!res.ok) throw new Error("GD catalog fetch failed: HTTP " + res.status + " (page " + page + ")");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("GD catalog: unexpected payload shape on page " + page);
  return data;
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
  return { titles, slugs };
}

async function main() {
  const { titles: existingTitles, slugs: existingSlugs } = extractExistingKeys();
  console.error("Existing catalog: " + existingSlugs.size + " slugs, " + existingTitles.size + " titles");

  const raw = [];
  for (let page = 1; page <= PAGES; page++) {
    const batch = await fetchPage(page);
    if (batch.length === 0) break;
    raw.push(...batch);
    console.error("page " + page + ": +" + batch.length + " (total " + raw.length + ")");
  }

  const perCategory = new Map();
  const seenTitles = new Set();
  const seenSlugs = new Set();
  const games = [];
  const stats = { banned: 0, desktopOnly: 0, noCategory: 0, dupTitle: 0, dupSlug: 0, badData: 0, capped: 0 };

  for (const g of raw) {
    if (!g.Md5 || !g.Title || !Array.isArray(g.Category) || !Array.isArray(g.Asset) || g.Asset.length === 0) {
      stats.badData++;
      continue;
    }
    if (g.Https !== true || g.Type !== "html5") {
      stats.badData++;
      continue;
    }
    // ملاحظة: حقل Mobile في كتالوج GD لا يعني «جاهز للجوال» — 99% من الألعاب
    // (بما فيها ألعاب اللمس) عليه "false"، لذا لا نفلتر عليه.
    const haystack = [g.Title, g.Description ?? "", (g.Tag ?? []).join(" "), g.Category.join(" ")].join(" ");
    if (BANNED.test(haystack)) {
      stats.banned++;
      continue;
    }
    const cat = pickCategory(g.Category);
    if (!cat) {
      stats.noCategory++;
      continue;
    }
    const titleKey = normalizeTitle(g.Title);
    if (existingTitles.has(titleKey) || seenTitles.has(titleKey)) {
      stats.dupTitle++;
      continue;
    }
    const slug = slugify(g.Title);
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
    games.push({
      title: g.Title,
      slug,
      gdId: g.Md5,
      thumbnail: "https://img.gamedistribution.com/" + g.Md5 + "-512x384.jpg",
      category: cat.category,
      categorySlug: cat.categorySlug,
      description: (g.Description ?? "").trim() || undefined,
    });
  }

  writeFileSync(OUTPUT, JSON.stringify(games, null, 2) + "\n", "utf8");
  console.error("\nWrote " + games.length + " games to src/data/gd-games.json");
  console.error("Filters: " + JSON.stringify(stats));
  console.error("Per category: " + JSON.stringify(Object.fromEntries(perCategory)));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
