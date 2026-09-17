-- Racket Arena initial Supabase schema
-- This migration creates the relational storage layer only.
-- Access policies are intentionally added in a later migration.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'VIEWER'
    check (role in ('ADMIN', 'REFEREE', 'VIEWER')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tournaments (
  id text primary key,
  name text not null,
  sport text not null
    check (sport in ('BADMINTON', 'PADEL')),
  category text not null
    check (category in (
      'MEN_SINGLES',
      'WOMEN_SINGLES',
      'MEN_DOUBLES',
      'WOMEN_DOUBLES',
      'MIXED_DOUBLES',
      'OPEN_DOUBLES'
    )),
  category_label text not null,
  venue text not null,
  city text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'UPCOMING'
    check (status in ('UPCOMING', 'LIVE', 'COMPLETED')),
  description text not null default '',
  courts jsonb not null default '[]'::jsonb,
  banner_url text,
  rules jsonb not null default '{}'::jsonb,
  format text
    check (format in ('KNOCKOUT', 'TWO_STAGE', 'TWO_STAGE_PADEL_CUSTOM')),
  group_stage_completed boolean not null default false,
  group_schedule_scheme text
    check (group_schedule_scheme in ('SPLIT_WAVE', 'ROLLING_ROUND')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_date >= start_date)
);

create table if not exists public.registrations (
  id text primary key,
  tournament_id text not null references public.tournaments(id) on delete cascade,
  sector text not null,
  team_name text not null,
  player1_name text not null,
  player2_name text,
  reclub_id1 text,
  reclub_id2 text,
  whatsapp text not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  processed_by uuid references auth.users(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.participants (
  id text primary key,
  tournament_id text not null references public.tournaments(id) on delete cascade,
  name text not null,
  player1 text not null,
  player2 text,
  seed integer,
  club text,
  reclub_id1 text,
  reclub_id2 text,
  whatsapp text,
  registration_id text references public.registrations(id) on delete set null,
  group_name text,
  group_rank integer,
  group_points integer not null default 0,
  group_wins integer not null default 0,
  group_losses integer not null default 0,
  group_sets_won integer not null default 0,
  group_sets_lost integer not null default 0,
  group_set_diff integer not null default 0,
  group_points_won integer not null default 0,
  group_points_lost integer not null default 0,
  group_point_diff integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tournament_id, name)
);

create table if not exists public.matches (
  id text primary key,
  tournament_id text not null references public.tournaments(id) on delete cascade,
  round_number integer not null,
  round_name text not null,
  match_order integer not null default 0,
  participant1_id text references public.participants(id) on delete set null,
  participant2_id text references public.participants(id) on delete set null,
  current_set integer not null default 1 check (current_set > 0),
  serving_side smallint check (serving_side in (1, 2)),
  court text,
  scheduled_time text,
  referee text,
  status text not null default 'UPCOMING'
    check (status in ('UPCOMING', 'LIVE', 'FINISHED', 'WALKOVER')),
  winner_id text references public.participants(id) on delete set null,
  next_match_id text references public.matches(id) on delete set null,
  next_match_slot smallint check (next_match_slot in (1, 2)),
  phase text
    check (phase in ('GROUP', 'KNOCKOUT_UPPER', 'KNOCKOUT_BOTTOM')),
  group_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.match_scores (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches(id) on delete cascade,
  set_number integer not null check (set_number > 0),
  score1 integer not null default 0 check (score1 >= 0),
  score2 integer not null default 0 check (score2 >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (match_id, set_number)
);

create index if not exists tournaments_status_idx
  on public.tournaments(status);

create index if not exists registrations_tournament_status_idx
  on public.registrations(tournament_id, status);

create index if not exists participants_tournament_idx
  on public.participants(tournament_id);

create index if not exists matches_tournament_status_idx
  on public.matches(tournament_id, status);

create index if not exists matches_tournament_phase_idx
  on public.matches(tournament_id, phase);

create index if not exists match_scores_match_idx
  on public.match_scores(match_id, set_number);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists tournaments_set_updated_at on public.tournaments;
create trigger tournaments_set_updated_at
before update on public.tournaments
for each row execute function public.set_updated_at();

drop trigger if exists registrations_set_updated_at on public.registrations;
create trigger registrations_set_updated_at
before update on public.registrations
for each row execute function public.set_updated_at();

drop trigger if exists participants_set_updated_at on public.participants;
create trigger participants_set_updated_at
before update on public.participants
for each row execute function public.set_updated_at();

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

drop trigger if exists match_scores_set_updated_at on public.match_scores;
create trigger match_scores_set_updated_at
before update on public.match_scores
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.registrations enable row level security;
alter table public.participants enable row level security;
alter table public.matches enable row level security;
alter table public.match_scores enable row level security;
