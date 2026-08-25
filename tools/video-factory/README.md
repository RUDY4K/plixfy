# Plixfy video factory

Local pipeline for recording gameplay, selecting a high-motion segment, producing a vertical video, and sending the result to Telegram.

## Requirements

- Node.js and the local Playwright dependency.
- `ffmpeg` available on `PATH`.
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` supplied through a private environment file or the process environment.
- Optional `PLIXFY_VIDEO_QUEUE` to override the default output folder under `Videos/plixfy-ads/queue`.

## Commands

```powershell
npm run check
npm run run -- 3
npm run run -- --slug game-slug
```

The `raw/`, `overlays/`, `state.json`, `factory.log`, and nested `node_modules/` paths are runtime data and are intentionally ignored by Git.

The Windows scheduled task is named `PlixfyVideoFactory`. Keep it disabled until the private Telegram token has been validated.
