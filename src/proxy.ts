import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const config = {
  // كل المسارات عدا ملفات Next الداخلية وواجهات API والملفات الثابتة ذات الامتداد
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

function isDashboardPath(pathname: string): boolean {
  const stripped = pathname.replace(/^\/(ar|en)(?=\/|$)/, "");
  return stripped === "/dashboard" || stripped.startsWith("/dashboard/");
}

function dashboardAuth(req: NextRequest): NextResponse | null {
  const user = process.env.DASHBOARD_USER?.trim();
  const pass = process.env.DASHBOARD_PASS?.trim();

  if (!user || !pass) {
    return new NextResponse("Not found", { status: 404 });
  }

  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");

  if (scheme === "Basic" && encoded) {
    try {
      const decoded = Buffer.from(encoded, "base64").toString("utf8");
      const idx = decoded.indexOf(":");
      if (idx !== -1) {
        const u = decoded.slice(0, idx);
        const p = decoded.slice(idx + 1);
        const userOk = safeEqual(u, user);
        const passOk = safeEqual(p, pass);
        if (userOk && passOk) {
          return null;
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

/**
 * توجيه اللغات:
 * - العربي (الافتراضي) يبقى بدون بادئة: ‎/play/x → يُعاد كتابته داخليًا إلى ‎/ar/play/x
 * - الإنجليزي تحت ‎/en ويمرّ كما هو
 * - الوصول المباشر لـ ‎/ar/* يُحوَّل 301 للرابط بدون بادئة لمنع المحتوى المكرر
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isDashboardPath(pathname)) {
    const denied = dashboardAuth(req);
    if (denied) return denied;
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return NextResponse.next();
  }

  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    const stripped = pathname === "/ar" ? "/" : pathname.slice(3);
    const url = req.nextUrl.clone();
    url.pathname = stripped;
    return NextResponse.redirect(url, 301);
  }

  const url = req.nextUrl.clone();
  url.pathname = "/ar" + pathname;
  return NextResponse.rewrite(url);
}
