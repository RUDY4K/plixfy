/**
 * Convert publisher-supplied catalog copy to safe, readable plain text.
 * The site does not render catalog descriptions as Markdown, so leaving its
 * delimiters in place exposes raw **bold** and *italic* markers to readers.
 */
export function cleanCatalogText(value, maxLength = 1200) {
  if (typeof value !== "string") return "";

  const withoutInternalQa = value.split(
    /\s*["']?\[?(?:Core Gameplay(?:\s*&\s*Story)?|Mechanics\s*&\s*Progression|Economy\s*&\s*Customization|Retention\s*&\s*Engagement)\]?(?=\s*(?:Q:|$))/i,
  )[0];
  const normalized = withoutInternalQa
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^\s)]+(?:\s+["'][^"']*["'])?\)/g, "$1")
    .replace(/\*{1,3}|_{1,3}|~~|`+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const seenSentences = new Set();
  const deduplicated = normalized
    .split(/(?<=[.!?؟…])\s+/u)
    .filter((sentence) => {
      const key = sentence.toLocaleLowerCase().replace(/\s+/g, " ").trim();
      if (!key || seenSentences.has(key)) return false;
      seenSentences.add(key);
      return true;
    })
    .join(" ");

  if (deduplicated.length <= maxLength) return deduplicated;
  return deduplicated.slice(0, maxLength - 1).trimEnd() + "…";
}
