const EMBED_HOST = "https://html5.gamemonetize.co";

/**
 * رابط تضمين لعبة GameMonetize.
 * احتساب الإيراد يتم عبر HTTP referrer لصفحة التضمين مع النطاق
 * المسجَّل في لوحة ناشري GameMonetize — لا يحتاج معرّف ناشر في الرابط.
 */
export function getGmEmbedUrl(gmId: string): string {
  return EMBED_HOST + "/" + gmId + "/";
}
