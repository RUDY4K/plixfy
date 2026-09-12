export interface PageSnapshot extends Record<string, unknown> {
  page_path: string;
  page_location: string;
  page_title: string;
  page_referrer?: string;
}

export function buildPageSnapshot(
  pathname: string,
  query: string,
  location: string,
  title: string,
  referrer = "",
): PageSnapshot {
  return {
    page_path: query ? `${pathname}?${query}` : pathname,
    page_location: location,
    page_title: title,
    ...(referrer ? { page_referrer: referrer } : {}),
  };
}

export function pageViewsAfterConsent(
  landing: PageSnapshot | null,
  current: PageSnapshot,
): PageSnapshot[] {
  if (!landing) return [current];
  if (landing.page_location === current.page_location) return [landing];
  return [landing, current];
}
