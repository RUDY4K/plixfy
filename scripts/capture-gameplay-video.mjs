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
    warmup: Math.max(8, Math.min(75, Number(values.warmup || 60))),
    output: path.resolve(
      ROOT,
      String(values.output || path.join("public", "social", "videos", `game-${id}.mp4`)),
    ),
  };
}

function findGame(id) {
  const item = readJson(path.join(ROOT, "src", "data", "playgama-games.json")).find(
    (candidate) => candidate.slug === id,
  );
  if (item) return { ...item, source: "playgama" };
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
    [0.50, 0.90],
    [0.50, 0.62],
    [0.505, 0.55],
    [0.50, 0.34],
    [0.20, 0.12],
    [0.50, 0.72],
    [0.80, 0.80],
    [0.20, 0.80],
    [0.965, 0.028],
  ];
  const [xRatio, yRatio] = points[step % points.length];
  const x = Math.round(CAPTURE_WIDTH * xRatio);
  const y = Math.round(CAPTURE_HEIGHT * yRatio);
  await page.mouse.move(x, y, { steps: 4 }).catch(() => {});
  await page.mouse.click(x, y, { delay: 90 }).catch(() => {});

  const keys = ["Enter", "Space", "ArrowRight", "ArrowUp", "KeyD", "KeyW", "ArrowLeft", "ArrowDown"];
  const key = keys[step % keys.length];
  await page.keyboard.press(key, { delay: 140 }).catch(() => {});
}

async function driveGameplay(page, step) {
  const keys = ["ArrowUp", "ArrowRight", "ArrowUp", "ArrowLeft", "KeyW", "KeyD", "Space", "KeyA"];
  const key = keys[step % keys.length];
  await page.keyboard.press(key, { delay: 180 }).catch(() => {});
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

async function closeGameplayOverlays(page) {
  // Many catalog games finish onboarding with a help/control sheet covering
  // otherwise active gameplay. Close the common top-right dismiss targets
  // before recording, then leave the mouse alone for the whole capture.
  const closePoints = [
    [0.803, 0.105],
    [0.94, 0.08],
    [0.965, 0.028],
  ];
  for (const [xRatio, yRatio] of closePoints) {
    await page.mouse.click(
      Math.round(CAPTURE_WIDTH * xRatio),
      Math.round(CAPTURE_HEIGHT * yRatio),
      { delay: 90 },
    ).catch(() => {});
    await page.waitForTimeout(500);
  }
  await page.keyboard.press("Enter", { delay: 120 }).catch(() => {});
  await page.waitForTimeout(1_500);
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
    "your game is about to continue",
    "playing ad",
    "advertisement",
  ];
  const phrase = blockedPhrases.find((candidate) => text.includes(candidate));
  if (phrase) {
    throw new Error(`Publisher blocked gameplay capture: ${phrase}`);
  }
}

async function assertSiteChromeIsClear(page) {
  const dialogs = page.locator('[role="dialog"]:visible');
  const count = await dialogs.count();
  if (count === 0) return;
  const labels = await dialogs.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("aria-label") || "unlabelled dialog"),
  );
  throw new Error(`Site overlay is still visible in gameplay capture: ${labels.join(", ")}`);
}

async function captureFrames(page, targetDirectory, duration) {
  let sequence = 0;
  const targetFrameGap = 1000 / 10;
  const endAt = Date.now() + duration * 1000;
  let nextActionAt = 0;
  await page.keyboard.down("ArrowUp").catch(() => {});
  while (Date.now() < endAt) {
    const startedAt = Date.now();
    if (sequence >= nextActionAt) {
      await driveGameplay(page, Math.floor(sequence / 7));
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
  await page.keyboard.up("ArrowUp").catch(() => {});
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

async function matchesVerifiedGameplayProfile(gameId, filename) {
  if (gameId !== "mr-racer-car-racing") return false;

  const { data, info } = await sharp(filename)
    .resize(CAPTURE_WIDTH, CAPTURE_HEIGHT, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let yellowPixels = 0;
  let lowerPixels = 0;
  let darkCenterPixels = 0;
  let centerPixels = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      if (y >= info.height * 0.42) {
        lowerPixels += 1;
        if (red > 170 && green > 115 && blue < 105) yellowPixels += 1;
      }
      if (x >= info.width * 0.17 && x <= info.width * 0.86 && y >= info.height * 0.08 && y <= info.height * 0.87) {
        centerPixels += 1;
        if (red < 38 && green < 38 && blue < 48) darkCenterPixels += 1;
      }
    }
  }
  const yellowRatio = yellowPixels / Math.max(1, lowerPixels);
  const darkCenterRatio = darkCenterPixels / Math.max(1, centerPixels);
  return yellowRatio >= 0.08 && darkCenterRatio < 0.45;
}

async function validateCapturedFrames(targetDirectory, frameCount, gameId) {
  const sampleCount = Math.min(12, Math.max(6, Math.floor(frameCount / 8)));
  const indexes = Array.from({ length: sampleCount }, (_, index) =>
    Math.max(1, Math.min(frameCount, Math.round(1 + (index * (frameCount - 1)) / (sampleCount - 1)))),
  );
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
  // Menus and story screens may contain particles or one-off transitions. Real
  // gameplay must keep changing during the latter portion of the recording.
  const latterDifferences = differences.slice(Math.floor(differences.length * 0.35));
  const activeMotion = latterDifferences.filter((difference) => difference >= 4).length;
  const activeRatio = activeMotion / Math.max(1, latterDifferences.length);
  const averageMotion = latterDifferences.reduce((total, value) => total + value, 0) /
    Math.max(1, latterDifferences.length);
  const hasContinuousMotion = activeRatio >= 0.5;
  // Slow driving/puzzle gameplay can have modest per-frame movement while a
  // splash screen only animates a few particles. Require both repeated and
  // substantial motion unless a verified per-game visual profile matches.
  const hasSteadyGameplayMotion = activeRatio >= 0.3 && averageMotion >= 3;
  const hasStrongMotion = activeRatio >= 0.35 && averageMotion >= 8;
  const lastFrame = path.join(targetDirectory, `frame-${String(frameCount).padStart(6, "0")}.jpg`);
  const hasVerifiedGameplayVisual = await matchesVerifiedGameplayProfile(gameId, lastFrame);
  if (!hasContinuousMotion && !hasSteadyGameplayMotion && !hasStrongMotion && !hasVerifiedGameplayVisual) {
    throw new Error(
      `Gameplay capture is still a menu or intro (motion ratio ${activeRatio.toFixed(2)}, average ${averageMotion.toFixed(2)})`,
    );
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
    await page.addInitScript(() => {
      // Site notices are useful for visitors but must never be baked into
      // exported gameplay footage. Record with analytics explicitly rejected.
      localStorage.setItem("gdpr-consent-v1", JSON.stringify({
        choice: "reject",
        timestamp: Date.now(),
      }));
      localStorage.setItem("plixfy-install-prompt-dismissed-at", String(Date.now()));
    });
    const gamePageUrl = `https://www.plixfy.com/play/${game.slug}`;
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
    await closeGameplayOverlays(page);
    await assertSiteChromeIsClear(page);
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
    await validateCapturedFrames(framesDirectory, frameCount, game.slug);
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
