import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const ROOT = process.cwd();
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;

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
  return {
    id: String(values.id || ""),
    output: path.resolve(
      ROOT,
      String(values.output || path.join("public", "social", "videos", "plixfy-news-short.mp4")),
    ),
  };
}

function cleanText(value) {
  return String(value || "")
    .replaceAll("بوسط", "في وسط")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateAtWord(value, max) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return `${text
    .slice(0, max - 1)
    .replace(/\s+\S*$/, "")
    .replace(/[.,،؛:!?؟…]+$/u, "")
    .trim()}…`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function isolateLatin(value) {
  return String(value).replace(
    /[A-Za-z][A-Za-z0-9&.'’:+/-]*(?:\s+[A-Za-z][A-Za-z0-9&.'’:+/-]*)*/g,
    (match) => `\u2066${match}\u2069`,
  );
}

function prepareSpeech(value) {
  const replacements = [
    [/Saber Interactive/gi, "سَيْبَر إنْتِراكتِف"],
    [/Rideshare/gi, "رايد شير"],
    [/PLIXFY\.COM/gi, "بْلِكْسْ فاي"],
    [/بليكسفاي دوت كوم/g, "بْلِكْسْ فاي"],
    [/بليكسفاي/g, "بْلِكْسْ فاي"],
  ];
  return replacements.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    cleanText(value),
  );
}

function wrapWords(text, maxCharacters = 29, maxLines = 4) {
  const words = cleanText(text).split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxCharacters || !line) {
      line = candidate;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  const usedWords = lines.join(" ").split(" ").length;
  if (usedWords < words.length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/…$/, "")}…`;
  }
  return lines;
}

function findNews(id) {
  const news = readJson(path.join(ROOT, "src", "data", "news.json"))
    .filter((item) => item?.slug && item?.title && item?.summary && item?.image)
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
  const item = id ? news.find((candidate) => candidate.slug === id) : news[0];
  if (!item) throw new Error(`News item was not found: ${id}`);
  return item;
}

function buildStory(item) {
  const sentences = cleanText(item.summary)
    .split(/(?<=[.!؟])\s+/)
    .map((sentence) => truncateAtWord(sentence, 145))
    .filter(Boolean);
  const hook = truncateAtWord(item.title, 105);
  const detailOne = sentences[0] || truncateAtWord(item.summary, 140);
  const detailTwo = sentences[1] || "التفاصيل الكاملة تجدونها الآن على موقع بليكسفاي.";
  const beats = [
    { label: "خبر سريع", text: hook },
    { label: "ماذا حدث؟", text: detailOne },
    { label: "أهم التفاصيل", text: detailTwo },
    { label: "تابع الخبر", text: "اقرأ التفاصيل الكاملة على موقع بليكسفاي دوت كوم." },
  ];
  return {
    beats,
    narration: beats
      .map((beat) => prepareSpeech(beat.text).replace(/[.،؛:!?؟…]+$/u, ""))
      .join(". ... "),
  };
}

async function fetchImage(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "PlixfyInfoShort/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`News image returned HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function captionSvg({ label, text, sourceName, index }) {
  const lines = wrapWords(text, index === 0 ? 25 : 29, index === 0 ? 4 : 5);
  const fontSize = index === 0 ? 76 : 66;
  const lineHeight = fontSize * 1.32;
  const firstY = 1385 - ((lines.length - 1) * lineHeight) / 2;
  const textNodes = lines.map((line, lineIndex) =>
    `<text x="540" y="${Math.round(firstY + lineIndex * lineHeight)}" text-anchor="middle" direction="rtl" unicode-bidi="plaintext" fill="#ffffff" font-family="Arial, Tahoma, sans-serif" font-size="${fontSize}" font-weight="800">${escapeXml(isolateLatin(line))}</text>`,
  ).join("");
  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#06030e" stop-opacity="0.18"/>
          <stop offset="0.48" stop-color="#06030e" stop-opacity="0.08"/>
          <stop offset="0.68" stop-color="#06030e" stop-opacity="0.82"/>
          <stop offset="1" stop-color="#06030e" stop-opacity="0.98"/>
        </linearGradient>
        <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
          <stop stop-color="#24dcff"/><stop offset="0.52" stop-color="#b34cff"/><stop offset="1" stop-color="#ff3eb8"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#shade)"/>
      <rect x="62" y="1045" width="956" height="590" rx="46" fill="#080513" fill-opacity="0.72" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2"/>
      <rect x="395" y="1090" width="290" height="64" rx="32" fill="url(#brand)"/>
      <text x="540" y="1135" text-anchor="middle" direction="rtl" unicode-bidi="plaintext" fill="#080513" font-family="Arial, Tahoma, sans-serif" font-size="34" font-weight="900">${escapeXml(label)}</text>
      ${textNodes}
      <text x="540" y="1712" text-anchor="middle" fill="#ffffff" fill-opacity="0.72" font-family="Arial, Tahoma, sans-serif" font-size="29">المصدر: ${escapeXml(sourceName || "Plixfy")}</text>
      <text x="82" y="1818" fill="url(#brand)" font-family="Arial, sans-serif" font-size="48" font-weight="900" letter-spacing="3">PLIXFY.COM</text>
      <text x="998" y="1818" text-anchor="end" fill="#ffffff" fill-opacity="0.55" font-family="Arial, sans-serif" font-size="28">${index + 1} / 4</text>
    </svg>`);
}

async function buildScene({ source, logo, beat, sourceName, index, target }) {
  const background = await sharp(source)
    .resize(WIDTH, HEIGHT, { fit: "cover" })
    .modulate({ saturation: 1.08, brightness: 0.74 })
    .sharpen(0.8)
    .png()
    .toBuffer();
  const mark = await sharp(logo).resize(126, 126, { fit: "contain" }).png().toBuffer();
  await sharp(background)
    .composite([
      { input: captionSvg({ ...beat, sourceName, index }), left: 0, top: 0 },
      { input: mark, left: 884, top: 62 },
    ])
    .png()
    .toFile(target);
}

function synthesizeVoice(text, target) {
  if (process.platform === "win32" && process.env.PLIXFY_LOCAL_TTS === "true") {
    const result = spawnSync(
      process.env.PWSH_PATH || "pwsh",
      [
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", path.join(ROOT, "scripts", "synthesize-arabic.ps1"),
        "-Text", text,
        "-Output", target,
        "-Rate", "1",
      ],
      { cwd: ROOT, stdio: "inherit" },
    );
    if (result.status === 0) return;
    console.warn("Arabic Windows voice is unavailable; using Microsoft Edge online TTS.");
  }
  const python = process.platform === "win32" ? "python" : "python3";
  const result = spawnSync(
    python,
    [
      "-m", "edge_tts",
      "--voice", "ar-EG-SalmaNeural",
      "--rate=-2%",
      "--pitch=+0Hz",
      "--text", text,
      "--write-media", target,
    ],
    { cwd: ROOT, stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error("edge-tts is required to generate the Arabic voiceover");
  }
}

function mediaDuration(file) {
  const result = spawnSync(
    process.env.FFPROBE_PATH || "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file],
    { encoding: "utf8" },
  );
  const duration = Number(result.stdout.trim());
  if (result.status !== 0 || !Number.isFinite(duration) || duration <= 0) {
    throw new Error("Could not determine voiceover duration");
  }
  return duration;
}

function sceneDurations(beats, duration) {
  const weights = beats.map((beat) => Math.max(5, cleanText(beat.text).split(" ").length));
  const total = weights.reduce((sum, value) => sum + value, 0);
  return weights.map((weight) => (duration * weight) / total);
}

function renderVideo({ scenes, audio, output, duration, durations }) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const inputs = [];
  const filters = [];
  scenes.forEach((scene, index) => {
    inputs.push("-i", scene);
    const frames = Math.max(1, Math.ceil(durations[index] * FPS));
    const zoom = index % 2 === 0 ? "min(zoom+0.00035,1.08)" : "if(eq(on,1),1.08,max(zoom-0.0003,1.0))";
    filters.push(
      `[${index}:v]scale=1200:2134,zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${WIDTH}x${HEIGHT}:fps=${FPS},setsar=1,format=yuv420p[v${index}]`,
    );
  });
  filters.push(`${scenes.map((_, index) => `[v${index}]`).join("")}concat=n=${scenes.length}:v=1:a=0,fade=t=in:st=0:d=0.25,fade=t=out:st=${Math.max(0, duration - 0.35).toFixed(2)}:d=0.35[outv]`);
  filters.push(`[${scenes.length}:a]loudnorm=I=-16:TP=-1.5:LRA=7,aresample=48000,afade=t=in:st=0:d=0.15,afade=t=out:st=${Math.max(0, duration - 0.3).toFixed(2)}:d=0.3[outa]`);
  const result = spawnSync(
    process.env.FFMPEG_PATH || "ffmpeg",
    [
      "-y",
      ...inputs,
      "-i", audio,
      "-filter_complex", filters.join(";"),
      "-map", "[outv]", "-map", "[outa]",
      "-t", duration.toFixed(3),
      "-r", String(FPS),
      "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-profile:v", "high", "-level", "4.1",
      "-c:a", "aac", "-b:a", "128k",
      "-movflags", "+faststart",
      output,
    ],
    { cwd: ROOT, stdio: "inherit" },
  );
  if (result.status !== 0) throw new Error(`ffmpeg exited with code ${result.status}`);
}

async function main() {
  const args = parseArgs();
  const item = findNews(args.id);
  const story = buildStory(item);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-info-short-"));
  const source = await fetchImage(item.image);
  const logo = path.join(ROOT, "public", "brand", "plixfy-mark-v2.png");
  const scenes = [];
  for (let index = 0; index < story.beats.length; index += 1) {
    const target = path.join(temporary, `scene-${index + 1}.png`);
    await buildScene({
      source,
      logo,
      beat: story.beats[index],
      sourceName: item.sourceName,
      index,
      target,
    });
    scenes.push(target);
  }
  const audio = path.join(temporary, "voice.mp3");
  synthesizeVoice(story.narration, audio);
  const duration = mediaDuration(audio) + 0.35;
  const durations = sceneDurations(story.beats, duration);
  renderVideo({ scenes, audio, output: args.output, duration, durations });
  console.log(JSON.stringify({
    id: item.slug,
    title: item.title,
    duration,
    output: args.output,
    narration: story.narration,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
