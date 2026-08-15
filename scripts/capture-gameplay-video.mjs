// Records original gameplay from a Plixfy catalog game and renders a vertical
// TikTok/Reels video. The browser is intentionally system-provided so GitHub
// Actions does not need to download a second Chromium build on every run.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright-core";
import sharp from "sharp";

const ROOT = process.cwd();
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;
const CAPTURE_WIDTH = 720;
const CAPTURE_HEIGHT = 1280;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function parseArgs() {
  const values = Object.fromEntries(
    process.argv.slice(2).map((entry) => {
      const [key, ...parts] = entry.replace(/^--/, "").split("=");
      return [key, parts.join("=") || true];
    }),
  );
  const id = String(values.id || "");
  if (!id) {
    throw new Error("Usage: node scripts/capture-gameplay-video.mjs --id=game-slug [--output=file.mp4]");
  }
  return {
    id,
    duration: Math.max(10, Math.min(24, Number(values.duration || 15))),
    warmup: Math.max(8, Math.min(45, Number(values.warmup || 35))),
    output: path.resolve(
      ROOT,
      String(values.output || path.join("public", "social", "videos", `game-${id}.mp4`)),
    ),
  };
}

function findGame(id) {
  for (const [name, source] of [
    ["gd-games.json", "gd"],
    ["gm-games.json", "gm"],
  ]) {
    const item = readJson(path.join(ROOT, "src", "data", name)).find(
      (candidate) => candidate.slug === id,
    );
    if (!item) continue;
    if (source === "gd" && item.gdId) {
      return { ...item, source };
    }
    if (source === "gm" && item.gmId) {
      return { ...item, source };
    }
  }
  const source = fs.readFileSync(path.join(ROOT, "src", "lib", "games.ts"), "utf8");
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = source.match(
    new RegExp(`\\{\\s*title:\\s*"([^"]+)",\\s*slug:\\s*"${escapedId}",[\\s\\S]*?thumbnail:\\s*"([^"]+)"[\\s\\S]*?categorySlug:\\s*"([^"]+)"[\\s\\S]*?\\n\\s*\\},`),
  );
  if (block) {
    return {
      title: block[1],
      slug: id,
      thumbnail: block[2],
      categorySlug: block[3],
      source: "playgama",
    };
  }
  throw new Error(`Game was not found or has no recordable embed: ${id}`);
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    process.platform === "win32" ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : "",
    process.platform === "win32" ? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" : "",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const executable = candidates.find((candidate) => fs.existsSync(candidate));
  if (!executable) {
    throw new Error("A system Chrome/Chromium executable was not found. Set CHROME_PATH.");
  }
  return executable;
}

async function tapAndPlay(page, step) {
  const points = [
    [0.965, 0.028],
    [0.505, 0.55],
    [0.50, 0.72],
    [0.50, 0.50],
    [0.30, 0.68],
    [0.70, 0.68],
    [0.50, 0.34],
  ];
  const [xRatio, yRatio] = points[step % points.length];
  const x = Math.round(CAPTURE_WIDTH * xRatio);
  const y = Math.round(CAPTURE_HEIGHT * yRatio);
  await page.mouse.move(x, y, { steps: 4 }).catch(() => {});
  await page.mouse.click(x, y, { delay: 90 }).catch(() => {});

  const keys = ["Escape", "Enter", "Space", "ArrowRight", "ArrowUp", "KeyD", "KeyW", "ArrowLeft"];
  const key = keys[step % keys.length];
  await page.keyboard.press(key, { delay: 140 }).catch(() => {});
}

async function warmUpGame(page, seconds) {
  const endAt = Date.now() + seconds * 1000;
  let step = 0;
  while (Date.now() < endAt) {
    await tapAndPlay(page, step);
    step += 1;
    await page.waitForTimeout(900);
  }
}

async function assertGameIsRecordable(page) {
  const frameTexts = await Promise.all(
    page.frames().map((frame) =>
      frame.locator("body").innerText({ timeout: 2_000 }).catch(() => ""),
    ),
  );
  const text = frameTexts.join(" ").replace(/\s+/g, " ").toLowerCase();
  const blockedPhrases = [
    "is not available here",
    "not available in your region",
    "game is unavailable",
    "access denied",
  ];
  const phrase = blockedPhrases.find((candidate) => text.includes(candidate));
  if (phrase) {
    throw new Error(`Publisher blocked gameplay capture: ${phrase}`);
  }
}

async function captureFrames(page, targetDirectory, duration) {
  let sequence = 0;
  const targetFrameGap = 1000 / 10;
  const endAt = Date.now() + duration * 1000;
  let nextActionAt = 0;
  while (Date.now() < endAt) {
    const startedAt = Date.now();
    if (sequence >= nextActionAt) {
      await tapAndPlay(page, Math.floor(sequence / 7));
      nextActionAt = sequence + 7;
    }
    sequence += 1;
    const filename = path.join(targetDirectory, `frame-${String(sequence).padStart(6, "0")}.jpg`);
    await page.screenshot({
      path: filename,
      type: "jpeg",
      quality: 84,
      animations: "allow",
      timeout: 8_000,
    });
    const remaining = targetFrameGap - (Date.now() - startedAt);
    if (remaining > 0) await page.waitForTimeout(remaining);
  }
  if (sequence < 30) {
    throw new Error(`Gameplay capture produced only ${sequence} frames`);
  }
  return sequence;
}

function startGameAudioCapture(target, duration) {
  const source = process.env.PULSE_SOURCE;
  if (process.platform !== "linux" || !source) return null;

  const child = spawn(
    process.env.FFMPEG_PATH || "ffmpeg",
    [
      "-y",
      "-f", "pulse",
      "-i", source,
      "-t", String(duration),
      "-ac", "2",
      "-ar", "44100",
      "-c:a", "pcm_s16le",
      target,
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  let errorOutput = "";
  child.stderr.on("data", (chunk) => {
    errorOutput = `${errorOutput}${chunk}`.slice(-4000);
  });
  const done = new Promise((resolve) => {
    child.on("error", (error) => resolve({ ok: false, error: error.message }));
    child.on("close", (code) => resolve({
      ok: code === 0 && fs.existsSync(target) && fs.statSync(target).size > 1_000,
      error: code === 0 ? "" : errorOutput,
    }));
  });
  return { child, done, target };
}

async function validateCapturedFrames(targetDirectory, frameCount) {
  const indexes = [1, Math.max(1, Math.floor(frameCount / 2)), frameCount];
  const buffers = [];
  for (const index of indexes) {
    const filename = path.join(targetDirectory, `frame-${String(index).padStart(6, "0")}.jpg`);
    buffers.push(await sharp(filename).resize(48, 48, { fit: "fill" }).greyscale().raw().toBuffer());
  }
  const differences = [];
  for (let index = 1; index < buffers.length; index += 1) {
    let total = 0;
    for (let pixel = 0; pixel < buffers[index].length; pixel += 1) {
      total += Math.abs(buffers[index][pixel] - buffers[index - 1][pixel]);
    }
    differences.push(total / buffers[index].length);
  }
  if (Math.max(...differences) < 1.5) {
    throw new Error("Gameplay capture has too little motion (loading or blocked screen)");
  }

  const lastFrame = path.join(targetDirectory, `frame-${String(frameCount).padStart(6, "0")}.jpg`);
  const { data, info } = await sharp(lastFrame)
    .extract({ left: 0, top: 0, width: 80, height: 80 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let adPixels = 0;
  for (let pixel = 0; pixel < data.length; pixel += info.channels) {
    const red = data[pixel];
    const green = data[pixel + 1];
    const blue = data[pixel + 2];
    if (red > 170 && green > 110 && blue < 100) adPixels += 1;
  }
  if (adPixels > 120) {
    throw new Error("Gameplay capture still contains a publisher video ad");
  }
}

async function buildBrandOverlay(target) {
  const logoFile = path.join(ROOT, "public", "brand", "plixfy-mark-v2.png");
  const logo = await sharp(logoFile).resize(142, 142, { fit: "contain" }).png().toBuffer();
  const text = Buffer.from(`
    <svg width="${OUTPUT_WIDTH}" height="${OUTPUT_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow"><feGaussianBlur stdDeviation="7"/></filter>
        <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
          <stop stop-color="#23dcff"/><stop offset="0.52" stop-color="#bb4cff"/><stop offset="1" stop-color="#ff38b8"/>
        </linearGradient>
      </defs>
      <text x="540" y="1810" text-anchor="middle" fill="#000" opacity="0.82" filter="url(#shadow)" font-family="Arial, sans-serif" font-size="58" font-weight="900" letter-spacing="5">PLIXFY.COM</text>
      <text x="540" y="1810" text-anchor="middle" fill="url(#brand)" stroke="#080410" stroke-width="7" paint-order="stroke fill" font-family="Arial, sans-serif" font-size="58" font-weight="900" letter-spacing="5">PLIXFY.COM</text>
    </svg>`);

  await sharp({
    create: {
      width: OUTPUT_WIDTH,
      height: OUTPUT_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: text, left: 0, top: 0 },
      { input: logo, left: 884, top: 70 },
    ])
    .png()
    .toFile(target);
}

function renderVideo({ framesDirectory, frameCount, overlay, audio, output, duration }) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const inputRate = Math.max(1, frameCount / duration).toFixed(4);
  const filters = [
    `[0:v]scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:force_original_aspect_ratio=increase,crop=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT},setsar=1,fps=30[game]`,
    `[game][1:v]overlay=0:0:format=auto,fade=t=in:st=0:d=0.3,fade=t=out:st=${Math.max(0, duration - 0.4)}:d=0.4,format=yuv420p[outv]`,
  ];
  if (audio) {
    filters.push(
      `[2:a]loudnorm=I=-18:TP=-2:LRA=11,aresample=44100,afade=t=in:st=0:d=0.25,afade=t=out:st=${Math.max(0, duration - 0.5)}:d=0.5[outa]`,
    );
  }
  const filter = filters.join(";");
  const inputs = [
    "-y",
    "-framerate", inputRate,
    "-i", path.join(framesDirectory, "frame-%06d.jpg"),
    "-loop", "1", "-i", overlay,
  ];
  if (audio) inputs.push("-i", audio);
  const audioOptions = audio
    ? ["-map", "[outa]", "-c:a", "aac", "-b:a", "128k"]
    : ["-an"];
  const result = spawnSync(
    process.env.FFMPEG_PATH || "ffmpeg",
    [
      ...inputs,
      "-filter_complex", filter,
      "-map", "[outv]",
      ...audioOptions,
      "-t", String(duration),
      "-r", "30",
      "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-profile:v", "high", "-level", "4.1",
      "-movflags", "+faststart",
      output,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(result.error?.message || `ffmpeg exited with code ${result.status}`);
  }
}

async function main() {
  const args = parseArgs();
  const game = findGame(args.id);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-gameplay-"));
  const framesDirectory = path.join(temporary, "frames");
  const overlay = path.join(temporary, "overlay.png");
  const capturedAudio = path.join(temporary, "game-audio.wav");
  fs.mkdirSync(framesDirectory, { recursive: true });

  const browser = await chromium.launch({
    executablePath: findChrome(),
    headless: true,
    args: [
      "--autoplay-policy=no-user-gesture-required",
      "--disable-dev-shm-usage",
      "--disable-notifications",
      "--hide-scrollbars",
      "--no-sandbox",
    ],
  });

  let frameCount;
  try {
    const context = await browser.newContext({
      viewport: { width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      locale: "en-US",
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
    });
    context.on("page", (popup) => {
      if (popup !== context.pages()[0]) popup.close().catch(() => {});
    });
    const page = await context.newPage();
    page.on("dialog", (dialog) => dialog.dismiss().catch(() => {}));
    const gamePageUrl = `https://www.plixfy.com/ar/play/${game.slug}`;
    await page.goto(gamePageUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const playButton = page.locator(`button[data-game-slug="${game.slug}"]`).first();
    await playButton.waitFor({ state: "visible", timeout: 30_000 });
    // Wait for React hydration; clicking server-rendered markup too early does
    // not trigger GameFrame's client-side start handler.
    await page.waitForTimeout(4_000);
    await playButton.click({ timeout: 15_000 });
    const gameFrame = page.locator("iframe").first();
    await gameFrame.waitFor({ state: "attached", timeout: 30_000 });
    await page.addStyleTag({
      content: `
        html, body { margin: 0 !important; overflow: hidden !important; background: #000 !important; }
        iframe {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          max-width: none !important;
          max-height: none !important;
          z-index: 2147483647 !important;
          background: #000 !important;
        }
      `,
    });
    await gameFrame.evaluate((frame) => {
      frame.setAttribute("loading", "eager");
      frame.scrollIntoView({ block: "center", inline: "center" });
    });
    await warmUpGame(page, args.warmup);
    await assertGameIsRecordable(page);
    const audioCapture = startGameAudioCapture(capturedAudio, args.duration);
    try {
      frameCount = await captureFrames(page, framesDirectory, args.duration);
    } catch (error) {
      audioCapture?.child.kill("SIGTERM");
      throw error;
    }
    if (audioCapture) {
      const audioResult = await audioCapture.done;
      if (!audioResult.ok) {
        console.warn(`[AudioCapture] game audio unavailable; rendering silently: ${audioResult.error}`);
        fs.rmSync(capturedAudio, { force: true });
      }
    }
    await validateCapturedFrames(framesDirectory, frameCount);
    await context.close();
  } finally {
    await browser.close();
  }

  await buildBrandOverlay(overlay);
  renderVideo({
    framesDirectory,
    frameCount,
    overlay,
    audio: fs.existsSync(capturedAudio) ? capturedAudio : null,
    output: args.output,
    duration: args.duration,
  });
  console.log(JSON.stringify({
    id: args.id,
    title: game.title,
    source: game.source,
    frameCount,
    output: args.output,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
