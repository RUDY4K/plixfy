import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { shouldUseTouchViewportLayer as shouldUseTouchViewportLayerForDevice } from "../src/lib/touchViewport.mjs";

const ROOT = process.cwd();
const read = (file) => readFileSync(path.join(ROOT, file), "utf8");

test("game launch remains usable when React cannot hydrate", () => {
  const frame = read("src/components/GameFrame.tsx");
  const cta = read("src/components/PlayNowButton.tsx");
  const page = read("src/app/[locale]/play/[slug]/page.tsx");
  const launch = read("src/app/[locale]/play/[slug]/launch/page.tsx");

  assert.match(frame, /<a[\s\S]+href=\{launchHref\}[\s\S]+data-placement="game-frame"/);
  assert.match(frame, /event\.preventDefault\(\);\s+start\(\)/);
  assert.match(cta, /href=\{href\}/);
  assert.match(page, /const launchHref = href\("\/play\/" \+ slug \+ "\/launch"\)/);
  assert.match(launch, /<iframe[\s\S]+getPlaygamaEmbedUrl\(game\.slug\)/);
  assert.match(launch, /<Link[\s\S]+data-game-exit/);
  assert.match(launch, /robots: \{ index: false, follow: false \}/);
});

test("touch tablets and iPadOS use the visual-viewport game layer", () => {
  const frame = read("src/components/GameFrame.tsx");
  const detector = read("src/lib/touchViewport.mjs");

  assert.match(frame, /function shouldUseTouchViewportLayer\(\)/);
  assert.match(frame, /navigator\.maxTouchPoints/);
  assert.match(detector, /platform === "MacIntel"/);
  assert.match(frame, /\(pointer: coarse\)/);
  assert.match(frame, /\(any-pointer: coarse\)/);
  assert.match(detector, /Math\.min\(device\.screenWidth, device\.screenHeight\) <= 1024/);
  assert.match(frame, /const wantsFullscreen = shouldUseTouchViewportLayer\(\)/);
  assert.doesNotMatch(frame, /const wantsFullscreen[\s\S]{0,120}max-width: 767px/);
  assert.match(frame, /data-game-orientation=\{orientation \?\? "both"\}/);
});

test("touch viewport detection includes desktop-mode iPads but excludes desktops", () => {
  const common = { screenWidth: 1024, screenHeight: 1366 };

  assert.equal(shouldUseTouchViewportLayerForDevice({
    ...common,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Version/18.6 Safari/605.1.15",
    platform: "MacIntel",
    maxTouchPoints: 5,
    coarsePointer: true,
  }), true);
  assert.equal(shouldUseTouchViewportLayerForDevice({
    ...common,
    userAgent: "Mozilla/5.0 (iPad; CPU OS 15_4 like Mac OS X)",
    platform: "iPad",
    maxTouchPoints: 5,
    coarsePointer: true,
  }), true);
  assert.equal(shouldUseTouchViewportLayerForDevice({
    screenWidth: 800,
    screenHeight: 1280,
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel Tablet)",
    platform: "Linux armv8l",
    maxTouchPoints: 5,
    coarsePointer: true,
  }), true);
  assert.equal(shouldUseTouchViewportLayerForDevice({
    screenWidth: 1920,
    screenHeight: 1080,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    platform: "Win32",
    maxTouchPoints: 0,
    coarsePointer: false,
  }), false);
});

test("tablet portrait games reserve an exit bar outside the iframe", () => {
  const frame = read("src/components/GameFrame.tsx");
  const css = read("src/app/globals.css");

  const iframeArea = frame.indexOf('className="absolute flex justify-center bg-black"');
  const iframe = frame.indexOf("<iframe", iframeArea);
  const toolbar = frame.indexOf('z-[220] flex h-[calc(3.5rem+env(safe-area-inset-top))]', iframe);

  assert.ok(iframeArea > 0 && iframe > iframeArea && toolbar > iframe);
  assert.match(frame, /top: "calc\(env\(safe-area-inset-top\) \+ 3\.5rem\)"/);
  assert.match(frame, /bottom: "env\(safe-area-inset-bottom\)"/);
  assert.match(css, /\.game-viewport-stage\[data-game-orientation="portrait"\]/);
  assert.match(css, /aspect-ratio: 9 \/ 16/);
});

test("hydration-free launch uses dynamic viewport units with old Safari fallback", () => {
  const launch = read("src/app/[locale]/play/[slug]/launch/page.tsx");
  const css = read("src/app/globals.css");

  assert.match(launch, /className="game-launch-viewport/);
  assert.match(launch, /paddingBottom: "env\(safe-area-inset-bottom\)"/);
  assert.match(launch, /data-game-orientation=\{game\.orientation \?\? "both"\}/);
  assert.match(css, /\.game-launch-viewport \{[\s\S]*height: 100vh;[\s\S]*height: -webkit-fill-available;/);
  assert.match(css, /@supports \(height: 100svh\)[\s\S]*height: 100svh;/);
  assert.match(css, /@supports \(height: 100dvh\)[\s\S]*height: 100dvh;/);
});
