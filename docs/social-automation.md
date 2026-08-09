# Plixfy cloud social automation

The social system is intentionally deterministic, runs as four local agents, and does not require a paid AI provider:

1. Scout selects fresh game or news content.
2. Editor validates Arabic, links, media URLs, secrets, and platform limits.
3. Publisher sends only to connected public channels and records a receipt per platform.
4. Auditor rejects runs where an admin fallback was incorrectly treated as public publishing.

## Schedule

- Morning: one game spotlight at 09:30 Asia/Riyadh.
- Evening: one gaming-news post at 19:30 Asia/Riyadh.
- Telegram is published directly.
- Buffer publishes to every connected channel (currently X; Facebook and Instagram activate automatically after connection).
- Disconnected channels are copied to the private Telegram chat and explicitly recorded as `fallback_admin`, never as public posts.

## Reliability

- GitHub Actions runs even when the local PC is off.
- A restored cache keeps delivery and rotation state between runs.
- Per-destination delivery markers prevent duplicate public or admin messages after partial failures.
- Telegram requests retry transient errors up to three times.
- Failed workflows send a private Telegram alert.
- Every run uploads the generated pack and delivery report as a GitHub Actions artifact.
- The generator falls back to site data and fixed templates; no LLM is required.
- A Vercel cron checks once daily that GitHub Actions has succeeded within the previous 18 hours.

## Required GitHub Actions secrets

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_CHANNEL_ID`
- `BUFFER_API_KEY`

Optional: `BUFFER_ORGANIZATION_ID` as a GitHub Actions variable when the Buffer account has more than one organization.

The Vercel production environment also requires `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and a random `CRON_SECRET` of at least 16 characters for the protected watchdog route.

## Local verification

```powershell
npm run social:cloud:dry -- --slot=morning
npm run social:cloud:dry -- --slot=evening
npm run test:social-agents
```

Use `workflow_dispatch` with `dry_run=true` for the first cloud verification. State files and generated packs are ignored locally and are persisted in the workflow cache.
