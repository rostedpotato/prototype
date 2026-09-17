-- Racket Arena access policies
-- Public users can read tournament data and submit pending registrations.
-- Only authenticated users with profiles.role = 'ADMIN' can mutate management data.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- Public-safe participant projection. Sensitive contact fields remain private.
create or replace view public.public_participants as
select
  id,
  tournament_id,
  name,
  player1,
  player2,
  seed,
  club,
  group_name,
  group_rank,
  group_points,
  group_wins,
  group_losses,
  group_sets_won,
  group_sets_lost,
  group_set_diff,
  group_points_won,
  group_points_lost,
  group_point_diff,
  created_at,
  updated_at
from public.participants;

grant select on public.public_participants to anon, authenticated;

-- Explicit grants. RLS policies below still decide which rows are accessible.
grant select on public.tournaments to anon, authenticated;
grant select on public.matches, public.match_scores to anon, authenticated;
grant insert on public.registrations to anon, authenticated;

grant select, insert, update, delete
  on public.profiles, public.tournaments, public.registrations,
     public.participants, public.matches, public.match_scores
  to authenticated;

revoke all on public.participants from anon;
revoke all on public.profiles from anon;

-- Profiles
drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_manage on public.profiles;
create policy profiles_admin_manage
  on public.profiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Tournament metadata is public to support the public match center and registration form.
drop policy if exists tournaments_public_read on public.tournaments;
create policy tournaments_public_read
  on public.tournaments
  for select
  to anon, authenticated
  using (true);

drop policy if exists tournaments_admin_manage on public.tournaments;
create policy tournaments_admin_manage
  on public.tournaments
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Public registration can only create a pending entry for a non-completed tournament.
drop policy if exists registrations_public_insert on public.registrations;
create policy registrations_public_insert
  on public.registrations
  for insert
  to anon, authenticated
  with check (
    status = 'PENDING'
    and processed_by is null
    and exists (
      select 1
      from public.tournaments t
      where t.id = tournament_id
        and t.status <> 'COMPLETED'
    )
  );

drop policy if exists registrations_admin_manage on public.registrations;
create policy registrations_admin_manage
  on public.registrations
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Participants are exposed to the public only through public_participants.
drop policy if exists participants_admin_manage on public.participants;
create policy participants_admin_manage
  on public.participants
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Match metadata and scores are public for the live scoreboard.
drop policy if exists matches_public_read on public.matches;
create policy matches_public_read
  on public.matches
  for select
  to anon, authenticated
  using (true);

drop policy if exists matches_admin_manage on public.matches;
create policy matches_admin_manage
  on public.matches
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists match_scores_public_read on public.match_scores;
create policy match_scores_public_read
  on public.match_scores
  for select
  to anon, authenticated
  using (true);

drop policy if exists match_scores_admin_manage on public.match_scores;
create policy match_scores_admin_manage
  on public.match_scores
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
