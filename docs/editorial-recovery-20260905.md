# Editorial recovery — 5 September 2026

Base: f7d1345727b1ca7a1f8e4db4399b4e52dd9f8dff. Local review package; no deployment or AdSense action performed.

## Confirmed failure and correction

The previous repair removed unsupported game guides from indexing and rendering but left unreviewed blogs publicly readable. News generation still wrote directly into the public store and capped it at 60 records. The four slugs in news-editorial.json are now absent from news.json: existing editorial work was orphaned by retention. This release preserves raw history rather than fabricating replacement stories or approvals.

All four generation entrypoints now create pending drafts outside src/public. The scheduled workflow has read-only repository permission, emits artifacts, and cannot commit, push, call IndexNow or message Telegram. The local news launcher also only drafts. Generation no longer truncates public records or earlier drafts. Public news and blog getters require an approval bound to the actual content and evidence bytes for each locale. Changing either invalidates approval. Social news selection uses the same gate; feed and image consumers cannot bypass it.

No existing news or blog is automatically approved. Existing URLs show an honest revision notice with useful guide/library navigation, and unknown URLs remain 404. This materially reduces visible news/blog content. The catalog remains usable, and the original bilingual browser guide remains available. Badges and labels derived only from catalog order no longer imply recent releases, measured popularity or device testing.

## Completed local review workflow

1. Generate drafts with the existing generation commands. Inspect content-drafts/*.json; generation is not approval.
2. Check the actual source and claims, add original analysis or documented experience, and record the real reviewer, scope, limitations and source links in docs/editorial-evidence/*.md. Neither a hash nor a passing test proves editorial quality.
3. Prepare a local JSON review containing kind, slug, draftHash, locales, reviewer, reviewedAt, originalValue, evidenceFile and evidenceHash. Use the draft contentHash and SHA256 of evidence bytes. reviewedAt must follow generatedAt. Locales are explicitly selected; a translation requires its own review.
4. Run `npm run content:promote -- --review <relative-review.json>`. The command validates shape, hashes and conflicts, then updates local storage and matching approval registry. It never sends, commits or deploys. Receipts in content-reviews document the proposed mutation; a prepared receipt is not proof of deployment.
5. Review the diff, run npm test, npm run build, and both local smoke checks. Production publication is a separate scoped owner decision. A later content edit needs renewed approval.

Legacy English blog revisions stored as TypeScript require a separately reviewed code patch. Whole-module automatic replacement is disabled because it could erase unrelated posts and the publication gate. Workflow artifacts retain 90 days and caches may expire; download/archive valuable drafts before expiry. No automated permanent archive is claimed.

## Readiness and evidence limits

Technical prevention of unreviewed publication is not evidence of AdSense acceptance. The review registries intentionally begin empty. This package does not claim that one bilingual guide or a number of words meets Google's editorial assessment. A sustained body of useful, reviewed original material remains necessary; do not mark that work completed merely because the build passes.

A live Codex browser launch of Mahjong Classic on 5 September reached the provider start screen, a third-party Google-served preroll, and the layout menu. A completed game or successful tile match was NOT established, so no gameplay review or device-compatibility claim was created. The guide now explains provider start/ad screens, and the player status no longer equates iframe load with a ready game. Own-page ad scripts remain disabled; this does not disable advertising inside third-party games. This observation does not establish which account or screen caused AdSense's rejection.

No new AdSense review request, ad enablement, social message or production deployment is included in local validation.

## Validation

110 tests passed across social, site, content and operations suites. Final Next build generated 623 pages without the earlier broad file-tracing warning; the isolated build uses the documented affiliate fallback because no environment credentials were copied. Local production smoke checks passed for both languages, revision/unknown routes, empty RSS, removed legacy titles, game metadata and all 38 sitemap routes. Independent specialists reviewed changes outside their own implementation and closed the reported blockers before integration.
