-- Match-based sparring: each match is a doubles pair (2 players per community)
-- that goes PENDING -> ONGOING once all four players are chosen -> DONE with a
-- mandatory score.

alter table public.sparring_players
  drop column if exists matches_played,
  drop column if exists wins,
  drop column if exists points;

create table if not exists public.sparring_matches (
  id uuid primary key default gen_random_uuid(),
  sparring_id uuid not null references public.sparrings(id) on delete cascade,
  position integer not null default 1,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'ONGOING', 'DONE')),
  player_a1_id uuid references public.sparring_players(id) on delete set null,
  player_a2_id uuid references public.sparring_players(id) on delete set null,
  player_b1_id uuid references public.sparring_players(id) on delete set null,
  player_b2_id uuid references public.sparring_players(id) on delete set null,
  score_a integer check (score_a is null or score_a >= 0),
  score_b integer check (score_b is null or score_b >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (player_a1_id is null or player_a2_id is null or player_a1_id <> player_a2_id),
  check (player_b1_id is null or player_b2_id is null or player_b1_id <> player_b2_id),
  check (status <> 'DONE' or (score_a is not null and score_b is not null))
);

create index if not exists sparring_matches_sparring_idx
  on public.sparring_matches(sparring_id, position);

drop trigger if exists sparring_matches_set_updated_at on public.sparring_matches;
create trigger sparring_matches_set_updated_at
before update on public.sparring_matches
for each row execute function public.set_updated_at();

alter table public.sparring_matches enable row level security;

grant select on public.sparring_matches to anon, authenticated;
grant insert, update, delete on public.sparring_matches to authenticated;

drop policy if exists sparring_matches_public_read on public.sparring_matches;
create policy sparring_matches_public_read
  on public.sparring_matches
  for select to anon, authenticated
  using (true);

drop policy if exists sparring_matches_admin_manage on public.sparring_matches;
create policy sparring_matches_admin_manage
  on public.sparring_matches
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sparring_matches'
  ) then
    alter publication supabase_realtime add table public.sparring_matches;
  end if;
end $$;
