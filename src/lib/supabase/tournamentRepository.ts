'use client';

import type {
  Match,
  Participant,
  RegistrationRequest,
  Tournament,
} from '@/types/tournament';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type DatabaseRow = Record<string, unknown>;

const supabase = createClient();
const realtimeListeners = new Set<() => void>();
const realtimeStatusListeners = new Set<(status: RealtimeConnectionStatus) => void>();
let realtimeChannel: RealtimeChannel | null = null;
let realtimeStatus: RealtimeConnectionStatus = 'DISCONNECTED';

export type RealtimeConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'DISCONNECTED';

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>;
    const message = candidate.message || candidate.error_description || candidate.details;
    if (typeof message === 'string') return message;
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown Supabase error';
    }
  }
  return String(error);
}

function repositoryError(context: string, error: unknown): Error {
  return new Error(`${context}: ${errorMessage(error)}`);
}

function setRealtimeStatus(status: RealtimeConnectionStatus) {
  realtimeStatus = status;
  realtimeStatusListeners.forEach((listener) => listener(status));
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function participantFromRow(row: DatabaseRow): Participant {
  return {
    id: asString(row.id),
    name: asString(row.name),
    player1: asString(row.player1),
    player2: asString(row.player2) || undefined,
    seed: typeof row.seed === 'number' ? row.seed : undefined,
    club: asString(row.club) || undefined,
    reclubId1: asString(row.reclub_id1) || undefined,
    reclubId2: asString(row.reclub_id2) || undefined,
    whatsapp: asString(row.whatsapp) || undefined,
    registrationId: asString(row.registration_id) || undefined,
    group: asString(row.group_name) || undefined,
    groupRank: typeof row.group_rank === 'number' ? row.group_rank : undefined,
    groupPoints: asNumber(row.group_points),
    groupWins: asNumber(row.group_wins),
    groupLosses: asNumber(row.group_losses),
    groupSetsWon: asNumber(row.group_sets_won),
    groupSetsLost: asNumber(row.group_sets_lost),
    groupSetDiff: asNumber(row.group_set_diff),
    groupPointsWon: asNumber(row.group_points_won),
    groupPointsLost: asNumber(row.group_points_lost),
    groupPointDiff: asNumber(row.group_point_diff),
  };
}

function registrationFromRow(row: DatabaseRow): RegistrationRequest {
  return {
    id: asString(row.id),
    tournamentId: asString(row.tournament_id),
    sector: asString(row.sector),
    teamName: asString(row.team_name),
    player1Name: asString(row.player1_name),
    player2Name: asString(row.player2_name),
    reclubId1: asString(row.reclub_id1),
    reclubId2: asString(row.reclub_id2),
    whatsapp: asString(row.whatsapp),
    status: asString(row.status, 'PENDING') as RegistrationRequest['status'],
    createdAt: asString(row.created_at, new Date().toISOString()),
  };
}

function tournamentFromRows(
  row: DatabaseRow,
  participantRows: DatabaseRow[],
  matchRows: DatabaseRow[],
  scoreRows: DatabaseRow[],
  registrationRows: DatabaseRow[]
): Tournament {
  const participants = participantRows.map(participantFromRow);
  const participantsById = new Map(participants.map((participant) => [participant.id, participant]));
  const scoresByMatch = new Map<string, DatabaseRow[]>();

  scoreRows.forEach((score) => {
    const matchId = asString(score.match_id);
    const current = scoresByMatch.get(matchId) || [];
    current.push(score);
    scoresByMatch.set(matchId, current);
  });

  const matches: Match[] = matchRows.map((match) => ({
    id: asString(match.id),
    tournamentId: asString(match.tournament_id),
    round: asNumber(match.round_number, 1),
    roundName: asString(match.round_name),
    matchOrder: asNumber(match.match_order),
    participant1: participantsById.get(asString(match.participant1_id)) || null,
    participant2: participantsById.get(asString(match.participant2_id)) || null,
    scores: (scoresByMatch.get(asString(match.id)) || [])
      .sort((a, b) => asNumber(a.set_number) - asNumber(b.set_number))
      .map((score) => ({
        setNumber: asNumber(score.set_number, 1),
        score1: asNumber(score.score1),
        score2: asNumber(score.score2),
      })),
    currentSet: asNumber(match.current_set, 1),
    servingSide: match.serving_side === 1 || match.serving_side === 2 ? match.serving_side : undefined,
    court: asString(match.court) || undefined,
    scheduledTime: asString(match.scheduled_time) || undefined,
    referee: asString(match.referee) || undefined,
    status: asString(match.status, 'UPCOMING') as Match['status'],
    winnerId: asString(match.winner_id) || null,
    nextMatchId: asString(match.next_match_id) || null,
    nextMatchSlot:
      match.next_match_slot === 1 || match.next_match_slot === 2
        ? match.next_match_slot
        : undefined,
    phase: asString(match.phase) as Match['phase'],
    groupName: asString(match.group_name) || undefined,
  }));

  const rules = asObject(row.rules);

  return {
    id: asString(row.id),
    name: asString(row.name),
    sport: asString(row.sport, 'BADMINTON') as Tournament['sport'],
    category: asString(row.category, 'OPEN_DOUBLES') as Tournament['category'],
    categoryLabel: asString(row.category_label),
    venue: asString(row.venue),
    city: asString(row.city),
    startDate: asString(row.start_date),
    endDate: asString(row.end_date),
    status: asString(row.status, 'UPCOMING') as Tournament['status'],
    description: asString(row.description),
    courts: asStringArray(row.courts),
    bannerUrl: asString(row.banner_url) || undefined,
    participants,
    matches,
    rules: {
      pointsPerSet: asNumber(rules.pointsPerSet, 21),
      maxSets: asNumber(rules.maxSets, 3),
      deuceMargin: asNumber(rules.deuceMargin, 2),
      maxPointCap: typeof rules.maxPointCap === 'number' ? rules.maxPointCap : undefined,
      customPadelScoring: asBoolean(rules.customPadelScoring),
    },
    format: asString(row.format) as Tournament['format'],
    groupStageCompleted: asBoolean(row.group_stage_completed),
    groupScheduleScheme: asString(row.group_schedule_scheme) as Tournament['groupScheduleScheme'],
    registrations: registrationRows.map(registrationFromRow),
    createdAt: asString(row.created_at, new Date().toISOString()),
  };
}

async function loadParticipants(tournamentIds: string[]): Promise<DatabaseRow[]> {
  if (tournamentIds.length === 0) return [];

  // Admins can read the full table. Anonymous visitors fall back to the safe view
  // which intentionally omits WhatsApp and Reclub IDs.
  const fullResult = await supabase
    .from('participants')
    .select('*')
    .in('tournament_id', tournamentIds);

  if (!fullResult.error) return (fullResult.data || []) as DatabaseRow[];

  const publicResult = await supabase
    .from('public_participants')
    .select('*')
    .in('tournament_id', tournamentIds);

  if (publicResult.error) {
    console.warn('Supabase participant view tidak dapat dibaca:', errorMessage(publicResult.error));
    return [];
  }
  return (publicResult.data || []) as DatabaseRow[];
}

export async function loadTournamentsFromSupabase(): Promise<Tournament[]> {
  const tournamentsResult = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  if (tournamentsResult.error) {
    throw repositoryError('Gagal membaca tabel tournaments', tournamentsResult.error);
  }

  const rows = (tournamentsResult.data || []) as DatabaseRow[];
  if (rows.length === 0) return [];

  const tournamentIds = rows.map((row) => asString(row.id));
  const [participantRows, matchResult, scoreResult, registrationResult] = await Promise.all([
    loadParticipants(tournamentIds),
    supabase.from('matches').select('*').in('tournament_id', tournamentIds).order('match_order'),
    supabase.from('match_scores').select('*'),
    supabase.from('registrations').select('*').in('tournament_id', tournamentIds).order('created_at'),
  ]);

  if (matchResult.error) {
    console.warn('Supabase tabel matches tidak dapat dibaca:', errorMessage(matchResult.error));
  }
  if (scoreResult.error) {
    console.warn('Supabase tabel match_scores tidak dapat dibaca:', errorMessage(scoreResult.error));
  }

  // Registration reads are intentionally private. Public pages receive an empty
  // registration list, while an authenticated admin receives the actual rows.
  const registrationRows = registrationResult.error
    ? []
    : ((registrationResult.data || []) as DatabaseRow[]);
  const matches = (matchResult.data || []) as DatabaseRow[];
  const scores = (scoreResult.data || []) as DatabaseRow[];
  const participantsByTournament = new Map<string, DatabaseRow[]>();
  const matchesByTournament = new Map<string, DatabaseRow[]>();
  const registrationsByTournament = new Map<string, DatabaseRow[]>();

  participantRows.forEach((participant) => {
    const id = asString(participant.tournament_id);
    participantsByTournament.set(id, [...(participantsByTournament.get(id) || []), participant]);
  });
  matches.forEach((match) => {
    const id = asString(match.tournament_id);
    matchesByTournament.set(id, [...(matchesByTournament.get(id) || []), match]);
  });
  registrationRows.forEach((registration) => {
    const id = asString(registration.tournament_id);
    registrationsByTournament.set(id, [
      ...(registrationsByTournament.get(id) || []),
      registration,
    ]);
  });

  return rows.map((row) =>
    tournamentFromRows(
      row,
      participantsByTournament.get(asString(row.id)) || [],
      matchesByTournament.get(asString(row.id)) || [],
      scores.filter((score) =>
        matchesByTournament.get(asString(row.id))?.some((match) => asString(match.id) === asString(score.match_id))
      ),
      registrationsByTournament.get(asString(row.id)) || []
    )
  );
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!error) return profile?.role === 'ADMIN';
    }

    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }

  return false;
}

function tournamentRow(tournament: Tournament) {
  return {
    id: tournament.id,
    name: tournament.name,
    sport: tournament.sport,
    category: tournament.category,
    category_label: tournament.categoryLabel,
    venue: tournament.venue,
    city: tournament.city,
    start_date: tournament.startDate,
    end_date: tournament.endDate,
    status: tournament.status,
    description: tournament.description,
    courts: tournament.courts,
    banner_url: tournament.bannerUrl || null,
    rules: tournament.rules,
    format: tournament.format || null,
    group_stage_completed: tournament.groupStageCompleted ?? false,
    group_schedule_scheme: tournament.groupScheduleScheme || null,
    created_at: tournament.createdAt,
  };
}

function participantRow(tournamentId: string, participant: Participant) {
  return {
    id: participant.id,
    tournament_id: tournamentId,
    name: participant.name,
    player1: participant.player1,
    player2: participant.player2 || null,
    seed: participant.seed ?? null,
    club: participant.club || null,
    reclub_id1: participant.reclubId1 || null,
    reclub_id2: participant.reclubId2 || null,
    whatsapp: participant.whatsapp || null,
    registration_id: participant.registrationId || null,
    group_name: participant.group || null,
    group_rank: participant.groupRank ?? null,
    group_points: participant.groupPoints ?? 0,
    group_wins: participant.groupWins ?? 0,
    group_losses: participant.groupLosses ?? 0,
    group_sets_won: participant.groupSetsWon ?? 0,
    group_sets_lost: participant.groupSetsLost ?? 0,
    group_set_diff: participant.groupSetDiff ?? 0,
    group_points_won: participant.groupPointsWon ?? 0,
    group_points_lost: participant.groupPointsLost ?? 0,
    group_point_diff: participant.groupPointDiff ?? 0,
  };
}

function registrationRow(registration: RegistrationRequest, processedBy: string | null) {
  return {
    id: registration.id,
    tournament_id: registration.tournamentId,
    sector: registration.sector,
    team_name: registration.teamName,
    player1_name: registration.player1Name,
    player2_name: registration.player2Name || null,
    reclub_id1: registration.reclubId1 || null,
    reclub_id2: registration.reclubId2 || null,
    whatsapp: registration.whatsapp,
    status: registration.status,
    processed_at: registration.status === 'PENDING' ? null : new Date().toISOString(),
    processed_by: registration.status === 'PENDING' ? null : processedBy,
    created_at: registration.createdAt,
  };
}

function normalizeTournamentForPersistence(tournament: Tournament): Tournament {
  const participantsByName = new Map<string, Participant>();
  const canonicalIdByParticipantId = new Map<string, string>();
  const participants: Participant[] = [];

  tournament.participants.forEach((participant) => {
    const normalizedName = participant.name.trim().toLowerCase();
    const existing = participantsByName.get(normalizedName);

    if (existing) {
      canonicalIdByParticipantId.set(participant.id, existing.id);
      return;
    }

    const canonicalParticipant = {
      ...participant,
      name: participant.name.trim(),
    };
    participantsByName.set(normalizedName, canonicalParticipant);
    canonicalIdByParticipantId.set(participant.id, canonicalParticipant.id);
    participants.push(canonicalParticipant);
  });

  const participantsById = new Map(participants.map((participant) => [participant.id, participant]));
  const canonicalParticipant = (participant: Participant | null): Participant | null => {
    if (!participant) return null;
    const canonicalId = canonicalIdByParticipantId.get(participant.id) || participant.id;
    return participantsById.get(canonicalId) || null;
  };

  const matches = tournament.matches.map((match) => {
    const participant1 = canonicalParticipant(match.participant1);
    const participant2 = canonicalParticipant(match.participant2);
    const winnerId = match.winnerId
      ? canonicalIdByParticipantId.get(match.winnerId) || match.winnerId
      : null;

    return {
      ...match,
      participant1,
      participant2,
      winnerId: winnerId && participantsById.has(winnerId) ? winnerId : null,
    };
  });

  return { ...tournament, participants, matches };
}

function matchRow(tournamentId: string, match: Match) {
  return {
    id: match.id,
    tournament_id: tournamentId,
    round_number: match.round,
    round_name: match.roundName,
    match_order: match.matchOrder,
    participant1_id: match.participant1?.id || null,
    participant2_id: match.participant2?.id || null,
    current_set: match.currentSet,
    serving_side: match.servingSide || null,
    court: match.court || null,
    scheduled_time: match.scheduledTime || null,
    referee: match.referee || null,
    status: match.status,
    winner_id: match.winnerId || null,
    next_match_id: match.nextMatchId || null,
    next_match_slot: match.nextMatchSlot || null,
    phase: match.phase || null,
    group_name: match.groupName || null,
  };
}

async function deleteMissingRows(
  table: 'registrations' | 'participants' | 'matches',
  tournamentId: string,
  currentIds: string[]
) {
  const existingResult = await supabase.from(table).select('id').eq('tournament_id', tournamentId);
  if (existingResult.error) {
    throw repositoryError(`Gagal membaca ${table}`, existingResult.error);
  }

  const existingIds = (existingResult.data || [])
    .map((row) => asString((row as DatabaseRow).id))
    .filter((id) => id && !currentIds.includes(id));

  if (existingIds.length === 0) return;

  const result = await supabase.from(table).delete().in('id', existingIds);
  if (result.error) {
    throw repositoryError(`Gagal menghapus data lama dari ${table}`, result.error);
  }
}

export async function saveTournamentsToSupabase(tournaments: Tournament[]): Promise<void> {
  if (!(await isCurrentUserAdmin())) {
    throw new Error('Hanya admin yang dapat menyimpan data turnamen.');
  }

  const { data: userResult } = await supabase.auth.getUser();
  const processedBy = userResult.user?.id || null;

  for (const tournament of tournaments) {
    const normalizedTournament = normalizeTournamentForPersistence(tournament);
    const tournamentResult = await supabase
      .from('tournaments')
      .upsert(tournamentRow(normalizedTournament));
    if (tournamentResult.error) {
      throw repositoryError(
        `Gagal menyimpan tournament ${normalizedTournament.id}`,
        tournamentResult.error
      );
    }

    const registrations = normalizedTournament.registrations || [];
    if (registrations.length > 0) {
      const result = await supabase
        .from('registrations')
        .upsert(registrations.map((registration) => registrationRow(registration, processedBy)));
      if (result.error) {
        throw repositoryError(
          `Gagal menyimpan registrations untuk ${normalizedTournament.id}`,
          result.error
        );
      }
    }
    await deleteMissingRows(
      'registrations',
      normalizedTournament.id,
      registrations.map((registration) => registration.id)
    );

    if (normalizedTournament.participants.length > 0) {
      const result = await supabase
        .from('participants')
        .upsert(
          normalizedTournament.participants.map((participant) =>
            participantRow(normalizedTournament.id, participant)
          )
        );
      if (result.error) {
        throw repositoryError(
          `Gagal menyimpan participants untuk ${normalizedTournament.id}`,
          result.error
        );
      }
    }
    await deleteMissingRows(
      'participants',
      normalizedTournament.id,
      normalizedTournament.participants.map((participant) => participant.id)
    );

    await deleteMissingRows(
      'matches',
      normalizedTournament.id,
      normalizedTournament.matches.map((match) => match.id)
    );
    if (normalizedTournament.matches.length > 0) {
      const result = await supabase
        .from('matches')
        .upsert(
          normalizedTournament.matches.map((match) => ({
            ...matchRow(normalizedTournament.id, match),
            next_match_id: null,
            next_match_slot: null,
          }))
        );
      if (result.error) {
        throw repositoryError(
          `Gagal menyimpan matches untuk ${normalizedTournament.id}`,
          result.error
        );
      }

      for (const match of normalizedTournament.matches) {
        if (!match.nextMatchId) continue;
        const result = await supabase
          .from('matches')
          .update({
            next_match_id: match.nextMatchId,
            next_match_slot: match.nextMatchSlot || null,
          })
          .eq('id', match.id);
        if (result.error) {
          throw repositoryError(`Gagal memperbarui relasi bracket ${match.id}`, result.error);
        }
      }
    }

    for (const match of normalizedTournament.matches) {
      const deleteScores = await supabase.from('match_scores').delete().eq('match_id', match.id);
      if (deleteScores.error) {
        throw repositoryError(`Gagal menghapus skor match ${match.id}`, deleteScores.error);
      }

      if (match.scores.length > 0) {
        const result = await supabase.from('match_scores').insert(
          match.scores.map((score) => ({
            match_id: match.id,
            set_number: score.setNumber,
            score1: score.score1,
            score2: score.score2,
          }))
        );
        if (result.error) {
          throw repositoryError(`Gagal menyimpan skor match ${match.id}`, result.error);
        }
      }
    }
  }

}

export async function insertRegistrationToSupabase(registration: RegistrationRequest): Promise<void> {
  const result = await supabase.from('registrations').insert(registrationRow(registration, null));
  if (result.error) {
    throw repositoryError('Gagal menyimpan pendaftaran publik', result.error);
  }
}

export async function deleteTournamentFromSupabase(tournamentId: string): Promise<void> {
  const result = await supabase.from('tournaments').delete().eq('id', tournamentId);
  if (result.error) {
    throw repositoryError(`Gagal menghapus tournament ${tournamentId}`, result.error);
  }
}

function ensureRealtimeChannel() {
  if (realtimeChannel) return;

  setRealtimeStatus('CONNECTING');
  realtimeChannel = supabase
    .channel('racket-arena-tournament-data')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tournaments' },
      () => realtimeListeners.forEach((listener) => listener())
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'registrations' },
      () => realtimeListeners.forEach((listener) => listener())
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'participants' },
      () => realtimeListeners.forEach((listener) => listener())
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matches' },
      () => realtimeListeners.forEach((listener) => listener())
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'match_scores' },
      () => realtimeListeners.forEach((listener) => listener())
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        setRealtimeStatus('CONNECTED');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setRealtimeStatus('ERROR');
        console.error('Supabase Realtime gagal terhubung:', errorMessage(error));
      } else if (status === 'CLOSED') {
        setRealtimeStatus('DISCONNECTED');
      }
    });
}

export function subscribeToTournamentChanges(listener: () => void): () => void {
  realtimeListeners.add(listener);
  ensureRealtimeChannel();

  return () => {
    realtimeListeners.delete(listener);
    if (realtimeListeners.size === 0 && realtimeChannel) {
      const channel = realtimeChannel;
      realtimeChannel = null;
      setRealtimeStatus('DISCONNECTED');
      void supabase.removeChannel(channel);
    }
  };
}

export function subscribeToRealtimeStatus(
  listener: (status: RealtimeConnectionStatus) => void
): () => void {
  realtimeStatusListeners.add(listener);
  listener(realtimeStatus);

  return () => {
    realtimeStatusListeners.delete(listener);
  };
}

export function getRealtimeStatus(): RealtimeConnectionStatus {
  return realtimeStatus;
}
