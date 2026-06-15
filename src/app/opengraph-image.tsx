import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Plixfy - بليكسفاي - ألعاب أونلاين مجانية";
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

export default async function Image() {
  const tajawal = await loadTajawalBold();

  const title = "بليكسفاي";
  const subtitle = "ألعاب أونلاين مجانية";

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
            width: 180,
            height: 180,
            borderRadius: 40,
            background: `linear-gradient(135deg, ${CYAN} 0%, ${INDIGO} 50%, ${PURPLE} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 80px rgba(255, 0, 110, 0.45)",
            marginBottom: 52,
          }}
        >
          <div
            style={{
              fontSize: 140,
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
            fontSize: 110,
            fontWeight: 700,
            backgroundImage: `linear-gradient(135deg, ${CYAN} 0%, ${INDIGO} 100%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            display: "flex",
            lineHeight: 1.1,
            marginBottom: 20,
            letterSpacing: -2,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "#E5E7EB",
            display: "flex",
            opacity: 0.85,
          }}
        >
          {subtitle}
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
