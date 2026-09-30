-- Hardening integritas data sparing & registrasi.

-- 1. Posisi match unik per sparing (mencegah dua match bernomor sama).
alter table public.sparring_matches
  drop constraint if exists sparring_matches_sparring_position_unique;
alter table public.sparring_matches
  add constraint sparring_matches_sparring_position_unique unique (sparring_id, position);

-- 2. Match selesai wajib punya pemenang (skor imbang tidak diizinkan).
alter table public.sparring_matches
  drop constraint if exists sparring_matches_no_draw;
alter table public.sparring_matches
  add constraint sparring_matches_no_draw
  check (status <> 'DONE' or (score_a is not null and score_b is not null and score_a <> score_b));

-- 3. Pemain pada slot match wajib berasal dari sparing yang sama dan dari
--    komunitas yang sesuai dengan slotnya (A/A untuk komunitas A, B/B untuk B).
create or replace function public.validate_sparring_match_players()
returns trigger
language plpgsql
as $$
declare
  invalid_count integer;
begin
  select count(*) into invalid_count
  from public.sparring_players p
  where p.id in (new.player_a1_id, new.player_a2_id)
    and (p.sparring_id is distinct from new.sparring_id or p.community <> 'A');

  if invalid_count > 0 then
    raise exception 'Pemain di slot Komunitas A wajib berasal dari sparing yang sama dan terdaftar di Komunitas A';
  end if;

  select count(*) into invalid_count
  from public.sparring_players p
  where p.id in (new.player_b1_id, new.player_b2_id)
    and (p.sparring_id is distinct from new.sparring_id or p.community <> 'B');

  if invalid_count > 0 then
    raise exception 'Pemain di slot Komunitas B wajib berasal dari sparing yang sama dan terdaftar di Komunitas B';
  end if;

  return new;
end $$;

drop trigger if exists sparring_matches_validate_players on public.sparring_matches;
create trigger sparring_matches_validate_players
before insert or update on public.sparring_matches
for each row execute function public.validate_sparring_match_players();

-- 4. Batasi panjang & wujud isian registrasi publik (lapisan database;
--    rate limit tetap tanggung jawab Edge Function/API bila diperlukan).
--
--    Rapikan dulu whitespace pada data lama, lalu pasang constraint sebagai
--    NOT VALID: aturan langsung berlaku untuk baris baru/update, tanpa
--    menggagalkan migrasi karena baris lama yang tidak memenuhi aturan.
update public.registrations
set
  team_name = trim(team_name),
  player1_name = trim(player1_name),
  player2_name = trim(player2_name),
  whatsapp = trim(coalesce(whatsapp, ''));

alter table public.registrations
  drop constraint if exists registrations_content_check;
alter table public.registrations
  add constraint registrations_content_check check (
    char_length(trim(team_name)) between 2 and 100
    and char_length(trim(player1_name)) between 2 and 80
    and (player2_name is null or char_length(trim(player2_name)) <= 80)
    and char_length(coalesce(whatsapp, '')) <= 25
    and (sector is null or char_length(trim(sector)) <= 120)
  ) not valid;

-- Opsional: setelah yakin data lama bersih, jalankan ini untuk memvalidasi
-- juga baris lama (akan gagal bila masih ada yang melanggar):
--   alter table public.registrations
--     validate constraint registrations_content_check;
--
-- Untuk melihat baris lama yang melanggar aturan (bila ingin dibersihkan
-- manual dari dashboard):
--   select id, team_name, player1_name, whatsapp
--   from public.registrations
--   where char_length(trim(team_name)) not between 2 and 100
--      or char_length(trim(player1_name)) not between 2 and 80
--      or char_length(coalesce(whatsapp, '')) > 25
--      or (sector is not null and char_length(trim(sector)) > 120);
