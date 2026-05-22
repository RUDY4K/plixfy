import type { GameMeta, GamePlatform } from '@/types/game';

/**
 * Rules-based mobile/desktop classifier. Runs at registry-merge time
 * over every game's metadata. Order matters — first matching rule wins.
 *
 *   1. Plixfy Originals (custom)  → 'all'  (built mobile-first)
 *   2. .io games                  → 'all'  (publishers ship touch controls)
 *   3. Explicit keyword tags      → mobile|desktop
 *   4. Controls string parsing    → touch ⇒ mobile, keyboard-only ⇒ desktop
 *   5. Provider preferences       → onlinegames.io ⇒ mobile (most are responsive)
 *   6. Mobile-leaning categories  → puzzle/casual/girls/cooking/word/board/clicker
 *   7. Mouse-only controls        → 'all'  (mouse + tap usually map cleanly)
 *   8. Fallback                   → 'unknown'  (shows on mobile with a badge)
 */

const MOBILE_KEYWORDS = new Set([
  'mobile', 'touch', 'tap', 'swipe', 'casual', 'hyper-casual', 'hypercasual',
]);

const DESKTOP_KEYWORDS = new Set([
  'keyboard', 'keyboard-only', 'mouse-only', 'pc-only', 'desktop', 'desktop-only',
]);

const MOBILE_LEANING_CATEGORIES = new Set([
  'puzzle', 'casual', 'girls', 'cooking', 'word', 'board', 'clicker',
]);

const MOBILE_FRIENDLY_PROVIDERS = new Set(['onlinegames']);

function controlsMentionTouch(controls: string): boolean {
  return /\b(touch|tap|swipe|finger)\b/i.test(controls);
}

function controlsAreKeyboardOnly(controls: string): boolean {
  // Has WASD or Arrow keys AND no mention of mouse/touch/pointer.
  const hasKeyboard = /\b(wasd|arrow keys|arrows|space|enter|shift|keyboard)\b/i.test(controls);
  const hasPointer = /\b(mouse|touch|tap|click|pointer|swipe)\b/i.test(controls);
  return hasKeyboard && !hasPointer;
}

function controlsAreMouseOnly(controls: string): boolean {
  return /\bmouse\b/i.test(controls) && !/\b(wasd|arrow keys|arrows|keyboard|touch|swipe|tap)\b/i.test(controls);
}

export function classifyPlatform(game: GameMeta): GamePlatform {
  // 1. Plixfy Originals — we wrote them, we know they're responsive.
  if (game.kind === 'custom') return 'all';

  // 2. .io category is overwhelmingly mobile-friendly across publishers.
  if (game.category === 'io') return 'all';

  // 3. Explicit keyword tags win over heuristics.
  const kw = game.keywords.map((k) => k.toLowerCase());
  if (kw.some((k) => DESKTOP_KEYWORDS.has(k))) return 'desktop';
  if (kw.some((k) => MOBILE_KEYWORDS.has(k))) return 'mobile';

  // 4. Controls string parsing.
  const controls = game.controls || '';
  if (controlsMentionTouch(controls)) return 'mobile';
  if (controlsAreKeyboardOnly(controls)) return 'desktop';

  // 5. Provider preferences.
  if (MOBILE_FRIENDLY_PROVIDERS.has(game.provider)) return 'mobile';

  // 6. Mobile-leaning categories.
  if (MOBILE_LEANING_CATEGORIES.has(game.category)) return 'mobile';

  // 7. Mouse-only games usually work via tap.
  if (controlsAreMouseOnly(controls)) return 'all';

  // 8. We can't tell — surface on mobile with a "Best on desktop" hint.
  return 'unknown';
}

/**
 * Mobile-visibility predicate. Mirrors the rule the HomeGrid filter
 * uses: `desktop` is hidden, everything else passes.
 */
export function isVisibleOnMobile(platform: GamePlatform): boolean {
  return platform !== 'desktop';
}

/**
 * Strict "mobile-only" predicate for the "📱 Mobile-friendly only" toggle.
 * Drops `unknown` too — we only show what we're confident about.
 */
export function isStrictlyMobile(platform: GamePlatform): boolean {
  return platform === 'mobile' || platform === 'all';
}
