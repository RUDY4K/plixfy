// يولّد محتوى SEO إنجليزيًا (metaDescription/longDescription/howToPlay/tips/faq)
// لأهم الألعاب حسب plays الحقيقية، عبر claude -p (الفوترة على الاشتراك المحلي).
//
// الحالة قابلة للاستئناف: النتائج تتراكم في scripts/.en-content-state.json
// ثم تُصدَّر إلى src/lib/gameContentDataEn/top.ts في نهاية كل دفعة.
//
// الاستخدام: node scripts/generate-en-content.mjs [count]

import fs from "node:fs";
import path from "node:path";
import { runClaude, extractJson } from "./claude-cli.mjs";

const COUNT = Number(process.argv[2] ?? 50);
const BATCH = 5;
const STATE_FILE = path.join("scripts", ".en-content-state.json");
const OUT_FILE = path.join("src", "lib", "gameContentDataEn", "top.ts");

// --- استخراج الألعاب ---

// ألعاب Playgama من literals متجانسة داخل games.ts (ملف مولَّد بنمط ثابت)
function parsePlaygamaGames() {
  const src = fs.readFileSync(path.join("src", "lib", "games.ts"), "utf8");
  const games = [];
  const blockRe = /\{\s*\n\s*title:\s*("(?:[^"\\]|\\.)*"),\s*\n\s*slug:\s*("(?:[^"\\]|\\.)*"),[\s\S]*?\n  \},/g;
  for (const m of src.matchAll(blockRe)) {
    const block = m[0];
    const get = (field) => {
      const fm = block.match(new RegExp(field + ':\\s*("(?:[^"\\\\]|\\\\.)*")'));
      return fm ? JSON.parse(fm[1]) : undefined;
    };
    const playsMatch = block.match(/plays:\s*([\d_]+)/);
    games.push({
      title: JSON.parse(m[1]),
      slug: JSON.parse(m[2]),
      categorySlug: get("categorySlug"),
      description: get("description"),
      plays: playsMatch ? Number(playsMatch[1].replace(/_/g, "")) : undefined,
    });
  }
  return games;
}

function loadJsonGames(file) {
  const data = JSON.parse(fs.readFileSync(path.join("src", "data", file), "utf8"));
  return data.map((g) => ({
    title: g.title,
    slug: g.slug,
    categorySlug: g.categorySlug,
    description: g.description,
    plays: undefined,
  }));
}

// نفس hash المستخدم في gameStats.ts — يعطي ترتيبًا ثابتًا للألعاب بلا plays حقيقية
function hashSlug(slug) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function topGames(count) {
  const seen = new Set();
  const all = [
    ...parsePlaygamaGames(),
    ...loadJsonGames("gd-games.json"),
    ...loadJsonGames("gm-games.json"),
  ].filter((g) => {
    if (!g.slug || seen.has(g.slug)) return false;
    seen.add(g.slug);
    return true;
  });

  const score = (g) =>
    typeof g.plays === "number" ? 1_000_000_000 + g.plays : (hashSlug(g.slug) >>> 8) % 240_000;
  return all.sort((a, b) => score(b) - score(a)).slice(0, count);
}

// --- التوليد ---

const CATEGORY_EN = {
  racing: "racing",
  action: "action",
  puzzle: "puzzle",
  io: ".io multiplayer",
  girls: "girls / dress-up",
  casual: "casual",
  sports: "sports",
  shooting: "shooting",
};

function buildPrompt(batch) {
  const gamesBlock = batch
    .map(
      (g, i) =>
        `${i + 1}. slug: "${g.slug}"\n   title: ${g.title}\n   category: ${CATEGORY_EN[g.categorySlug] ?? g.categorySlug}\n   source description: ${(g.description ?? "(none)").slice(0, 600)}`,
    )
    .join("\n\n");

  return `You are writing English SEO content for Plixfy (plixfy.com), a free browser-games site. All games run in the browser with no download, on mobile and desktop.

For EACH game below, write original, natural, helpful content (do NOT copy the source description verbatim — rewrite and expand):

- "metaDescription": 140-160 chars, starts with "Play {title} free online", mentions browser/no download.
- "longDescription": 3 paragraphs separated by "\\n\\n" (total 180-260 words) — what the game is, what makes it fun/unique, who it suits and that it runs free in the browser on mobile and desktop.
- "howToPlay": array of 5 short imperative steps (controls: keyboard arrows/WASD/mouse on desktop, touch on mobile — infer sensibly from the game type).
- "tips": array of 5 practical gameplay tips.
- "faq": array of 4 objects {"question","answer"} — vary the questions per game (scoring, difficulty, mobile support, is it free, multiplayer, saving progress... pick what fits).

Games:

${gamesBlock}

Return ONLY a JSON object mapping each slug to its content object:
{"<slug>": {"metaDescription": "...", "longDescription": "...", "howToPlay": [...], "tips": [...], "faq": [{"question":"...","answer":"..."}]}}`;
}

// --- إخراج TS ---

function emitTs(state) {
  const entries = Object.entries(state)
    .map(([slug, c]) => {
      return `  ${JSON.stringify(slug)}: {
    slug: ${JSON.stringify(slug)},
    metaDescription: ${JSON.stringify(c.metaDescription)},
    longDescription: ${JSON.stringify(c.longDescription)},
    howToPlay: ${JSON.stringify(c.howToPlay, null, 6).replace(/\n\s*\]/, "\n    ]")},
    tips: ${JSON.stringify(c.tips, null, 6).replace(/\n\s*\]/, "\n    ]")},
    faq: ${JSON.stringify(c.faq, null, 6).replace(/\n\s*\]/, "\n    ]")},
  },`;
    })
    .join("\n");

  const out = `import type { GameContent } from "@/lib/gameContent";

// محتوى إنجليزي مولَّد لأهم الألعاب — يولَّد عبر scripts/generate-en-content.mjs
// لا تحرّر يدويًا؛ أعد التوليد بدلًا من ذلك.
export const topEnContent: Record<string, GameContent> = {
${entries}
};
`;
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, out, "utf8");
}

// --- التنفيذ ---

function main() {
  const state = fs.existsSync(STATE_FILE)
    ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8"))
    : {};

  const targets = topGames(COUNT).filter((g) => !(g.slug in state));
  console.log(`Top ${COUNT} games — ${targets.length} remaining to generate.`);

  if (process.argv.includes("--dry")) {
    for (const g of targets) {
      console.log(
        `${g.slug} | plays=${g.plays ?? "-"} | ${g.categorySlug} | desc=${g.description ? "yes" : "NO"}`,
      );
    }
    return;
  }

  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    console.log(
      `Batch ${Math.floor(i / BATCH) + 1}: ${batch.map((g) => g.slug).join(", ")}`,
    );
    const raw = runClaude({
      prompt: buildPrompt(batch),
      model: "sonnet",
      timeoutMs: 15 * 60 * 1000,
    });
    const json = extractJson(raw);

    let ok = 0;
    for (const g of batch) {
      const c = json[g.slug];
      if (
        c &&
        typeof c.metaDescription === "string" &&
        typeof c.longDescription === "string" &&
        Array.isArray(c.howToPlay) &&
        Array.isArray(c.tips) &&
        Array.isArray(c.faq)
      ) {
        state[g.slug] = c;
        ok++;
      } else {
        console.warn(`  ! missing/invalid content for ${g.slug} — will retry on next run`);
      }
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
    emitTs(state);
    console.log(`  ✓ ${ok}/${batch.length} saved (total ${Object.keys(state).length})`);
  }

  console.log(`Done. ${Object.keys(state).length} games in ${OUT_FILE}`);
}

main();
