const EMBED_HOST = "https://html5.gamedistribution.com";
const SITE = "https://www.plixfy.com";

/**
 * رابط تضمين لعبة GameDistribution.
 * احتساب الإيراد يتم عبر gd_sdk_referrer_url مع النطاق المسجَّل في لوحة ناشري GD.
 */
export function getGdEmbedUrl(gdId: string, slug: string): string {
  const url = new URL("/" + gdId + "/", EMBED_HOST);
  url.searchParams.set("gd_sdk_referrer_url", SITE + "/play/" + slug);
  return url.toString();
}
