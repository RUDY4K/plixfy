import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getGameBySlug } from "@/lib/games";
import { getNewsBySlug } from "@/lib/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIDTH = 1200;
const HEIGHT = 1200;

async function fetchImageDataUrl(value: string | undefined): Promise<string | null> {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;

    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": "PlixfySocialCard/2.0 (+https://www.plixfy.com)" },
    });
    if (!response.ok) return null;

    const type = response.headers.get("content-type")?.split(";")[0] || "";
    if (!type.startsWith("image/")) return null;

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 12 * 1024 * 1024) return null;
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

async function getLogoDataUrl(): Promise<string> {
  const logo = await readFile(join(process.cwd(), "public/brand/plixfy-mark-v2-compact.png"));
  return `data:image/png;base64,${logo.toString("base64")}`;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const kind = query.get("kind");
  const id = query.get("id") || "";

  const game = kind === "game" ? getGameBySlug(id) : undefined;
  const news = kind === "news" ? getNewsBySlug(id) : undefined;
  if (!game && !news) return new Response("Social card not found", { status: 404 });

  const [sourceImage, logo] = await Promise.all([
    fetchImageDataUrl(game?.thumbnailWide || game?.thumbnail || news?.image),
    getLogoDataUrl(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "linear-gradient(135deg, #070712 0%, #241044 55%, #070712 100%)",
        }}
      >
        {sourceImage ? (
          <img
            alt=""
            src={sourceImage}
            width={WIDTH}
            height={HEIGHT}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            right: 58,
            bottom: 50,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <img alt="Plixfy" src={logo} width={118} height={118} style={{ objectFit: "contain" }} />
          <div
            style={{
              display: "flex",
              color: "white",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 42,
              fontWeight: 900,
              letterSpacing: 3,
              textShadow: "0 3px 2px #070712, 0 0 12px #070712, 0 0 24px #070712",
            }}
          >
            PLIXFY.COM
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
