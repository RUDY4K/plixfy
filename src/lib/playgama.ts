const CLID = process.env.NEXT_PUBLIC_PLAYGAMA_CLID;

export function getPlaygamaEmbedUrl(slug: string): string {
  if (!CLID) {
    console.warn("NEXT_PUBLIC_PLAYGAMA_CLID is not set. Using affiliate fallback.");
  }
  const base = "https://playgama.com/export/game/" + slug;
  return CLID ? base + "?clid=" + CLID : base;
}

export function getPlaygamaAffiliateUrl(slug: string): string {
  const base = "https://playgama.com/game/" + slug;
  return CLID ? base + "?clid=" + CLID : base;
}
