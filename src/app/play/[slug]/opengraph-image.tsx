import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getGameBySlug } from "@/lib/games";

export const alt = "Plixfy - العب الآن مجاناً";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

async function loadTajawalBold(): Promise<Buffer> {
  return readFile(join(process.cwd(), "assets/fonts/Tajawal-Bold.ttf"));
}

const BG = "#0D001A";
const CYAN = "#00F0FF";
const INDIGO = "#FF006E";
const PURPLE = "#A100F2";

function titleFontSize(text: string): number {
  const len = text.length;
  if (len <= 12) return 110;
  if (len <= 20) return 88;
  if (len <= 32) return 68;
  if (len <= 45) return 52;
  return 42;
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const tajawal = await loadTajawalBold();
  const { slug } = await params;
  const game = getGameBySlug(slug);

  const gameTitle = game?.title ?? "بليكسفاي";
  const subtitle = game ? "العب الآن مجاناً" : "ألعاب أونلاين مجانية";
  const category = game?.category ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${BG} 0%, #1A0F2E 50%, ${BG} 100%)`,
          position: "relative",
          fontFamily: "Tajawal",
          padding: "60px 80px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: `radial-gradient(circle at center, rgba(255,0,110,0.40) 0%, rgba(255,0,110,0) 70%)`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -250,
            left: -200,
            width: 800,
            height: 800,
            borderRadius: "50%",
            background: `radial-gradient(circle at center, rgba(0,240,255,0.32) 0%, rgba(0,240,255,0) 70%)`,
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 50,
            left: 60,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${CYAN} 0%, ${INDIGO} 50%, ${PURPLE} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 40px rgba(255, 0, 110, 0.40)",
              marginRight: 20,
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: BG,
                display: "flex",
                lineHeight: 1,
              }}
            >
              P
            </div>
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              backgroundImage: `linear-gradient(135deg, ${CYAN} 0%, ${INDIGO} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              display: "flex",
            }}
          >
            بليكسفاي
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            maxWidth: 1040,
          }}
        >
          {category ? (
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: CYAN,
                display: "flex",
                opacity: 0.9,
                marginBottom: 24,
                letterSpacing: 2,
              }}
            >
              {category}
            </div>
          ) : null}

          <div
            style={{
              fontSize: titleFontSize(gameTitle),
              fontWeight: 700,
              backgroundImage: `linear-gradient(135deg, ${CYAN} 0%, ${INDIGO} 60%, ${PURPLE} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              display: "flex",
              lineHeight: 1.15,
              marginBottom: 32,
              textAlign: "center",
              letterSpacing: -1,
            }}
          >
            {gameTitle}
          </div>

          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: "#E5E7EB",
              display: "flex",
              opacity: 0.9,
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Tajawal",
          data: tajawal,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
