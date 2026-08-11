import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const ROOT = process.cwd();
const WIDTH = 1080;
const HEIGHT = 1920;
const DEFAULT_DURATION = 12;

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
  const kind = String(values.kind || "game");
  const id = String(values.id || "");
  if (!id || !["game", "news"].includes(kind)) {
    throw new Error("Usage: node scripts/generate-social-video.mjs --kind=game|news --id=slug [--output=file.mp4]");
  }
  return {
    kind,
    id,
    duration: Math.max(6, Math.min(30, Number(values.duration || DEFAULT_DURATION))),
    output: path.resolve(
      ROOT,
      String(values.output || path.join("public", "social", "videos", `${kind}-${id}.mp4`)),
    ),
  };
}

function findContent(kind, id) {
  if (kind === "news") {
    const item = readJson(path.join(ROOT, "src", "data", "news.json")).find(
      (candidate) => candidate.slug === id,
    );
    if (!item?.image) throw new Error(`News item has no source image: ${id}`);
    return { title: item.title, image: item.image };
  }

  for (const name of ["gd-games.json", "gm-games.json"]) {
    const item = readJson(path.join(ROOT, "src", "data", name)).find(
      (candidate) => candidate.slug === id,
    );
    if (item?.thumbnail) return { title: item.title, image: item.thumbnail };
  }
  throw new Error(`Game was not found: ${id}`);
}

async function fetchImage(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "PlixfySocialVideo/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Source image returned HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function roundedMask(width, height, radius) {
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" rx="${radius}" fill="white"/></svg>`,
  );
}

async function buildFrame(source, target) {
  const background = await sharp(source)
    .resize(WIDTH, HEIGHT, { fit: "cover" })
    .blur(34)
    .modulate({ saturation: 1.1, brightness: 0.62 })
    .png()
    .toBuffer();

  const foregroundWidth = 972;
  const foregroundHeight = 1240;
  const foreground = await sharp(source)
    .resize(foregroundWidth, foregroundHeight, {
      fit: "contain",
      background: { r: 5, g: 4, b: 18, alpha: 1 },
    })
    .composite([{ input: roundedMask(foregroundWidth, foregroundHeight, 44), blend: "dest-in" }])
    .png()
    .toBuffer();

  const shade = Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#070313" stop-opacity="0.78"/>
          <stop offset="0.24" stop-color="#070313" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.58" stop-color="#070313" stop-opacity="0"/>
          <stop offset="1" stop-color="#070313" stop-opacity="0.92"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#top)"/>
      <rect width="100%" height="100%" fill="url(#bottom)"/>
      <rect x="54" y="286" width="972" height="1240" rx="44" fill="none" stroke="#21d9ff" stroke-opacity="0.42" stroke-width="5"/>
    </svg>`);

  await sharp(background)
    .composite([
      { input: foreground, left: 54, top: 286 },
      { input: shade, left: 0, top: 0 },
    ])
    .png()
    .toFile(target);
}

async function buildBrandOverlay(target) {
  const logoFile = path.join(ROOT, "public", "brand", "plixfy-mark-v2.png");
  const logo = await sharp(logoFile).resize(154, 154, { fit: "contain" }).png().toBuffer();
  const panel = Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#0b061c" stop-opacity="0.94"/>
          <stop offset="1" stop-color="#140829" stop-opacity="0.88"/>
        </linearGradient>
        <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
          <stop stop-color="#00e5ff"/><stop offset="0.5" stop-color="#a800ff"/><stop offset="1" stop-color="#ff22b8"/>
        </linearGradient>
      </defs>
      <rect x="72" y="1628" width="936" height="218" rx="48" fill="url(#panel)" stroke="#ffffff" stroke-opacity="0.10" stroke-width="2"/>
      <rect x="120" y="1800" width="760" height="7" rx="4" fill="url(#line)"/>
      <text x="138" y="1756" fill="#ffffff" font-family="Oxanium, Arial, sans-serif" font-weight="700" font-size="58" letter-spacing="4">PLIXFY.COM</text>
    </svg>`);

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: panel, left: 0, top: 0 },
      { input: logo, left: 820, top: 1660 },
    ])
    .png()
    .toFile(target);
}

function renderVideo({ frame, overlay, output, duration }) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const frames = Math.round(duration * 30);
  const filter = [
    `[0:v]scale=1200:2134,zoompan=z='min(zoom+0.00022,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${WIDTH}x${HEIGHT}:fps=30,setsar=1,format=yuv420p[scene]`,
    `[scene][1:v]overlay=0:0:format=auto,fade=t=in:st=0:d=0.45,fade=t=out:st=${Math.max(0, duration - 0.55)}:d=0.55,format=yuv420p[outv]`,
    `[2:a]volume=0.025,afade=t=in:st=0:d=0.7,afade=t=out:st=${Math.max(0, duration - 0.8)}:d=0.8[outa]`,
  ].join(";");
  const result = spawnSync(
    process.env.FFMPEG_PATH || "ffmpeg",
    [
      "-y",
      "-loop", "1", "-i", frame,
      "-loop", "1", "-i", overlay,
      "-f", "lavfi", "-i", `aevalsrc=0.55*sin(2*PI*110*t)+0.20*sin(2*PI*220*t):s=44100:d=${duration}`,
      "-filter_complex", filter,
      "-map", "[outv]", "-map", "[outa]",
      "-t", String(duration),
      "-r", "30",
      "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-profile:v", "high", "-level", "4.1",
      "-c:a", "aac", "-b:a", "96k",
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
  const content = findContent(args.kind, args.id);
  const source = await fetchImage(content.image);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-video-"));
  const frame = path.join(temporary, "frame.png");
  const overlay = path.join(temporary, "overlay.png");
  await buildFrame(source, frame);
  await buildBrandOverlay(overlay);
  renderVideo({ frame, overlay, output: args.output, duration: args.duration });
  console.log(JSON.stringify({ ...args, title: content.title, frame, overlay }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
