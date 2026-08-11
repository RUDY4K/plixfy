import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { getGameBySlug } from "@/lib/games";
import { getNewsBySlug } from "@/lib/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIDTH = 1200;
const HEIGHT = 1200;

async function fetchSourceImage(value: string | undefined): Promise<Buffer | null> {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== "https:") return null;

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": "PlixfySocialCard/1.0 (+https://www.plixfy.com)" },
    });
    if (!response.ok) return null;

    const type = response.headers.get("content-type")?.split(";")[0] || "";
    if (!type.startsWith("image/")) return null;

    const bytes = Buffer.from(await response.arrayBuffer());
    return bytes.length > 0 && bytes.length <= 12 * 1024 * 1024 ? bytes : null;
  } catch {
    return null;
  }
}

function fallbackBackground() {
  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#070712"/>
          <stop offset="0.55" stop-color="#241044"/>
          <stop offset="1" stop-color="#070712"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
    </svg>
  `);
}

function bottomShade() {
  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.58" stop-color="#070712" stop-opacity="0"/>
          <stop offset="1" stop-color="#070712" stop-opacity="0.58"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#shade)"/>
    </svg>
  `);
}

function brandBadge() {
  return Buffer.from(`
    <svg width="412" height="162" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="410" height="160" rx="30" fill="#070712" fill-opacity="0.88" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>
      <text x="166" y="100" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" letter-spacing="3">PLIXFY.COM</text>
    </svg>
  `);
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const kind = query.get("kind");
  const id = query.get("id") || "";

  const game = kind === "game" ? getGameBySlug(id) : undefined;
  const news = kind === "news" ? getNewsBySlug(id) : undefined;
  if (!game && !news) return new Response("Social card not found", { status: 404 });

  const source = game?.thumbnail || news?.image;
  const [logoFile, sourceFile] = await Promise.all([
    readFile(join(process.cwd(), "public/brand/plixfy-mark-v2-compact.png")),
    fetchSourceImage(source),
  ]);

  const base = await sharp(sourceFile || fallbackBackground())
    .rotate()
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
    .jpeg({ quality: 90, chromaSubsampling: "4:4:4" })
    .toBuffer();
  const logo = await sharp(logoFile).resize(126, 126, { fit: "contain" }).png().toBuffer();
  const output = await sharp(base)
    .composite([
      { input: bottomShade(), left: 0, top: 0 },
      { input: brandBadge(), left: 730, top: 980 },
      { input: logo, left: 750, top: 998 },
    ])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  return new Response(new Uint8Array(output), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
