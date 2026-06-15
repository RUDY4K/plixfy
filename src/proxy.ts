import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function proxy(req: NextRequest) {
  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASS;

  if (!user || !pass) {
    return new NextResponse("Dashboard auth not configured", { status: 503 });
  }

  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");

  if (scheme === "Basic" && encoded) {
    try {
      const decoded = atob(encoded);
      const idx = decoded.indexOf(":");
      if (idx !== -1) {
        const u = decoded.slice(0, idx);
        const p = decoded.slice(idx + 1);
        if (timingSafeEqual(u, user) && timingSafeEqual(p, pass)) {
          return NextResponse.next();
        }
      }
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Plixfy Dashboard", charset="UTF-8"',
    },
  });
}
