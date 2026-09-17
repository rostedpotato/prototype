export type SparringStatus = 'DRAFT' | 'LIVE' | 'COMPLETED';
export type MatchStatus = 'PENDING' | 'ONGOING' | 'DONE';
export type CommunitySlot = 'A' | 'B';

export interface SparringPlayer {
  id: string;
  sparringId: string;
  community: CommunitySlot;
  name: string;
  level: string;
}

// Satu match = satu laga double: 2 pemain dari komunitas A melawan 2 pemain
// dari komunitas B. Skor hanya terisi setelah match dinyatakan selesai (DONE).
export interface SparringMatch {
  id: string;
  sparringId: string;
  position: number;
  status: MatchStatus;
  playerA1Id: string | null;
  playerA2Id: string | null;
  playerB1Id: string | null;
  playerB2Id: string | null;
  scoreA: number | null;
  scoreB: number | null;
  createdAt: string;
}

export interface Sparring {
  id: string;
  name: string;
  date: string;
  status: SparringStatus;
  communityAName: string;
  communityBName: string;
  players: SparringPlayer[];
  matches: SparringMatch[];
  createdAt: string;
}
