/**
 * @param {string} pathname
 * @param {string} href
 */
export function isBottomNavActive(pathname, href) {
  const visiblePathname =
    pathname === "/ar"
      ? "/"
      : pathname.startsWith("/ar/")
        ? pathname.slice(3)
        : pathname;

  if (href === "/" || href === "/en") {
    return visiblePathname === href;
  }
  return visiblePathname === href || visiblePathname.startsWith(href + "/");
}
