export const SEARCH_PAGE_SIZE = 48;

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
