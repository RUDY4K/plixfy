/**
 * Convert publisher-supplied catalog copy to safe, readable plain text.
 * The site does not render catalog descriptions as Markdown, so leaving its
 * delimiters in place exposes raw **bold** and *italic* markers to readers.
 */
export function cleanCatalogText(value, maxLength = 1200) {
  if (typeof value !== "string") return "";

  const withoutInternalQa = value.split(
    /\s*["']?\[(?:Core Gameplay|Mechanics & Progression|Economy & Customization|Retention & Engagement)\]/i,
  )[0];
  const normalized = withoutInternalQa
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^\s)]+(?:\s+["'][^"']*["'])?\)/g, "$1")
    .replace(/\*{1,3}|_{1,3}|~~|`+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength - 1).trimEnd() + "…";
}
