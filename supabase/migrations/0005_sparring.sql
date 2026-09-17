-- Sparring sessions: exactly two communities, with individual player statistics.

create table if not exists public.sparrings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sparring_date date not null default current_date,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'LIVE', 'COMPLETED')),
  community_a_name text not null,
  community_b_name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sparring_players (
  id uuid primary key default gen_random_uuid(),
  sparring_id uuid not null references public.sparrings(id) on delete cascade,
  community text not null check (community in ('A', 'B')),
  name text not null,
  level text not null default '',
  matches_played integer not null default 0 check (matches_played >= 0),
  wins integer not null default 0 check (wins >= 0),
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (sparring_id, community, name)
);

create index if not exists sparring_players_sparring_community_idx
  on public.sparring_players(sparring_id, community);

drop trigger if exists sparrings_set_updated_at on public.sparrings;
create trigger sparrings_set_updated_at
before update on public.sparrings
for each row execute function public.set_updated_at();

drop trigger if exists sparring_players_set_updated_at on public.sparring_players;
create trigger sparring_players_set_updated_at
before update on public.sparring_players
for each row execute function public.set_updated_at();

alter table public.sparrings enable row level security;
alter table public.sparring_players enable row level security;

grant select on public.sparrings, public.sparring_players to anon, authenticated;
grant insert, update, delete on public.sparrings, public.sparring_players to authenticated;

drop policy if exists sparrings_public_read on public.sparrings;
create policy sparrings_public_read
  on public.sparrings
  for select to anon, authenticated
  using (true);

drop policy if exists sparrings_admin_manage on public.sparrings;
create policy sparrings_admin_manage
  on public.sparrings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists sparring_players_public_read on public.sparring_players;
create policy sparring_players_public_read
  on public.sparring_players
  for select to anon, authenticated
  using (true);

drop policy if exists sparring_players_admin_manage on public.sparring_players;
create policy sparring_players_admin_manage
  on public.sparring_players
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sparrings'
  ) then
    alter publication supabase_realtime add table public.sparrings;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sparring_players'
  ) then
    alter publication supabase_realtime add table public.sparring_players;
  end if;
end $$;
