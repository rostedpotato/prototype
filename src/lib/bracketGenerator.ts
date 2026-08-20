import { Match, Participant, TournamentCategory } from '@/types/tournament';

export function getRoundName(totalRounds: number, currentRound: number): string {
  const roundFromFinal = totalRounds - currentRound;
  switch (roundFromFinal) {
    case 0:
      return 'Final';
    case 1:
      return 'Semifinal';
    case 2:
      return 'Perempat Final';
    case 3:
      return 'Babak 16 Besar';
    case 4:
      return 'Babak 32 Besar';
    default:
      return `Babak ${currentRound}`;
  }
}

export function generateBracketMatches(
  tournamentId: string,
  participants: Participant[],
  courts: string[] = ['Court 1', 'Court 2']
): Match[] {
  const count = participants.length;
  // Determine bracket power of 2 size (min 4, e.g. 4, 8, 16)
  let bracketSize = 4;
  if (count > 8) bracketSize = 16;
  else if (count > 4) bracketSize = 8;
  else bracketSize = 4;

  const totalRounds = Math.log2(bracketSize);
  const matches: Match[] = [];

  // Create matches round by round, working backwards or forwards.
  // First, generate IDs for all matches across all rounds.
  const roundMatchesMap: Map<number, Match[]> = new Map();

  let globalMatchCounter = 1;

  for (let r = 1; r <= totalRounds; r++) {
    const matchesInRound = bracketSize / Math.pow(2, r);
    const roundList: Match[] = [];

    for (let m = 0; m < matchesInRound; m++) {
      const matchId = `match_${tournamentId}_r${r}_m${m + 1}`;
      const courtIndex = (m) % courts.length;
      
      const newMatch: Match = {
        id: matchId,
        tournamentId,
        round: r,
        roundName: getRoundName(totalRounds, r),
        matchOrder: globalMatchCounter++,
        participant1: null,
        participant2: null,
        scores: [
          { setNumber: 1, score1: 0, score2: 0 },
          { setNumber: 2, score1: 0, score2: 0 },
          { setNumber: 3, score1: 0, score2: 0 },
        ],
        currentSet: 1,
        court: courts[courtIndex] || `Court 1`,
        scheduledTime: `${13 + r * 2}:00 WIB`,
        status: 'UPCOMING',
        winnerId: null,
        nextMatchId: null,
        nextMatchSlot: undefined,
      };

      roundList.push(newMatch);
    }
    roundMatchesMap.set(r, roundList);
  }

  // Link matches to their next round matches
  for (let r = 1; r < totalRounds; r++) {
    const currentRoundList = roundMatchesMap.get(r)!;
    const nextRoundList = roundMatchesMap.get(r + 1)!;

    for (let i = 0; i < currentRoundList.length; i++) {
      const parentMatch = currentRoundList[i];
      const targetMatchIndex = Math.floor(i / 2);
      const targetSlot = (i % 2 === 0 ? 1 : 2) as 1 | 2;

      const targetMatch = nextRoundList[targetMatchIndex];
      if (targetMatch) {
        parentMatch.nextMatchId = targetMatch.id;
        parentMatch.nextMatchSlot = targetSlot;
      }
    }
  }

  // Seed Round 1 with participants
  const round1Matches = roundMatchesMap.get(1)!;
  const seededParticipants = [...participants];

  // Fill seeded participants into Round 1
  for (let i = 0; i < round1Matches.length; i++) {
    const p1 = seededParticipants[i * 2] || null;
    const p2 = seededParticipants[i * 2 + 1] || null;

    round1Matches[i].participant1 = p1;
    round1Matches[i].participant2 = p2;
  }

  // Flatten all matches into a single list
  for (let r = 1; r <= totalRounds; r++) {
    matches.push(...(roundMatchesMap.get(r) || []));
  }

  return matches;
}

export function getCategoryLabel(category: TournamentCategory): string {
  switch (category) {
    case 'MEN_SINGLES':
      return 'Tunggal Putra (MS)';
    case 'WOMEN_SINGLES':
      return 'Tunggal Putri (WS)';
    case 'MEN_DOUBLES':
      return 'Ganda Putra (MD)';
    case 'WOMEN_DOUBLES':
      return 'Ganda Putri (WD)';
    case 'MIXED_DOUBLES':
      return 'Ganda Campuran (XD)';
    case 'OPEN_DOUBLES':
      return 'Ganda Open (Padel/Badminton)';
    default:
      return 'Open Category';
  }
}
