import type {
  CommunitySlot,
  Sparring,
  SparringMatch,
  SparringPlayer,
  SparringStatus,
} from '@/types/sparing';

export function sortMatches(matches: SparringMatch[]): SparringMatch[] {
  return [...matches].sort(
    (a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt)
  );
}

// Status sesi diturunkan dari match-nya: ada match berjalan = LIVE,
// sudah ada match selesai = COMPLETED, belum ada match = DRAFT.
export function getDisplayStatus(sparring: Sparring): SparringStatus {
  if (sparring.matches.some((match) => match.status === 'ONGOING')) return 'LIVE';
  if (sparring.matches.some((match) => match.status === 'DONE')) return 'COMPLETED';
  return 'DRAFT';
}

export function hasOngoingMatch(sparring: Sparring): boolean {
  return sparring.matches.some((match) => match.status === 'ONGOING');
}

// Match otomatis menjadi ONGOING ketika keempat pemain sudah dipilih, dan
// kembali PENDING bila salah satu slot dikosongkan.
export function normalizeMatchStatus(match: SparringMatch): SparringMatch {
  const complete = Boolean(
    match.playerA1Id && match.playerA2Id && match.playerB1Id && match.playerB2Id
  );
  if (match.status === 'PENDING' && complete) return { ...match, status: 'ONGOING' };
  if (match.status === 'ONGOING' && !complete) return { ...match, status: 'PENDING' };
  return match;
}

export function getPlayerMap(sparring: Sparring): Map<string, SparringPlayer> {
  return new Map(sparring.players.map((player) => [player.id, player]));
}

export function matchWinnerSlot(match: SparringMatch): CommunitySlot | null {
  if (match.status !== 'DONE' || match.scoreA === null || match.scoreB === null) return null;
  if (match.scoreA === match.scoreB) return null;
  return match.scoreA > match.scoreB ? 'A' : 'B';
}

export interface CommunityRecord {
  won: number;
  lost: number;
  played: number;
}

export function communityRecord(sparring: Sparring, community: CommunitySlot): CommunityRecord {
  let won = 0;
  let lost = 0;
  for (const match of sparring.matches) {
    const winner = matchWinnerSlot(match);
    if (!winner) continue;
    if (winner === community) won += 1;
    else lost += 1;
  }
  return { won, lost, played: won + lost };
}

export interface PlayerStatCell {
  match: SparringMatch;
  matchNo: number;
  inMatch: boolean;
  score: number | null;
  won: boolean | null;
}

export interface PlayerStatRow {
  player: SparringPlayer;
  cells: PlayerStatCell[];
  wins: number;
  played: number;
}

// Baris tabel statistik per pemain: satu kolom untuk tiap match, berisi skor
// sisi komunitas pemain tersebut, plus total kemenangan.
export function getPlayerStatRows(sparring: Sparring, community: CommunitySlot): PlayerStatRow[] {
  const matches = sortMatches(sparring.matches);
  return sparring.players
    .filter((player) => player.community === community && player.name.trim())
    .map((player) => {
      let wins = 0;
      let played = 0;
      const cells = matches.map((match, index) => {
        const inMatch = [
          match.playerA1Id,
          match.playerA2Id,
          match.playerB1Id,
          match.playerB2Id,
        ].includes(player.id);
        if (!inMatch) {
          return { match, matchNo: index + 1, inMatch, score: null, won: null };
        }
        played += 1;
        const score = match.status === 'DONE' ? (community === 'A' ? match.scoreA : match.scoreB) : null;
        const won = matchWinnerSlot(match) === community;
        if (won) wins += 1;
        return { match, matchNo: index + 1, inMatch, score, won };
      });
      return { player, cells, wins, played };
    });
}

export function statusStyle(status: SparringStatus) {
  if (status === 'COMPLETED') return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
  if (status === 'LIVE') return 'bg-red-500/15 border-red-500/30 text-red-300';
  return 'bg-slate-800 border-slate-700 text-slate-300';
}

export function statusLabel(status: SparringStatus) {
  if (status === 'COMPLETED') return 'SELESAI';
  if (status === 'LIVE') return 'SEDANG BERLANGSUNG';
  return 'DRAFT';
}

export function matchStatusLabel(status: SparringMatch['status']) {
  if (status === 'ONGOING') return 'BERLANGSUNG';
  if (status === 'DONE') return 'SELESAI';
  return 'MENUNGGU';
}
