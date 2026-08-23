# Plixfy cloud social automation

The social system is intentionally deterministic, runs as five local agents, and does not require a paid AI provider:

1. Trend agent reads the official Google Trends RSS feed for Saudi Arabia and keeps a 48-hour fallback snapshot.
2. Traffic acquisition agent scores existing Plixfy game/news pages for Saudi interest, freshness, page quality, device support, and repeat avoidance.
3. Editor validates Arabic, links, media URLs, secrets, and platform limits.
4. Publisher sends only to connected public channels and records a receipt per platform.
5. Auditor rejects runs where an admin fallback was incorrectly treated as public publishing.

The trend feed contributes search phrases only. Plixfy does not copy external trend images or articles. If Google Trends is unavailable and the cached snapshot has expired, selection safely falls back to the quality signals in the Playgama catalog and Plixfy news data.

## Acquisition measurement

- GA4 campaign: `ar_acquisition_v1`.
- Every selected page receives one deterministic hook variant: `a`, `b`, or `c`.
- The hook is included in `utm_content`, so traffic and engagement can be compared in GA4 without changing the destination page.
- Generated packs record the agent score, selection reasons, matched trends, hook variant, and trend-source status.
- The private Telegram completion report includes the score and selection reasons.
- The agent improves which existing page is promoted. It does not mass-generate indexable pages, buy traffic, post spam, or automate TikTok.

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
npm run growth:dry
npm run test:social-agents
```

Use `workflow_dispatch` with `dry_run=true` for the first cloud verification. State files and generated packs are ignored locally and are persisted in the workflow cache.
