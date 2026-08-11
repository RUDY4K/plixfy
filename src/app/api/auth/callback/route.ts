import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/profile";
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const nextPath = safeNextPath(url.searchParams.get("next"));
  const localizedPath = locale === "en" ? `/en${nextPath}` : nextPath;
  const supabase = await getServerSupabaseClient();

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(localizedPath, url.origin));
  }

  const authPath = locale === "en" ? "/en/auth" : "/auth";
  return NextResponse.redirect(new URL(`${authPath}?error=callback`, url.origin));
}
