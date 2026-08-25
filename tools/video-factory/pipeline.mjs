// مصنع مقاطع بليكسفاي — يسجّل جيم بلاي، يكتشف أفضل لقطة بقياس الحركة،
// يمنتج 9:16 مع hook عربي وختمة، ويرسل الناتج إلى تلقرام.
// usage: node pipeline.mjs [count]   (يختار الألعاب تلقائياً بالتناوب)
//        node pipeline.mjs --slug <slug>   (لعبة محددة)
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = import.meta.dirname;
const REPO = path.resolve(ROOT, "../..");
const OUT_QUEUE = process.env.PLIXFY_VIDEO_QUEUE ?? path.join(os.homedir(), "Videos", "plixfy-ads", "queue");
const RAW_DIR = path.join(ROOT, "raw");
const OVERLAY_DIR = path.join(ROOT, "overlays");
const STATE_FILE = path.join(ROOT, "state.json");
const HOOKS = JSON.parse(fs.readFileSync(path.join(ROOT, "hooks.json"), "utf8"));

// تلقرام — نفس بوت OpenClaw (الإرسال لا يتعارض مع الـgateway)
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

const VIEWPORT = { width: 1280, height: 720 };
// منطقة اللعبة داخل الصفحة (مقاسة من صفحة /play على فيوبورت 1280x720)
const GAME_BOX = { w: 975, h: 414, x: 150, y: 143 };
// الإعلانات متغيرة الطول (60-180ث) — نراقب إطارات الإعلان بدل انتظار ثابت
const MIN_AD_WAIT = 15;
const MAX_AD_WAIT = 180;
const PLAY_SECONDS = 100;
const CLIP_SECONDS = 11;
// معايرة من تسجيلات فعلية: لعب حقيقي ≈ 4.0، قوائم ≈ 0.6، كاروسيل تعليمات ≈ 1.8
const MIN_MOTION = 2.5;
// إطارات شبكات الإعلانات (IMA/AdSense/GD) — أي iframe ظاهر بهذه الروابط = إعلان شغّال
const AD_RX = /imasdk|googleads|doubleclick|googlesyndication|adsbygoogle|adinplay|venatus|aniview/i;

for (const d of [RAW_DIR, OVERLAY_DIR, OUT_QUEUE]) fs.mkdirSync(d, { recursive: true });

// ---------- اختيار الألعاب ----------
function loadGames() {
  const src = fs.readFileSync(path.join(REPO, "src/lib/games.ts"), "utf8");
  const blocks = src.match(/\{[^{}]*?title:\s*"[^"]*"[^{}]*?\}/gs) ?? [];
  const fromTs = blocks
    .map((b) => ({
      title: b.match(/title:\s*"([^"]*)"/)?.[1],
      slug: b.match(/slug:\s*"([^"]*)"/)?.[1],
      categorySlug: b.match(/categorySlug:\s*"([^"]*)"/)?.[1],
      plays: Number(b.match(/plays:\s*(\d+)/)?.[1] ?? 0),
    }))
    .filter((g) => g.title && g.slug && g.categorySlug);
  const gd = JSON.parse(fs.readFileSync(path.join(REPO, "src/data/gd-games.json"), "utf8")).map(
    (g) => ({ title: g.title, slug: g.slug, categorySlug: g.categorySlug, plays: g.plays ?? 0 }),
  );
  return [...fromTs, ...gd];
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { done: [], failed: {} };
  }
}
const state = loadState();
const saveState = () => fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

function pickGames(count) {
  const games = loadGames().sort((a, b) => b.plays - a.plays);
  const skip = new Set([...state.done, ...Object.keys(state.failed).filter((s) => state.failed[s] >= 2)]);
  return games.filter((g) => !skip.has(g.slug)).slice(0, count);
}

// هل يوجد إعلان معروض الآن؟ (iframe إعلاني ظاهر بحجم معقول، أو لافتة Playgama)
async function adShowing(page) {
  for (const f of page.frames()) {
    if (!AD_RX.test(f.url())) continue;
    try {
      const el = await f.frameElement();
      const box = el && (await el.boundingBox());
      if (box && box.width > 250 && box.height > 100) return true;
    } catch {}
  }
  for (const f of page.frames()) {
    try {
      if (await f.getByText(/about to continue/i).first().isVisible()) return true;
    } catch {}
  }
  return false;
}

// ---------- التسجيل بروتين تفاعل عام ----------
async function record(game) {
  const browser = await chromium.launch({
    headless: false,
    args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
  });
  const context = await browser.newContext({ viewport: VIEWPORT, recordVideo: { dir: RAW_DIR, size: VIEWPORT } });
  const page = await context.newPage();
  const t0 = Date.now(); // بداية تسجيل الفيديو — كل الأزمنة نسبةً إليه
  const vt = () => (Date.now() - t0) / 1000;
  console.log(`  [rec] /play/${game.slug}`);
  await page.goto(`https://www.plixfy.com/play/${game.slug}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  try {
    await page.getByRole("button", { name: "رفض" }).click({ timeout: 8000 });
  } catch {}
  try {
    await page.locator('button[aria-label^="العب"]').first().click({ timeout: 10000 });
  } catch {}

  // ننتظر نهاية الإعلان فعلياً: فحص كل ثانيتين حتى يختفي لفحصين متتاليين
  await page.waitForTimeout(MIN_AD_WAIT * 1000);
  let clear = 0;
  while (vt() < MAX_AD_WAIT && clear < 2) {
    clear = (await adShowing(page)) ? 0 : clear + 1;
    if (clear < 2) await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(3000);
  const gameStart = vt();
  console.log(`  [ad] انتهى الإعلان عند ${gameStart.toFixed(0)}s`);
  const adTimes = []; // عينات أوقات ظهور إعلانات أثناء اللعب (midroll) لاستبعادها من الاختيار

  const b = await page.locator("iframe").first().boundingBox().catch(() => null);
  const box = b ?? { x: GAME_BOX.x, y: GAME_BOX.y, width: GAME_BOX.w, height: GAME_BOX.h };
  const at = (fx, fy) => [box.x + box.width * fx, box.y + box.height * fy];

  // مواضع الأزرار الشائعة في قوائم الألعاب — تكرار (0.92,0.5) لتجاوز كاروسيلات التعليمات
  const MENU_SPOTS = [
    [0.5, 0.5], [0.92, 0.5], [0.92, 0.5], [0.92, 0.5], [0.92, 0.5], [0.5, 0.72],
    [0.86, 0.42], [0.5, 0.85], [0.14, 0.78], [0.92, 0.5], [0.5, 0.35], [0.5, 0.65],
  ];

  const end = Date.now() + PLAY_SECONDS * 1000;
  let cycle = 0;
  while (Date.now() < end) {
    if (await adShowing(page)) adTimes.push(vt());
    // تجاوز قوائم: نقرتان من القائمة الشائعة كل دورة
    const [mx, my] = at(...MENU_SPOTS[cycle % MENU_SPOTS.length]);
    await page.mouse.click(mx, my);
    await page.waitForTimeout(600);
    await page.keyboard.press("Space").catch(() => {});
    await page.keyboard.press("Enter").catch(() => {});

    // 6 ثوانٍ لعب متنوع: أسهم + ماوس متعرج + نقرات إيقاعية
    const phaseEnd = Math.min(Date.now() + 6000, end);
    await page.keyboard.down("ArrowUp");
    while (Date.now() < phaseEnd) {
      const t = Date.now() / 1000;
      const [cx0, cy0] = at(0.5, 0.5);
      await page.mouse.move(
        cx0 + Math.cos(t * 1.1) * box.width * 0.28,
        cy0 + Math.sin(t * 1.6) * box.height * 0.22,
        { steps: 3 },
      );
      await page.keyboard.press(cycle % 2 ? "ArrowRight" : "ArrowLeft", { delay: 120 }).catch(() => {});
      if (Math.random() < 0.35) await page.mouse.down().then(() => page.mouse.up());
      await page.waitForTimeout(350);
    }
    await page.keyboard.up("ArrowUp");
    cycle++;
  }

  await page.waitForTimeout(1000);
  const video = page.video();
  await context.close();
  const tmp = await video.path();
  const out = path.join(RAW_DIR, `${game.slug}.webm`);
  if (fs.existsSync(out)) fs.unlinkSync(out);
  fs.renameSync(tmp, out);
  await browser.close();
  return { file: out, gameStart, adTimes };
}

// ---------- كشف أفضل نافذة لعب بقياس الحركة ----------
function bestWindow(rawFile, gameStart, adTimes) {
  const scoresFile = path.join(RAW_DIR, "scores.txt");
  if (fs.existsSync(scoresFile)) fs.unlinkSync(scoresFile);
  execFileSync("ffmpeg", [
    "-i", rawFile,
    "-vf", `crop=${GAME_BOX.w}:${GAME_BOX.h}:${GAME_BOX.x}:${GAME_BOX.y},select=gt(scene\\,0.002),metadata=print:file=raw/scores.txt`,
    "-f", "null", "-",
  ], { stdio: "ignore", cwd: ROOT });

  const text = fs.existsSync(scoresFile) ? fs.readFileSync(scoresFile, "utf8") : "";
  const events = [];
  let t = null;
  for (const line of text.split("\n")) {
    const mt = line.match(/pts_time:([\d.]+)/);
    if (mt) t = Number(mt[1]);
    const ms = line.match(/scene_score=([\d.]+)/);
    if (ms && t !== null) events.push({ t, s: Number(ms[1]) });
  }
  // نبحث عن نافذة CLIP_SECONDS بأعلى حركة بعد نهاية الإعلان الفعلية،
  // ونستبعد أي نافذة تتقاطع مع عينة إعلان midroll (±4ث احتياط)
  const start = gameStart + 4;
  let best = { t: start, score: 0 };
  for (let w = start; w < gameStart + PLAY_SECONDS - CLIP_SECONDS; w += 1) {
    if (adTimes.some((a) => a >= w - 4 && a <= w + CLIP_SECONDS + 4)) continue;
    const score = events.filter((e) => e.t >= w && e.t < w + CLIP_SECONDS).reduce((a, e) => a + e.s, 0);
    if (score > best.score) best = { t: w, score };
  }
  return best;
}

// ---------- التراكب العربي ----------
async function makeOverlays(game, hookText) {
  const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@700;900&display=swap');
    *{margin:0;padding:0} body{width:1080px;background:transparent;font-family:'Tajawal',sans-serif}
    .wrap{width:1080px;display:flex;align-items:center;justify-content:center;padding:40px 30px;box-sizing:border-box}
    .hook{font-size:72px;font-weight:900;color:#fff;text-align:center;line-height:1.35;
      text-shadow:0 4px 24px rgba(0,0,0,.9),0 2px 6px rgba(0,0,0,.9);-webkit-text-stroke:2px rgba(0,0,0,.55)}
    .outro{display:flex;flex-direction:column;gap:10px;align-items:center;background:rgba(13,0,26,.82);border-radius:28px;padding:34px 60px}
    .brand{font-size:84px;font-weight:900;color:#ff2e9a;text-shadow:0 0 30px rgba(255,46,154,.8);direction:ltr}
    .sub{font-size:46px;font-weight:700;color:#fff}
  </style></head><body><div class="wrap">__INNER__</div></body></html>`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 800 } });
  const shoot = async (inner, file) => {
    await page.setContent(html.replace("__INNER__", inner), { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await page.locator(".wrap").screenshot({ path: path.join(OVERLAY_DIR, file), omitBackground: true });
  };
  await shoot(`<div class="hook">${hookText}</div>`, `${game.slug}-hook.png`);
  await shoot(
    `<div class="outro"><div class="brand">plixfy.com</div><div class="sub">العب فوراً — بدون تحميل 🎮</div></div>`,
    `${game.slug}-outro.png`,
  );
  await browser.close();
}

// ---------- المونتاج ----------
function edit(game, rawFile, startAt) {
  const out = path.join(OUT_QUEUE, `${game.slug}-tiktok.mp4`);
  execFileSync("ffmpeg", [
    "-y", "-ss", String(startAt), "-t", String(CLIP_SECONDS), "-i", rawFile,
    "-i", path.join(OVERLAY_DIR, `${game.slug}-hook.png`),
    "-i", path.join(OVERLAY_DIR, `${game.slug}-outro.png`),
    "-filter_complex",
    `[0:v]crop=${GAME_BOX.w}:${GAME_BOX.h}:${GAME_BOX.x}:${GAME_BOX.y},setpts=PTS/1.1[game];` +
    `[game]split[g1][g2];` +
    `[g1]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:2,eq=brightness=-0.15[bg];` +
    `[g2]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[base];` +
    `[base][1:v]overlay=(W-w)/2:180:enable='between(t,0.2,3.5)'[wh];` +
    `[wh][2:v]overlay=(W-w)/2:H-h-320:enable='gte(t,${(CLIP_SECONDS / 1.1 - 2.4).toFixed(1)})'[out]`,
    "-map", "[out]", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-an",
    out,
  ], { stdio: "ignore" });
  return out;
}

// ---------- تلقرام ----------
async function sendVideo(game, file, hookText) {
  if (!TG_TOKEN || !TG_CHAT) {
    throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required");
  }
  const caption = [
    `🎬 ${game.title} — مقطع جاهز للنشر`,
    "",
    `الكابشن المقترح: ${hookText} — العب من الرابط 🎮`,
    `https://www.plixfy.com/play/${game.slug}?utm_source=tiktok&utm_medium=paid&utm_campaign=factory&utm_content=${game.slug}`,
    "",
    "أضف موسيقى من المكتبة التجارية عند الرفع",
  ].join("\n");
  const form = new FormData();
  form.append("chat_id", TG_CHAT);
  form.append("caption", caption);
  form.append("video", new Blob([fs.readFileSync(file)], { type: "video/mp4" }), path.basename(file));
  const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendVideo`, { method: "POST", body: form });
  const body = await res.json().catch(() => ({}));
  if (!body.ok) throw new Error(`telegram sendVideo failed: ${JSON.stringify(body)}`);
}

// ---------- التشغيل ----------
async function processGame(game) {
  console.log(`▶ ${game.title} (${game.slug})`);
  try {
    const rec = await record(game);
    const win = bestWindow(rec.file, rec.gameStart, rec.adTimes);
    console.log(`  [motion] best window @${win.t}s score=${win.score.toFixed(2)}`);
    if (win.score < MIN_MOTION) {
      state.failed[game.slug] = (state.failed[game.slug] ?? 0) + 1;
      saveState();
      console.log("  ✗ حركة غير كافية — غالباً علِقت في قائمة. سيُعاد لاحقاً أو يُستبعد.");
      return false;
    }
    const hooks = HOOKS[game.categorySlug] ?? HOOKS.casual;
    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    await makeOverlays(game, hook);
    const finalFile = edit(game, rec.file, win.t);
    await sendVideo(game, finalFile, hook);
    state.done.push(game.slug);
    saveState();
    fs.unlinkSync(rec.file);
    console.log(`  ✓ ${finalFile}`);
    return true;
  } catch (err) {
    state.failed[game.slug] = (state.failed[game.slug] ?? 0) + 1;
    saveState();
    console.error(`  ✗ ${err.message}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  let games;
  if (args[0] === "--slug") {
    const g = loadGames().find((x) => x.slug === args[1]);
    if (!g) throw new Error(`game not found: ${args[1]}`);
    games = [g];
  } else {
    const target = Number(args[0] || 3);
    // نجرّب ضعف العدد المطلوب لأن بعضها يفشل
    games = pickGames(target * 2);
    let produced = 0;
    for (const g of games) {
      if (produced >= target) break;
      if (await processGame(g)) produced++;
    }
    console.log(`\nتم إنتاج ${produced} مقاطع → ${OUT_QUEUE}`);
    return;
  }
  for (const g of games) await processGame(g);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
