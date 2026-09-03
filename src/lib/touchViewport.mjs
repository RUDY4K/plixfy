/**
 * Decide whether a game should use the touch-first visual viewport player.
 * Kept independent from browser globals so the important iPadOS cases can be
 * covered by unit tests without relying on user-agent emulation.
 *
 * @param {{
 *   userAgent?: string;
 *   platform?: string;
 *   maxTouchPoints?: number;
 *   coarsePointer?: boolean;
 *   screenWidth: number;
 *   screenHeight: number;
 * }} device
 */
export function shouldUseTouchViewportLayer(device) {
  const userAgent = device.userAgent ?? "";
  const platform = device.platform ?? "";
  const maxTouchPoints = device.maxTouchPoints ?? 0;
  const isIPadOS = /iPad/i.test(userAgent)
    || ((/Macintosh/i.test(userAgent) || platform === "MacIntel") && maxTouchPoints > 1);
  const hasMobileUserAgent = /Android|iPhone|iPod|Mobile|Tablet/i.test(userAgent);
  const hasTabletSizedTouchScreen = maxTouchPoints > 0
    && device.coarsePointer === true
    && Math.min(device.screenWidth, device.screenHeight) <= 1024;

  return isIPadOS || hasMobileUserAgent || hasTabletSizedTouchScreen;
}
