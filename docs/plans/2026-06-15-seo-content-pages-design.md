# SEO Content Pages — Design

**Date:** 2026-06-15
**Status:** Approved

## Goal

Increase organic traffic from Saudi Arabic gamer searches by adding indexable landing content, structured data, and internal linking. No JS bundle growth on existing routes; all new pages are server components.

## Brand

`بليكسفاي` everywhere. The earlier spec's `يافسكيلب` is treated as a typo.

## Files

- **MODIFY** `src/app/page.tsx` — H1 update, 150-word intro, JSON-LD (WebSite + Organization), link to `/all-games`.
- **NEW** `src/app/all-games/page.tsx` — server component, 8 category sections with anchor IDs (`#racing`, `#action`, …), each section ends with a CTA to `/category/[slug]`.
- **MODIFY** `src/app/category/[slug]/page.tsx` — 100–150 word Arabic intro per category, "related categories" section.
- **MODIFY** `src/app/sitemap.ts` — add `/all-games`.
- **MODIFY** `src/app/robots.ts` — confirm `/dashboard` is in `disallow`, confirm sitemap link.
- **NEW** `src/lib/categoryContent.ts` — `Record<CategorySlug, { intro: string; keywords: string[]; related: CategorySlug[] }>`.
- **NEW** `src/lib/siteContent.ts` — homepage intro + brand strings (DRY).

## Structured Data (homepage only)

Single `<script type="application/ld+json">` containing an array of two schemas:

```json
[
  { "@context": "https://schema.org", "@type": "WebSite",
    "name": "بليكسفاي", "url": "https://www.plixfy.com",
    "potentialAction": { "@type": "SearchAction",
      "target": "https://www.plixfy.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string" } },
  { "@context": "https://schema.org", "@type": "Organization",
    "name": "بليكسفاي", "url": "https://www.plixfy.com",
    "logo": "https://www.plixfy.com/opengraph-image.png" }
]
```

## /all-games Layout

- One `<section id="{slug}">` per category, 8 total.
- Each section: H2 with category name + `<a>` to `/category/{slug}`, then a grid of `GameCard` for all games in that category, then "عرض كل ألعاب {name}" CTA.
- All thumbnails `loading="lazy"` and `decoding="async"`.
- Above-the-fold (first section, first ~12 cards) gets `loading="eager"`.
- Top of page: in-page nav (chips linking to each `#slug` anchor).

## Internal Linking

- **Homepage:** CTA box "تصفّح كل الـ 386 لعبة" → `/all-games`.
- **Category page:** "تصنيفات ذات صلة" with 2–3 links from a hand-curated mapping (e.g. racing ↔ sports, puzzle ↔ casual, action ↔ shooting, io ↔ casual, girls ↔ casual).
- **/all-games:** Per-section CTA to `/category/{slug}`.
- **Breadcrumbs:** verify only; do not modify.

## Performance (scoped)

In: `loading="lazy"` + `decoding="async"` on thumbnails below the fold on `/all-games`.
Out: CSS minification audit, thumbnail proxying, Lighthouse tuning.

## Out of Scope

- Per-category `CollectionPage` JSON-LD (skip unless requested later).
- Dashboard env-vars issue (separate thread; user is fixing on Vercel).
- Existing per-game pages and `gameContent.ts` (already rich).
- Tailwind CSS audit.

## Verification

1. `npm run build` succeeds with zero errors.
2. `curl /all-games` returns 200; all 8 anchor IDs present in HTML.
3. JSON-LD parses (validated by eye against schema.org examples).
4. Sitemap includes `/all-games`.
5. `robots.txt` has `Disallow: /dashboard`.
6. Single commit, push to `main`.
