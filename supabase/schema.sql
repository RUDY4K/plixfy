-- Run once in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_slug text not null check (char_length(game_slug) between 1 and 160),
  created_at timestamptz not null default now(),
  primary key (user_id, game_slug)
);

create table if not exists public.recently_played (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_slug text not null check (char_length(game_slug) between 1 and 160),
  played_at timestamptz not null default now(),
  primary key (user_id, game_slug)
);

alter table public.profiles enable row level security;
alter table public.user_favorites enable row level security;
alter table public.recently_played enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "favorites_select_own" on public.user_favorites;
create policy "favorites_select_own" on public.user_favorites for select using (auth.uid() = user_id);
drop policy if exists "favorites_insert_own" on public.user_favorites;
create policy "favorites_insert_own" on public.user_favorites for insert with check (auth.uid() = user_id);
drop policy if exists "favorites_delete_own" on public.user_favorites;
create policy "favorites_delete_own" on public.user_favorites for delete using (auth.uid() = user_id);

drop policy if exists "recent_select_own" on public.recently_played;
create policy "recent_select_own" on public.recently_played for select using (auth.uid() = user_id);
drop policy if exists "recent_insert_own" on public.recently_played;
create policy "recent_insert_own" on public.recently_played for insert with check (auth.uid() = user_id);
drop policy if exists "recent_update_own" on public.recently_played;
create policy "recent_update_own" on public.recently_played for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
