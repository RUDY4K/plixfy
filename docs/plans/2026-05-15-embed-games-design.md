# Embed Games Integration — Design

**Date:** 2026-05-15
**Status:** Approved
**Author:** PlayHub

## Goal

Add third-party iframe games (initial seed from GameDistribution) alongside existing custom Phaser/React games, taking the portal from 4 playable games to 24+ at launch.

## Non-goals

- GameDistribution publisher SDK integration (user is not yet a registered publisher)
- Per-game telemetry for embed games (iframe handles its own)
- Ad-blocker detection
- E2E tests for embed loading

## Architecture

### Type model

`types/game.ts` exports a discriminated union on `kind`:

```ts
type GameMeta = CustomGameMeta | EmbedGameMeta;

interface BaseGameMeta { slug, title, description, longDescription, thumbnail, category, difficulty, controls, color, keywords, status }

interface CustomGameMeta extends BaseGameMeta { kind: 'custom'; engine: 'phaser' | 'react' }
interface EmbedGameMeta extends BaseGameMeta { kind: 'embed'; provider: 'gamedistribution' | 'gamemonetize' | 'gamepix' | 'other'; embedUrl: string; aspect?: '16:9' | '4:3' | '3:4' }
```

Existing 8 games migrate to `kind: 'custom'`. No runtime cost — TypeScript-only narrowing.

### EmbedGame component

`components/EmbedGame.tsx` is a client component that:

- Renders a responsive wrapper (default `aspect-video` 16:9; configurable for 4:3 / 3:4 games).
- Renders an `<iframe loading="lazy">` with sandbox: `allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-fullscreen` and feature policy `autoplay; fullscreen; gamepad`.
- Shows a loading skeleton (matching the wrapper's aspect ratio) until `onLoad` fires.
- Has a fullscreen button that calls `requestFullscreen()` on the wrapper div (more reliable than iframe-direct across providers).
- Caps width to container; full-width on mobile.

### Registry split

- `games/registry-custom.ts` — the existing 8 entries, with `kind: 'custom'` added.
- `games/registry-embed.ts` — new file with 15-20 verified GameDistribution entries, each with `kind: 'embed'`.
- `games/registry.ts` — re-exports merged `GAMES` array plus existing helpers (`findGame`, `gamesByCategory`, `liveGames`).

### Game page routing

`app/games/[slug]/GameStage.tsx` switches on `game.kind`:

- `'custom'` → existing Phaser/React loader logic (unchanged)
- `'embed'` → `<EmbedGame embedUrl={game.embedUrl} aspect={game.aspect} title={game.title} />`

### Ad placements

Around embed games:

- Above iframe: `<AdPlacement slot="above-game" />` (new slot — leaderboard 728×90 equivalent)
- Sidebar (desktop only): existing `<AdPlacement slot="sidebar" />` 300×600
- Below iframe (mobile only — already present in layout): existing `<AdPlacement slot="below-game" />`

These are *our* ads, separate from any ads the embed iframe runs internally.

## Seed catalog

15 well-known GameDistribution titles, embed URLs verified by fetching each game's page on `gamedistribution.com` and extracting the `html5.gamedistribution.com/<game-id>/` iframe URL.

Categories: puzzle (5), arcade (5), racing (3), sports (2).

Games marked `status: 'live'` once verified; broken/404 ones get skipped (target: 15+ verified).

## Risks & mitigations

- **Embed URL goes stale** — provider may rotate game IDs. Mitigation: `status` field per game; verify in CI later.
- **iframe ad policy conflicts** — GD's ToS may eventually restrict our wrapping ads. Mitigation: provider field on each game; easy to swap to a permissive provider per game.
- **Mobile fullscreen quirks** — iOS Safari treats iframe fullscreen differently. Mitigation: fullscreen calls wrapper div, not iframe.

## Out of scope (future)

- Provider SDK integration once user registers
- Embed games analytics (play count, session length)
- Per-game thumbnail fetching from provider CDN
- Switching between providers per-game with a unified fallback
