import fs from "node:fs";
import path from "node:path";

const CATEGORY_SLUGS = new Set([
  "racing",
  "action",
  "puzzle",
  "io",
  "girls",
  "casual",
  "sports",
  "shooting",
]);

export function normalizePlaygamaGames(value) {
  if (!Array.isArray(value)) {
    throw new Error("[PlaygamaCatalog] expected an array of games");
  }

  const games = value
    .filter((game) =>
      game
      && typeof game.title === "string"
      && game.title.trim()
      && typeof game.slug === "string"
      && game.slug.trim()
      && typeof game.thumbnail === "string"
      && game.thumbnail.trim()
      && typeof game.category === "string"
      && game.category.trim()
      && CATEGORY_SLUGS.has(game.categorySlug),
    )
    .map((game) => ({
      title: game.title,
      slug: game.slug,
      thumbnail: game.thumbnail,
      thumbnailWide: typeof game.thumbnailWide === "string" ? game.thumbnailWide : "",
      category: game.category,
      categorySlug: game.categorySlug,
      description: typeof game.description === "string" ? game.description : "",
      genres: Array.isArray(game.genres) ? game.genres.filter((genre) => typeof genre === "string") : [],
      images: Array.isArray(game.images) ? game.images.filter((image) => typeof image === "string") : [],
      supportedDevices: typeof game.supportedDevices === "string" ? game.supportedDevices : "unknown",
      source: "playgama",
    }));

  if (games.length === 0) {
    throw new Error("[PlaygamaCatalog] found no valid games");
  }

  return games;
}

export function loadPlaygamaGames(root = process.cwd()) {
  const file = path.join(root, "src", "data", "playgama-games.json");
  let value;
  try {
    value = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error(`[PlaygamaCatalog] could not read ${file}: ${error.message}`);
  }
  return normalizePlaygamaGames(value);
}
