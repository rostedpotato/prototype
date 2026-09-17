'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { getDisplayStatus } from '@/lib/sparingUtils';
import type {
  CommunitySlot,
  MatchStatus,
  Sparring,
  SparringMatch,
  SparringPlayer,
  SparringStatus,
} from '@/types/sparing';

type DatabaseRow = Record<string, unknown>;

const supabase = createClient();
const realtimeListeners = new Set<() => void>();
let realtimeChannel: RealtimeChannel | null = null;

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const value = error as Record<string, unknown>;
    if (typeof value.message === 'string') return value.message;
    if (typeof value.details === 'string') return value.details;
  }
  return String(error);
}

function repositoryError(context: string, error: unknown): Error {
  return new Error(`${context}: ${errorMessage(error)}`);
}

function playerFromRow(row: DatabaseRow): SparringPlayer {
  return {
    id: asString(row.id),
    sparringId: asString(row.sparring_id),
    community: asString(row.community, 'A') as CommunitySlot,
    name: asString(row.name),
    level: asString(row.level),
  };
}

function matchFromRow(row: DatabaseRow): SparringMatch {
  return {
    id: asString(row.id),
    sparringId: asString(row.sparring_id),
    position: asNumber(row.position, 1),
    status: asString(row.status, 'PENDING') as MatchStatus,
    playerA1Id: asStringOrNull(row.player_a1_id),
    playerA2Id: asStringOrNull(row.player_a2_id),
    playerB1Id: asStringOrNull(row.player_b1_id),
    playerB2Id: asStringOrNull(row.player_b2_id),
    scoreA: asNumberOrNull(row.score_a),
    scoreB: asNumberOrNull(row.score_b),
    createdAt: asString(row.created_at, new Date().toISOString()),
  };
}

function sparringFromRow(
  row: DatabaseRow,
  players: SparringPlayer[],
  matches: SparringMatch[]
): Sparring {
  return {
    id: asString(row.id),
    name: asString(row.name),
    date: asString(row.sparring_date),
    status: asString(row.status, 'DRAFT') as SparringStatus,
    communityAName: asString(row.community_a_name),
    communityBName: asString(row.community_b_name),
    players,
    matches,
    createdAt: asString(row.created_at, new Date().toISOString()),
  };
}

export async function loadSparringsFromSupabase(): Promise<Sparring[]> {
  const sparringResult = await supabase
    .from('sparrings')
    .select('*')
    .order('sparring_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (sparringResult.error) {
    throw repositoryError('Gagal memuat data sparing', sparringResult.error);
  }

  const sparringRows = (sparringResult.data || []) as DatabaseRow[];
  if (sparringRows.length === 0) return [];

  const sparringIds = sparringRows.map((row) => asString(row.id));

  const playerResult = await supabase
    .from('sparring_players')
    .select('*')
    .in('sparring_id', sparringIds)
    .order('created_at');

  if (playerResult.error) {
    throw repositoryError('Gagal memuat pemain sparing', playerResult.error);
  }

  const matchResult = await supabase
    .from('sparring_matches')
    .select('*')
    .in('sparring_id', sparringIds)
    .order('position')
    .order('created_at');

  if (matchResult.error) {
    throw repositoryError('Gagal memuat match sparing', matchResult.error);
  }

  const playersBySparring = new Map<string, SparringPlayer[]>();
  ((playerResult.data || []) as DatabaseRow[]).map(playerFromRow).forEach((player) => {
    playersBySparring.set(player.sparringId, [
      ...(playersBySparring.get(player.sparringId) || []),
      player,
    ]);
  });

  const matchesBySparring = new Map<string, SparringMatch[]>();
  ((matchResult.data || []) as DatabaseRow[]).map(matchFromRow).forEach((match) => {
    matchesBySparring.set(match.sparringId, [
      ...(matchesBySparring.get(match.sparringId) || []),
      match,
    ]);
  });

  return sparringRows.map((row) =>
    sparringFromRow(
      row,
      playersBySparring.get(asString(row.id)) || [],
      matchesBySparring.get(asString(row.id)) || []
    )
  );
}

function sparringRow(sparring: Sparring) {
  return {
    id: sparring.id,
    name: sparring.name.trim(),
    sparring_date: sparring.date,
    // Status sesi selalu turunan dari status match (lihat getDisplayStatus).
    status: getDisplayStatus(sparring),
    community_a_name: sparring.communityAName.trim(),
    community_b_name: sparring.communityBName.trim(),
    created_at: sparring.createdAt,
  };
}

function playerRow(player: SparringPlayer) {
  return {
    id: player.id,
    sparring_id: player.sparringId,
    community: player.community,
    name: player.name.trim(),
    level: player.level.trim(),
  };
}

function matchRow(match: SparringMatch) {
  return {
    id: match.id,
    sparring_id: match.sparringId,
    position: Math.max(1, match.position),
    status: match.status,
    player_a1_id: match.playerA1Id,
    player_a2_id: match.playerA2Id,
    player_b1_id: match.playerB1Id,
    player_b2_id: match.playerB2Id,
    score_a: match.scoreA,
    score_b: match.scoreB,
  };
}

export async function saveSparringToSupabase(sparring: Sparring): Promise<void> {
  const validPlayers = sparring.players.filter((player) => player.name.trim());
  const sparringResult = await supabase.from('sparrings').upsert(sparringRow(sparring));

  if (sparringResult.error) {
    throw repositoryError('Gagal menyimpan sparing', sparringResult.error);
  }

  if (validPlayers.length > 0) {
    const playerResult = await supabase
      .from('sparring_players')
      .upsert(validPlayers.map(playerRow));
    if (playerResult.error) {
      throw repositoryError('Gagal menyimpan pemain sparing', playerResult.error);
    }
  }

  const playerIds = validPlayers.map((player) => player.id);
  const deletePlayerQuery = supabase
    .from('sparring_players')
    .delete()
    .eq('sparring_id', sparring.id);
  const deletePlayerResult = playerIds.length > 0
    ? await deletePlayerQuery.not('id', 'in', `(${playerIds.join(',')})`)
    : await deletePlayerQuery;

  if (deletePlayerResult.error) {
    throw repositoryError('Gagal memperbarui daftar pemain sparing', deletePlayerResult.error);
  }

  const matchResult = await supabase
    .from('sparring_matches')
    .upsert(sparring.matches.map(matchRow));
  if (matchResult.error) {
    throw repositoryError('Gagal menyimpan match sparing', matchResult.error);
  }

  const matchIds = sparring.matches.map((match) => match.id);
  const deleteMatchQuery = supabase
    .from('sparring_matches')
    .delete()
    .eq('sparring_id', sparring.id);
  const deleteMatchResult = matchIds.length > 0
    ? await deleteMatchQuery.not('id', 'in', `(${matchIds.join(',')})`)
    : await deleteMatchQuery;

  if (deleteMatchResult.error) {
    throw repositoryError('Gagal memperbarui daftar match sparing', deleteMatchResult.error);
  }
}

export async function deleteSparringFromSupabase(sparringId: string): Promise<void> {
  const result = await supabase.from('sparrings').delete().eq('id', sparringId);
  if (result.error) {
    throw repositoryError('Gagal menghapus sparing', result.error);
  }
}

function ensureRealtimeChannel() {
  if (realtimeChannel) return;

  realtimeChannel = supabase
    .channel('racket-arena-sparing-data')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sparrings' },
      () => realtimeListeners.forEach((listener) => listener())
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sparring_players' },
      () => realtimeListeners.forEach((listener) => listener())
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sparring_matches' },
      () => realtimeListeners.forEach((listener) => listener())
    )
    .subscribe();
}

export function subscribeToSparingChanges(listener: () => void): () => void {
  realtimeListeners.add(listener);
  ensureRealtimeChannel();

  return () => {
    realtimeListeners.delete(listener);
    if (realtimeListeners.size === 0 && realtimeChannel) {
      const channel = realtimeChannel;
      realtimeChannel = null;
      void supabase.removeChannel(channel);
    }
  };
}
