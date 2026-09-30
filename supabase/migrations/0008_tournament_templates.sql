-- Template turnamen: aturan yang dapat dipakai ulang saat membuat turnamen
-- (format, skoring, target peserta, lapangan, skema jadwal).

create table if not exists public.tournament_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  sport text not null check (sport in ('BADMINTON', 'PADEL')),
  format text not null check (format in ('KNOCKOUT', 'TWO_STAGE', 'TWO_STAGE_PADEL_CUSTOM')),
  category text not null default 'OPEN_DOUBLES',
  rules jsonb not null default '{}'::jsonb,
  participant_count integer,
  courts text[] not null default '{}',
  group_schedule_scheme text check (group_schedule_scheme in ('SPLIT_WAVE', 'ROLLING_ROUND')),
  schedule_start_time text not null default '08:00 WIB',
  slot_duration_minutes integer not null default 45,
  is_builtin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists tournament_templates_set_updated_at on public.tournament_templates;
create trigger tournament_templates_set_updated_at
before update on public.tournament_templates
for each row execute function public.set_updated_at();

alter table public.tournament_templates enable row level security;

grant select on public.tournament_templates to anon, authenticated;
grant insert, update, delete on public.tournament_templates to authenticated;

drop policy if exists tournament_templates_public_read on public.tournament_templates;
create policy tournament_templates_public_read
  on public.tournament_templates
  for select to anon, authenticated
  using (true);

drop policy if exists tournament_templates_admin_manage on public.tournament_templates;
create policy tournament_templates_admin_manage
  on public.tournament_templates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Tiga template bawaan. ID tetap + on conflict do nothing agar migrasi
-- aman dijalankan berulang tanpa menimpa kustomisasi admin.
insert into public.tournament_templates
  (id, name, description, sport, format, category, rules, participant_count, courts, group_schedule_scheme, schedule_start_time, slot_duration_minutes, is_builtin)
values
  (
    '00000000-0000-4000-8000-0000000000b1',
    'Bulutangkis — Bagan Gugur Standar',
    'Bagan sistem gugur langsung untuk bulutangkis. Skor poin 21, best of 3, rubber cap 30.',
    'BADMINTON', 'KNOCKOUT', 'MEN_DOUBLES',
    '{"pointsPerSet": 21, "maxSets": 3, "deuceMargin": 2, "maxPointCap": 30}'::jsonb,
    16, '{"Court 1","Court 2","Court 3"}', null, '08:00 WIB', 30, true
  ),
  (
    '00000000-0000-4000-8000-0000000000b2',
    'Resmi — Two Stage 4 Grup + 2 Bagan',
    'Format resmi turnamen: 16 pasangan di 4 grup round robin, lanjut ke bagan Upper & Bottom.',
    'BADMINTON', 'TWO_STAGE', 'MEN_DOUBLES',
    '{"pointsPerSet": 21, "maxSets": 3, "deuceMargin": 2, "maxPointCap": 30}'::jsonb,
    16, '{"Court 1","Court 2","Court 3","Court 4"}', 'SPLIT_WAVE', '08:00 WIB', 45, true
  ),
  (
    '00000000-0000-4000-8000-0000000000b3',
    'Padel Custom — Two Stage Best of 5',
    'Two stage khusus padel: grup & QF first to 3 set, SF first to 4, Final first to 6.',
    'PADEL', 'TWO_STAGE_PADEL_CUSTOM', 'OPEN_DOUBLES',
    '{"pointsPerSet": 6, "maxSets": 5, "deuceMargin": 2, "customPadelScoring": true}'::jsonb,
    16, '{"Court 1","Court 2","Court 3","Court 4"}', 'SPLIT_WAVE', '08:00 WIB', 45, true
  )
on conflict (id) do nothing;
