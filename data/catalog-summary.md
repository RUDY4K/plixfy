# Playgama Catalog Import — Summary

**Imported:** 2026-05-27 (refreshed with set-based genre matching + dedupe plumbing)
**Endpoint:** `POST https://playgama.com/api/v1/partner/export/catalogue/games`
**Auth:** None required (CLID used only at iframe embed time)

## Counts

| Stage | Count |
|---|---|
| Raw catalog (`totalCount`) | 1600 |
| Banned (Saudi-market exclusion regex) | 10 |
| Desktop-only (excluded) | 71 |
| Missing thumbnail | 0 |
| Invalid slug | 0 |
| After filters, unique | 1519 |
| **Final master list (`allGames`)** | **372** |

## Per-category coverage (`getGamesByCategory`)

| Category | Strip count (cap 60) | Primary-only |
|---|---:|---:|
| racing | 60 | 67 |
| action | 60 | 33 |
| puzzle | 60 | 48 |
| io | 60 | 48 |
| girls | 60 | 59 |
| casual | 60 | 10 |
| sports | 60 | 53 |
| shooting | 60 | 54 |

## Featured game (homepage hero)

| | |
|---|---|
| Slug | `moto-x3m` |
| Title | Moto X3M |
| Category | racing (سباق) |

`getFeaturedGame()` returns `moto-x3m` (manually curated) → first racing game → `allGames[0]` as fallbacks.

## Top 10 by API order

1. `piece-of-cake-merge--bake` — Piece of Cake: Merge & Bake (girls)
2. `tb-world` — TB World (girls)
3. `plants-vs-zombies-fusion-edition` — PVZ Fusion Cheats (action)
4. `hidden-object-street-of-secrets` — Hidden Object: Street Of Secrets (girls)
5. `hidden-object-clues-and-mysteries` — Hidden Object: Clues and Mysteries (puzzle)
6. `idol-livestream-doll-dress-up` — Idol Livestream: Doll Dress Up (girls)
7. `cat-and-granny` — Cat and Granny (action)
8. `hidden-objects-island-secrets` — Hidden Objects: Island Secrets (puzzle)
9. `build-an-aquapark` — Build an Aquapark (casual)
10. `good-sort-master` — Good Sort Master: Triple Match (puzzle)

## Categorization rules

Matching is done against the curated `genres[]` array values **only** (exact-set membership). Tag strings and title text are *not* used to avoid false positives like `fast-paced-action` triggering the action rule. The io category additionally checks for `-io`/`.io` in the slug.

Priority order (first match → primary categorySlug):
1. racing (driving, cars, motorbike, drift, parking, …)
2. shooting (shooter, fps, sniper)
3. sports (football, basketball, soccer, golf, tennis, …)
4. io (multiplayer or io genre, or `-io`/`.io` slug)
5. girls (dress-up, makeover, cooking, princess, …)
6. puzzle (brain, logic, hidden-object, merge, blocks, …)
7. action (fighting, combat, parkour, zombie, tower-defense, …)
8. casual (arcade, hyper-casual, idle, skill, simulation, … — fallback)

## Filter rules

**Excluded** (word-boundary regex on title + description + howToPlayText):
pregnant/pregnancy · casino/poker/gambling/slot machine · dating/kiss/kissing · satanic/occult/demon worship · sexy/strip/stripper/hot girls · beer pong/drinking game/drunk/shot glass/bar tender/tequila/whiskey/vodka/cocktail

**Kept** (per user direction): horror, scary, romance, zombie, birthday-style "birth".

**Mobile-first:** desktop-only games excluded.
