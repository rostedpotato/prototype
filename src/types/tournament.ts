export type SportType = 'BADMINTON' | 'PADEL';

export type TournamentCategory = 
  | 'MEN_SINGLES'
  | 'WOMEN_SINGLES'
  | 'MEN_DOUBLES'
  | 'WOMEN_DOUBLES'
  | 'MIXED_DOUBLES'
  | 'OPEN_DOUBLES';

export type TournamentFormat = 'KNOCKOUT' | 'TWO_STAGE';

export type MatchStatus = 'UPCOMING' | 'LIVE' | 'FINISHED' | 'WALKOVER';

export interface Participant {
  id: string;
  name: string;
  player1: string;
  player2?: string;
  seed?: number;
  club?: string;
  // For Two-Stage Tournament
  group?: string; // 'Grup 1', 'Grup 2', 'Grup 3', 'Grup 4'
  groupRank?: number; // 1, 2, 3, 4 - final ranking in group stage
  groupPoints?: number; // Total points earned in group stage
  groupWins?: number; // Total wins in group stage
  groupLosses?: number; // Total losses in group stage
}

export interface SetScore {
  setNumber: number;
  score1: number;
  score2: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number; // 1: R16, 2: QF, 3: SF, 4: Final (or dynamic depending on bracket size)
  roundName: string; // "Babak 16 Besar", "Perempat Final", "Semifinal", "Final"
  matchOrder: number;
  participant1: Participant | null;
  participant2: Participant | null;
  scores: SetScore[];
  currentSet: number;
  servingSide?: 1 | 2; // 1 for participant1, 2 for participant2
  court?: string;
  scheduledTime?: string;
  status: MatchStatus;
  winnerId?: string | null;
  nextMatchId?: string | null;
  nextMatchSlot?: 1 | 2; // 1 = participant1, 2 = participant2
  // For Two-Stage Tournament
  phase?: 'GROUP' | 'KNOCKOUT_UPPER' | 'KNOCKOUT_BOTTOM'; // Group stage or which knockout bracket
  groupName?: string; // 'Grup 1', 'Grup 2', etc. for group stage matches
}

export interface Tournament {
  id: string;
  name: string;
  sport: SportType;
  category: TournamentCategory;
  categoryLabel: string;
  venue: string;
  city: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  description: string;
  courts: string[];
  bannerUrl?: string;
  participants: Participant[];
  matches: Match[];
  rules: {
    pointsPerSet: number; // 21 for Badminton, 6 for Padel
    maxSets: number; // usually 3 (best of 3)
    deuceMargin: number; // 2 points margin
    maxPointCap?: number; // 30 for badminton
  };
  // For Two-Stage Tournament
  format?: TournamentFormat; // 'KNOCKOUT' or 'TWO_STAGE'
  groupStageCompleted?: boolean; // Whether group stage is finished
  createdAt: string;
}
