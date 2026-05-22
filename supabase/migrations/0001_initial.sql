-- =====================================================================
-- Plixfy — Phase 1 social schema
-- =====================================================================
-- Run this once in your Supabase project:
--   Supabase Dashboard → SQL Editor → "New query" → paste this whole file → Run.
--
-- Auth model: Clerk owns identity. Every write goes through a Next.js
-- server action that calls `auth()` to get the Clerk user id, looks up the
-- internal users.id, then writes via the service-role client (bypasses RLS).
-- Anon RLS is restricted to public reads and per-user own-data reads.
--
-- If you later enable Clerk's "third-party auth" in Supabase, the same
-- RLS policies will continue to work because they key off `clerk_id` via
-- the `clerk_user_id()` helper function.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- USERS — one row per Clerk user, written by the /api/webhooks/clerk
-- endpoint on `user.created` / `user.updated` events.
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  clerk_id    text not null unique,
  username    text not null unique,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create index if not exists users_clerk_id_idx on public.users (clerk_id);
create index if not exists users_username_idx on public.users (lower(username));

-- Helper: extract the Clerk user id from the JWT. Returns NULL when
-- unauthenticated. Used by RLS policies so that future Clerk-as-Supabase-
-- auth setups Just Work.
create or replace function public.clerk_user_id() returns text
language sql stable as $$
  select nullif(coalesce(
    auth.jwt() ->> 'sub',
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
  ), '')
$$;

-- ---------------------------------------------------------------------
-- SCORES — per-game leaderboard entries. Multiple rows per (user, game)
-- are allowed; "best score" is computed as MAX(score) per user via view.
-- ---------------------------------------------------------------------
create table if not exists public.scores (
  id          bigserial primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  game_slug   text not null,
  score       integer not null check (score >= 0),
  created_at  timestamptz not null default now()
);

create index if not exists scores_game_score_idx on public.scores (game_slug, score desc);
create index if not exists scores_game_recent_idx on public.scores (game_slug, created_at desc);
create index if not exists scores_user_idx on public.scores (user_id);

-- Best score per user per game (used by leaderboard "all-time top 100").
create or replace view public.scores_best as
select
  user_id,
  game_slug,
  max(score) as best_score,
  max(created_at) as last_played_at
from public.scores
group by user_id, game_slug;

-- ---------------------------------------------------------------------
-- COMMENTS — per-game discussion thread. Soft-deleted via `hidden`.
-- ---------------------------------------------------------------------
create table if not exists public.comments (
  id          bigserial primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  game_slug   text not null,
  text        text not null check (char_length(text) between 1 and 500),
  reports     integer not null default 0,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists comments_game_recent_idx on public.comments (game_slug, created_at desc) where hidden = false;
create index if not exists comments_user_idx on public.comments (user_id);

-- ---------------------------------------------------------------------
-- COMMENT_VOTES — like/dislike comments. One vote per user per comment.
-- ---------------------------------------------------------------------
create table if not exists public.comment_votes (
  comment_id  bigint not null references public.comments(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  vote        text not null check (vote in ('up', 'down')),
  created_at  timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists comment_votes_comment_idx on public.comment_votes (comment_id);

-- ---------------------------------------------------------------------
-- LIKES — thumbs up/down on a whole game (drives "94% liked this").
-- One vote per user per game; toggle by upserting or deleting.
-- ---------------------------------------------------------------------
create table if not exists public.likes (
  user_id     uuid not null references public.users(id) on delete cascade,
  game_slug   text not null,
  vote        text not null check (vote in ('up', 'down')),
  created_at  timestamptz not null default now(),
  primary key (user_id, game_slug)
);

create index if not exists likes_game_idx on public.likes (game_slug);

-- Aggregate liked-percent per game (powers "Most liked" sort + game-page summary).
create or replace view public.game_ratings as
select
  game_slug,
  count(*) filter (where vote = 'up')   as ups,
  count(*) filter (where vote = 'down') as downs,
  count(*)                               as total,
  case
    when count(*) >= 3
      then round(100.0 * count(*) filter (where vote = 'up') / count(*))::int
    else null
  end as percent_liked
from public.likes
group by game_slug;

-- ---------------------------------------------------------------------
-- FAVORITES — saved games per user. Used by /favorites + cross-device sync.
-- ---------------------------------------------------------------------
create table if not exists public.favorites (
  user_id     uuid not null references public.users(id) on delete cascade,
  game_slug   text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, game_slug)
);

create index if not exists favorites_user_recent_idx on public.favorites (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- FRIENDSHIPS — Phase 2 placeholder. Directed edge; mutual = both rows.
-- ---------------------------------------------------------------------
create table if not exists public.friendships (
  user_id     uuid not null references public.users(id) on delete cascade,
  friend_id   uuid not null references public.users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at  timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

-- ---------------------------------------------------------------------
-- ACTIVITY — append-only feed that powers "🔥 Recent Activity" on home.
-- Insert one row per user action that's interesting to show publicly.
-- ---------------------------------------------------------------------
create table if not exists public.activity (
  id          bigserial primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  verb        text not null check (verb in ('scored', 'commented', 'liked', 'favorited')),
  game_slug   text not null,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists activity_recent_idx on public.activity (created_at desc);
create index if not exists activity_user_idx on public.activity (user_id, created_at desc);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
-- All writes flow through the service-role client (Clerk-authenticated
-- server actions), which bypasses RLS. RLS here protects anon/auth
-- direct queries from the client.
-- =====================================================================

alter table public.users          enable row level security;
alter table public.scores         enable row level security;
alter table public.comments       enable row level security;
alter table public.comment_votes  enable row level security;
alter table public.likes          enable row level security;
alter table public.favorites      enable row level security;
alter table public.friendships    enable row level security;
alter table public.activity       enable row level security;

-- Public reads ---------------------------------------------------------
drop policy if exists "public read users" on public.users;
create policy "public read users" on public.users
  for select using (true);

drop policy if exists "public read scores" on public.scores;
create policy "public read scores" on public.scores
  for select using (true);

drop policy if exists "public read visible comments" on public.comments;
create policy "public read visible comments" on public.comments
  for select using (hidden = false);

drop policy if exists "public read comment votes" on public.comment_votes;
create policy "public read comment votes" on public.comment_votes
  for select using (true);

drop policy if exists "public read likes" on public.likes;
create policy "public read likes" on public.likes
  for select using (true);

drop policy if exists "public read activity" on public.activity;
create policy "public read activity" on public.activity
  for select using (true);

-- Owner-only reads for private tables ----------------------------------
drop policy if exists "owner read favorites" on public.favorites;
create policy "owner read favorites" on public.favorites
  for select using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

drop policy if exists "owner read friendships" on public.friendships;
create policy "owner read friendships" on public.friendships
  for select using (
    user_id  in (select id from public.users where clerk_id = public.clerk_user_id())
    or friend_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

-- No anon/auth direct writes. Service role bypasses RLS.
-- Adding NO write policies means: writes from anon/auth are rejected.
