# Plixfy social operations

Public X posting is manual. The scheduled official-news monitor creates a
research brief and alerts the private Telegram administrator; it has no Buffer
credential and cannot call the public publisher. This boundary protects the
Original Content Rewards path, which requires a human-reviewed original
perspective rather than copied, minimally transformed, or automated posts.

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

## Reviewed website distribution

- `.github/workflows/cloud-social.yml` is manual-only and defaults to dry-run.
- Any public delivery requires explicit review and authorization for that item.
- X is rejected by this workflow; the final X post must be written and submitted
  by a human in X.
- Buffer remains available to legacy/manual distribution tools, but scheduled
  official-news monitoring does not receive Buffer credentials.

## Official-news research queue

- `.github/workflows/fast-social-news.yml` checks PlayStation Blog and Xbox Wire
  every five minutes.
- A verified fresh source becomes an `original-content-brief` artifact. It does
  not contain publish-ready copy or third-party media.
- Telegram receives a private notice with the workflow link.
- A human adds Plixfy's perspective, checks rights, and performs the final X
  post manually.
- Queued sources are deduplicated independently from the legacy published-state
  history. The editorial freshness window is eight hours to tolerate delayed
  GitHub schedules.

## Reliability

- GitHub Actions runs even when the local PC is off.
- A restored cache keeps delivery and rotation state between runs.
- Queue-state markers prevent duplicate research alerts.
- Failed source checks persist a bounded attempt counter even when the watcher
  exits with an error, so one broken source cannot block the queue indefinitely.
- Telegram requests retry transient errors up to three times.
- Failed workflows send a private Telegram alert.
- A changed run uploads the research brief and durable queue state as artifacts.
- The generator falls back to site data and fixed templates; no LLM is required.
- A Vercel cron checks once daily that GitHub Actions has succeeded within the previous 18 hours.

## Required GitHub Actions secrets

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_CHANNEL_ID` and `BUFFER_API_KEY` are needed only by legacy/manual
  distribution workflows, not by the scheduled original-content research queue.

Optional for legacy/manual Buffer delivery: `BUFFER_ORGANIZATION_ID` when the
Buffer account has more than one organization.

The Vercel production environment also requires `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and a random `CRON_SECRET` of at least 16 characters for the protected watchdog route.

## Local verification

```powershell
npm run social:cloud:dry -- --slot=news
npm run social:cloud:dry -- --slot=auto
npm run growth:dry
npm run test:social-agents
```

Use `workflow_dispatch` with `dry_run=true` for the first cloud verification. State files and generated packs are ignored locally and are persisted in the workflow cache.
