# Plixfy cloud social automation

The social publisher is intentionally deterministic and does not require an AI provider.

## Schedule

- Morning: one game spotlight at 09:30 Asia/Riyadh.
- Evening: one gaming-news post at 19:30 Asia/Riyadh.
- Telegram is published directly. X, Facebook, and Instagram drafts are delivered to the private Telegram review chat.

## Reliability

- GitHub Actions runs even when the local PC is off.
- A restored cache keeps delivery and rotation state between runs.
- Per-destination delivery markers prevent duplicate public or admin messages after partial failures.
- Telegram requests retry transient errors up to three times.
- Failed workflows send a private Telegram alert.
- The generator falls back to site data and fixed templates; no LLM is required.
- A Vercel cron checks once daily that GitHub Actions has succeeded within the previous 18 hours.

## Required GitHub Actions secrets

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_CHANNEL_ID`

The Vercel production environment also requires `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and a random `CRON_SECRET` of at least 16 characters for the protected watchdog route.

## Local verification

```powershell
npm run social:cloud:dry -- --slot=morning
npm run social:cloud:dry -- --slot=evening
```

Use `workflow_dispatch` with `dry_run=true` for the first cloud verification. State files and generated packs are ignored locally and are persisted in the workflow cache.
