import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (file) => readFileSync(path.join(ROOT, file), "utf8");

test("catalog excludes pregnancy and childbirth simulator games", () => {
  const games = JSON.parse(read("src/data/playgama-games.json"));
  const sync = read("scripts/sync-playgama-catalog.mjs");
  const excludedTheme = /\b(?:pregnan(?:t|cy)|maternity|childbirth|give birth|birth simulator)\b/i;

  assert.ok(!games.some((game) => game.slug === "pregnant-mother-simulator"));
  assert.ok(!games.some((game) => excludedTheme.test([
    game.slug,
    game.title,
    game.description,
    game.howToPlay,
    ...(game.genres ?? []),
  ].join(" "))));
  assert.match(sync, /excludedContentMatchers/);
  assert.match(sync, /isExcludedGame\(game\)/);
});
