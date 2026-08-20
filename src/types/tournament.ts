export type SportType = 'BADMINTON' | 'PADEL';

export type TournamentCategory = 
  | 'MEN_SINGLES'
  | 'WOMEN_SINGLES'
  | 'MEN_DOUBLES'
  | 'WOMEN_DOUBLES'
  | 'MIXED_DOUBLES'
  | 'OPEN_DOUBLES';

export type MatchStatus = 'UPCOMING' | 'LIVE' | 'FINISHED' | 'WALKOVER';

export interface Participant {
  id: string;
  name: string;
  player1: string;
  player2?: string;
  seed?: number;
  club?: string;
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
  createdAt: string;
}
