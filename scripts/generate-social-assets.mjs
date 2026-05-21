import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const outDir = join(repoRoot, 'public', 'social');
mkdirSync(outDir, { recursive: true });

const BG = '#0B0F1A';
const CYAN = '#00C8FF';
const PINK = '#FF3366';
const INK = '#E6F3FF';
const MUTED = '#7A8AA0';

// Reusable Plixfy P-icon (viewBox 0 0 64 64) — matches public/logo-icon.svg
function plixfyIcon({ scale = 1, glow = true } = {}) {
  const filter = glow
    ? `<filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
         <feGaussianBlur stdDeviation="${1.4 * scale}" result="blur"/>
         <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
       </filter>`
    : '';
  const filterAttr = glow ? ' filter="url(#glow)"' : '';
  return `
    <defs>${filter}</defs>
    <g${filterAttr}>
      <path d="M18 12h18a12 12 0 0 1 0 24H26v16h-8V12z" fill="${CYAN}"/>
      <path d="M26 20h10a4 4 0 0 1 0 8H26z" fill="${BG}"/>
      <path d="M28 21.5 L34 24 L28 26.5 Z" fill="${PINK}"/>
    </g>`;
}

// Subtle gaming-grid background pattern
function gridPattern(id = 'grid', stroke = '#1A2438', step = 40) {
  return `
    <pattern id="${id}" width="${step}" height="${step}" patternUnits="userSpaceOnUse">
      <path d="M ${step} 0 L 0 0 0 ${step}" fill="none" stroke="${stroke}" stroke-width="1"/>
    </pattern>`;
}

// Floating gamepad / pixel shapes for background
function gamingShapes(width, height, count = 14) {
  let out = '';
  // deterministic pseudo-random so output is reproducible
  let seed = 1337;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < count; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const size = 8 + rand() * 22;
    const shape = Math.floor(rand() * 3);
    const color = rand() > 0.5 ? CYAN : PINK;
    const opacity = 0.04 + rand() * 0.08;
    if (shape === 0) {
      // pixel square
      out += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" opacity="${opacity}" transform="rotate(${rand() * 45} ${x + size/2} ${y + size/2})"/>`;
    } else if (shape === 1) {
      // triangle (play arrow)
      out += `<polygon points="${x},${y} ${x + size},${y + size/2} ${x},${y + size}" fill="${color}" opacity="${opacity}"/>`;
    } else {
      // ring
      out += `<circle cx="${x}" cy="${y}" r="${size/2}" fill="none" stroke="${color}" stroke-width="2" opacity="${opacity}"/>`;
    }
  }
  return out;
}

async function svgToPng(svg, width, height, outPath) {
  const png = await sharp(Buffer.from(svg), { density: 288 })
    .resize(width, height, { fit: 'cover' })
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();
  writeFileSync(outPath, png);
  console.log(`  wrote ${outPath} (${(png.length / 1024).toFixed(1)} KB)`);
}

// ── 1. PROFILE PICTURE (400x400) ─────────────────────────────────────
async function profile400() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="${BG}"/>
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.18"/>
        <stop offset="60%" stop-color="${CYAN}" stop-opacity="0.04"/>
        <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
      </radialGradient>
      <filter id="iconGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="400" height="400" fill="url(#bgGlow)"/>
    <g transform="translate(80 80) scale(3.75)" filter="url(#iconGlow)">
      <path d="M18 12h18a12 12 0 0 1 0 24H26v16h-8V12z" fill="${CYAN}"/>
      <path d="M26 20h10a4 4 0 0 1 0 8H26z" fill="${BG}"/>
      <path d="M28 21.5 L34 24 L28 26.5 Z" fill="${PINK}"/>
    </g>
  </svg>`;
  await svgToPng(svg, 400, 400, join(outDir, 'profile-400.png'));
}

// ── 3. INSTAGRAM PROFILE PIC (400x400, extra padding for circle crop) ─
async function instagramProfile() {
  // Circle crop on Instagram clips ~13% off each side. Shrink icon further.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="${BG}"/>
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.22"/>
        <stop offset="55%" stop-color="${CYAN}" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
      </radialGradient>
      <filter id="iconGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="400" height="400" fill="url(#bgGlow)"/>
    <!-- Icon ~50% of canvas (vs 60% above) so circle crop never touches it -->
    <g transform="translate(110 110) scale(2.8125)" filter="url(#iconGlow)">
      <path d="M18 12h18a12 12 0 0 1 0 24H26v16h-8V12z" fill="${CYAN}"/>
      <path d="M26 20h10a4 4 0 0 1 0 8H26z" fill="${BG}"/>
      <path d="M28 21.5 L34 24 L28 26.5 Z" fill="${PINK}"/>
    </g>
  </svg>`;
  await svgToPng(svg, 400, 400, join(outDir, 'instagram-profile.png'));
}

// ── 2. X/TWITTER BANNER (1500x500) ────────────────────────────────────
async function twitterBanner() {
  // Vertical lockup: icon stacked above wordmark, tagline below, domain at base.
  // Stays inside X's mobile safe zone (~middle 1100px is always visible).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 500">
    <defs>
      ${gridPattern('bannerGrid', '#141C2E', 50)}
      <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="vignette" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${BG}" stop-opacity="1"/>
        <stop offset="15%" stop-color="${BG}" stop-opacity="0"/>
        <stop offset="85%" stop-color="${BG}" stop-opacity="0"/>
        <stop offset="100%" stop-color="${BG}" stop-opacity="1"/>
      </linearGradient>
      <filter id="iconGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="wmGlow" x="-10%" y="-30%" width="120%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="1500" height="500" fill="${BG}"/>
    <rect width="1500" height="500" fill="url(#bannerGrid)"/>
    ${gamingShapes(1500, 500, 26)}
    <rect width="1500" height="500" fill="url(#centerGlow)"/>
    <rect width="1500" height="500" fill="url(#vignette)"/>

    <!-- Icon centered, 96px (scale 1.5 over 64 viewBox) -->
    <g transform="translate(702 60) scale(1.5)" filter="url(#iconGlow)">
      <path d="M18 12h18a12 12 0 0 1 0 24H26v16h-8V12z" fill="${CYAN}"/>
      <path d="M26 20h10a4 4 0 0 1 0 8H26z" fill="${BG}"/>
      <path d="M28 21.5 L34 24 L28 26.5 Z" fill="${PINK}"/>
    </g>

    <!-- Wordmark "Plixfy" — center anchored at x=750, baseline y=290 -->
    <!-- Original viewBox 260x64 wordmark, scale 2.31 → ~600px wide, ~148px tall -->
    <!-- Use a single-text wordmark with i-stem replacement -->
    <g filter="url(#wmGlow)">
      <g font-family="'Segoe UI', system-ui, -apple-system, Roboto, sans-serif"
         font-weight="900" font-size="130" fill="${CYAN}" letter-spacing="-3">
        <text x="478" y="300">Pl</text>
        <text x="608" y="300">xfy</text>
      </g>
      <!-- i-stem replacing the dotless 'i' between "Pl" and "xfy" -->
      <rect x="585" y="234" width="20" height="66" fill="${CYAN}"/>
      <!-- pink pixel dot above the stem -->
      <rect x="585" y="204" width="20" height="20" fill="${PINK}"/>
    </g>

    <!-- Tagline -->
    <text x="750" y="385" text-anchor="middle"
          font-family="'Segoe UI', system-ui, -apple-system, Roboto, sans-serif"
          font-weight="600" font-size="38" fill="${INK}" letter-spacing="2">
      5,000+ FREE BROWSER GAMES
    </text>

    <!-- Accent line -->
    <rect x="640" y="410" width="220" height="3" fill="${CYAN}" opacity="0.5"/>

    <!-- Domain -->
    <text x="750" y="455" text-anchor="middle"
          font-family="'Segoe UI', system-ui, -apple-system, Roboto, sans-serif"
          font-weight="500" font-size="22" fill="${MUTED}" letter-spacing="4">
      PLIXFY.COM
    </text>
  </svg>`;
  await svgToPng(svg, 1500, 500, join(outDir, 'twitter-banner.png'));
}

// ── 4. INSTAGRAM LAUNCH POST (1080x1080) ──────────────────────────────
async function instagramLaunchPost() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
    <defs>
      ${gridPattern('iGrid', '#141C2E', 60)}
      <radialGradient id="hero" cx="50%" cy="35%" r="55%">
        <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.22"/>
        <stop offset="60%" stop-color="${CYAN}" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${BG}" stop-opacity="0"/>
        <stop offset="100%" stop-color="${BG}" stop-opacity="0.95"/>
      </linearGradient>
      <filter id="bigGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="textGlow" x="-10%" y="-30%" width="120%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="1080" height="1080" fill="${BG}"/>
    <rect width="1080" height="1080" fill="url(#iGrid)"/>
    ${gamingShapes(1080, 1080, 28)}
    <rect width="1080" height="1080" fill="url(#hero)"/>
    <rect width="1080" height="1080" fill="url(#bottomFade)"/>

    <!-- Icon centered up top -->
    <g transform="translate(450 130) scale(2.8125)" filter="url(#bigGlow)">
      <path d="M18 12h18a12 12 0 0 1 0 24H26v16h-8V12z" fill="${CYAN}"/>
      <path d="M26 20h10a4 4 0 0 1 0 8H26z" fill="${BG}"/>
      <path d="M28 21.5 L34 24 L28 26.5 Z" fill="${PINK}"/>
    </g>

    <!-- "LIVE" badge -->
    <g transform="translate(540 410)">
      <rect x="-90" y="-26" width="180" height="52" rx="26" fill="${PINK}"/>
      <circle cx="-58" cy="0" r="8" fill="${INK}">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <text x="-40" y="10" font-family="'Segoe UI', system-ui, sans-serif"
            font-weight="900" font-size="26" fill="${INK}" letter-spacing="3">NOW LIVE</text>
    </g>

    <!-- Main headline -->
    <text x="540" y="555" text-anchor="middle" filter="url(#textGlow)"
          font-family="'Segoe UI', system-ui, -apple-system, Roboto, sans-serif"
          font-weight="900" font-size="128" fill="${CYAN}" letter-spacing="-3">
      Plixfy is
    </text>
    <text x="540" y="685" text-anchor="middle" filter="url(#textGlow)"
          font-family="'Segoe UI', system-ui, -apple-system, Roboto, sans-serif"
          font-weight="900" font-size="128" fill="${INK}" letter-spacing="-3">
      LIVE!
    </text>

    <!-- Stats row -->
    <g transform="translate(540 800)" text-anchor="middle"
       font-family="'Segoe UI', system-ui, sans-serif" fill="${INK}">
      <text y="0" font-size="56" font-weight="800" fill="${CYAN}">5,000+ Free Browser Games</text>
      <text y="80" font-size="40" font-weight="600" fill="${INK}">No Download Required</text>
    </g>

    <!-- Accent line -->
    <rect x="440" y="930" width="200" height="3" fill="${PINK}"/>

    <!-- Domain -->
    <text x="540" y="990" text-anchor="middle"
          font-family="'Segoe UI', system-ui, sans-serif"
          font-weight="700" font-size="48" fill="${INK}" letter-spacing="6">
      plixfy.com
    </text>
  </svg>`;
  await svgToPng(svg, 1080, 1080, join(outDir, 'instagram-launch-post.png'));
}

// ── 5. X/TWITTER LAUNCH POST (1200x675) ───────────────────────────────
async function twitterLaunchPost() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
    <defs>
      ${gridPattern('tGrid', '#141C2E', 50)}
      <radialGradient id="thero" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.2"/>
        <stop offset="60%" stop-color="${CYAN}" stop-opacity="0.04"/>
        <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="tBottomFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${BG}" stop-opacity="0"/>
        <stop offset="100%" stop-color="${BG}" stop-opacity="0.9"/>
      </linearGradient>
      <filter id="tBigGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="tTextGlow" x="-10%" y="-30%" width="120%" height="160%">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="1200" height="675" fill="${BG}"/>
    <rect width="1200" height="675" fill="url(#tGrid)"/>
    ${gamingShapes(1200, 675, 22)}
    <rect width="1200" height="675" fill="url(#thero)"/>
    <rect width="1200" height="675" fill="url(#tBottomFade)"/>

    <!-- Left side: Icon + LIVE badge + branding -->
    <!-- Right side: Headline + stats -->

    <!-- Icon -->
    <g transform="translate(90 165) scale(2.1875)" filter="url(#tBigGlow)">
      <path d="M18 12h18a12 12 0 0 1 0 24H26v16h-8V12z" fill="${CYAN}"/>
      <path d="M26 20h10a4 4 0 0 1 0 8H26z" fill="${BG}"/>
      <path d="M28 21.5 L34 24 L28 26.5 Z" fill="${PINK}"/>
    </g>

    <!-- LIVE badge -->
    <g transform="translate(190 470)">
      <rect x="0" y="0" width="160" height="46" rx="23" fill="${PINK}"/>
      <circle cx="26" cy="23" r="7" fill="${INK}"/>
      <text x="44" y="32" font-family="'Segoe UI', system-ui, sans-serif"
            font-weight="900" font-size="22" fill="${INK}" letter-spacing="3">NOW LIVE</text>
    </g>

    <!-- Vertical divider -->
    <rect x="430" y="120" width="2" height="430" fill="${CYAN}" opacity="0.25"/>

    <!-- Headline -->
    <text x="480" y="220" filter="url(#tTextGlow)"
          font-family="'Segoe UI', system-ui, sans-serif"
          font-weight="900" font-size="88" fill="${CYAN}" letter-spacing="-2">
      Plixfy is
    </text>
    <text x="480" y="310" filter="url(#tTextGlow)"
          font-family="'Segoe UI', system-ui, sans-serif"
          font-weight="900" font-size="88" fill="${INK}" letter-spacing="-2">
      LIVE!
    </text>

    <!-- Stats -->
    <text x="480" y="410"
          font-family="'Segoe UI', system-ui, sans-serif"
          font-weight="800" font-size="44" fill="${CYAN}">
      5,000+ Free Browser Games
    </text>
    <text x="480" y="465"
          font-family="'Segoe UI', system-ui, sans-serif"
          font-weight="600" font-size="32" fill="${INK}">
      No Download Required
    </text>

    <!-- Accent + domain -->
    <rect x="480" y="510" width="120" height="3" fill="${PINK}"/>
    <text x="480" y="570"
          font-family="'Segoe UI', system-ui, sans-serif"
          font-weight="700" font-size="36" fill="${INK}" letter-spacing="5">
      plixfy.com
    </text>
  </svg>`;
  await svgToPng(svg, 1200, 675, join(outDir, 'twitter-launch-post.png'));
}

console.log('Generating Plixfy social assets…');
console.log(`Output: ${outDir}`);
await profile400();
await instagramProfile();
await twitterBanner();
await instagramLaunchPost();
await twitterLaunchPost();
console.log('Done.');
