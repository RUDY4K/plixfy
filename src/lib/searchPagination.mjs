export const SEARCH_PAGE_SIZE = 48;

const ARABIC_TITLE_ALIASES = new Map([
  ["سيارات", /\bcars?\b/],
  ["شطرنج", /\bchess/],
]);

/**
 * @template {{ title: string, category: string }} T
 * @param {readonly T[]} games
 * @param {string} query
 * @param {string} locale
 * @returns {T[]}
 */
export function filterSearchResults(games, query, locale) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  if (locale === "en" && needle === "car") {
    return games.filter((game) => /\bcars?\b/.test(game.title.toLowerCase()));
  }
  const titleAlias = locale === "ar" ? ARABIC_TITLE_ALIASES.get(needle) ?? null : null;

  return games.filter((game) => {
    const title = game.title.toLowerCase();
    return title.includes(needle)
      || game.category.toLowerCase().includes(needle)
      || (titleAlias !== null && titleAlias.test(title));
  });
}

/**
 * @template T
 * @param {T[]} results
 * @param {number} requestedPage
 * @returns {{ currentPage: number, totalPages: number, items: T[] } | null}
 */
export function paginateSearchResults(results, requestedPage) {
  const totalPages = Math.max(1, Math.ceil(results.length / SEARCH_PAGE_SIZE));
  if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > totalPages) {
    return null;
  }

  const start = (requestedPage - 1) * SEARCH_PAGE_SIZE;
  return {
    currentPage: requestedPage,
    totalPages,
    items: results.slice(start, start + SEARCH_PAGE_SIZE),
  };
}
