const CLID = process.env.NEXT_PUBLIC_PLAYGAMA_CLID;
const HOST = "https://playgama.com";
let didWarnAboutMissingClid = false;

function buildUrl(path: string): string {
  const url = new URL(path, HOST);
  if (CLID) {
    url.searchParams.set("clid", CLID);
  }
  return url.toString();
}

export function getPlaygamaEmbedUrl(slug: string): string {
  if (!CLID && !didWarnAboutMissingClid) {
    didWarnAboutMissingClid = true;
    console.warn("NEXT_PUBLIC_PLAYGAMA_CLID is not set. Using affiliate fallback.");
  }
  return buildUrl("/export/game/" + slug);
}

export function getPlaygamaAffiliateUrl(slug: string): string {
  return buildUrl("/game/" + slug);
}
