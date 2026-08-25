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
        referee: `Wasit ${courtIndex + 1}`,
        status: 'UPCOMING',
        winnerId: null,
        nextMatchId: null,
        nextMatchSlot: undefined,
        phase: 'KNOCKOUT_UPPER', // Default to upper bracket for existing knockout format
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

/**
 * Generate Group Stage matches for Two-Stage Tournament
 * 16 participants divided into 4 groups (A, B, C, D) with 4 teams each
 * Each group plays round-robin (6 matches per group, 24 total)
 */
export function generateGroupStageMatches(
  tournamentId: string,
  participants: Participant[],
  courts: string[] = ['Court 1', 'Court 2', 'Court 3', 'Court 4']
): { matches: Match[]; groupedParticipants: Participant[] } {
  const groups = ['Grup 1', 'Grup 2', 'Grup 3', 'Grup 4'];
  const participantsPerGroup = 4;
  
  const groupedParticipants: Participant[] = [];
  const groupMaps: Record<string, Participant[]> = {
    'Grup 1': [],
    'Grup 2': [],
    'Grup 3': [],
    'Grup 4': [],
  };

  // Shuffle participants randomly (no seeding for registered players)
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  
  // Distribute into 4 groups of 4 (round-robin assignment)
  for (let i = 0; i < shuffled.length && i < 16; i++) {
    const p = { ...shuffled[i] };
    const groupIndex = i % 4;
    
    p.group = groups[groupIndex];
    p.groupPoints = 0;
    p.groupWins = 0;
    p.groupLosses = 0;
    p.groupRank = 0;
    
    groupedParticipants.push(p);
    groupMaps[p.group].push(p);
  }

  // Generate round-robin matches for each group
  const matches: Match[] = [];
  let matchOrder = 1;

  groups.forEach((groupName) => {
    const groupTeams = groupMaps[groupName];
    if (groupTeams.length !== 4) return;

    // Round-robin: each team plays every other team once
    // 4 teams = C(4,2) = 6 matches per group
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        const team1 = groupTeams[i];
        const team2 = groupTeams[j];
        
        const matchId = `group_${tournamentId}_${groupName.replace(' ', '')}_m${matchOrder}`;
        const courtIndex = (matchOrder - 1) % courts.length;
        
        const groupMatch: Match = {
          id: matchId,
          tournamentId,
          round: 1, // All group matches are "round 1" in group phase
          roundName: `Fase Grup - ${groupName}`,
          matchOrder: matchOrder++,
          participant1: team1,
          participant2: team2,
          scores: Array.from({ length: 5 }, (_, i) => ({ setNumber: i + 1, score1: 0, score2: 0 })),
          currentSet: 1,
          court: courts[courtIndex] || `Court 1`,
          scheduledTime: '09:00 WIB',
          referee: `Wasit ${courtIndex + 1}`,
          status: 'UPCOMING',
          winnerId: null,
          nextMatchId: null,
          nextMatchSlot: undefined,
          phase: 'GROUP',
          groupName: groupName,
        };
        
        matches.push(groupMatch);
      }
    }
  });

  return { matches, groupedParticipants };
}

/**
 * Generate Knockout Stage matches after Group Stage completes
 * Top 2 from each group -> Upper Bracket (8 teams)
 * Bottom 2 from each group -> Bottom Bracket (8 teams)
 */
export function generateKnockoutStageFromGroups(
  tournamentId: string,
  groupedParticipants: Participant[],
  courts: string[] = ['Court 1', 'Court 2']
): { upperBracketMatches: Match[]; bottomBracketMatches: Match[] } {
  // Sort each group by points, set difference, point difference, then seed
  const groups = ['Grup 1', 'Grup 2', 'Grup 3', 'Grup 4'];
  const rankedGroups: Record<string, Participant[]> = {};
  
  groups.forEach((groupName) => {
    const groupTeams = groupedParticipants.filter((p) => p.group === groupName);
    const sorted = groupTeams.sort((a, b) => {
      // 1. Points (PTS: +1 per win)
      if ((b.groupPoints || 0) !== (a.groupPoints || 0)) {
        return (b.groupPoints || 0) - (a.groupPoints || 0);
      }
      // 2. Set Difference (SD)
      const setDiffA = a.groupSetDiff ?? 0;
      const setDiffB = b.groupSetDiff ?? 0;
      if (setDiffB !== setDiffA) {
        return setDiffB - setDiffA;
      }
      // 3. Point Difference (PD)
      const ptDiffA = a.groupPointDiff ?? 0;
      const ptDiffB = b.groupPointDiff ?? 0;
      if (ptDiffB !== ptDiffA) {
        return ptDiffB - ptDiffA;
      }
      // 4. Points Won (PW)
      const ptsWonA = a.groupPointsWon ?? 0;
      const ptsWonB = b.groupPointsWon ?? 0;
      if (ptsWonB !== ptsWonA) {
        return ptsWonB - ptsWonA;
      }
      // 5. Seed
      return (a.seed || 999) - (b.seed || 999);
    });
    
    // Assign ranks
    sorted.forEach((p, idx) => {
      p.groupRank = idx + 1;
    });
    
    rankedGroups[groupName] = sorted;
  });

  // Extract Top 2 and Bottom 2 from each group
  const upperBracketTeams: Participant[] = [];
  const bottomBracketTeams: Participant[] = [];
  
  groups.forEach((groupName) => {
    const ranked = rankedGroups[groupName];
    // Top 2 go to Upper Bracket
    upperBracketTeams.push({ ...ranked[0], group: undefined, groupRank: undefined, groupPoints: undefined, groupWins: undefined, groupLosses: undefined });
    upperBracketTeams.push({ ...ranked[1], group: undefined, groupRank: undefined, groupPoints: undefined, groupWins: undefined, groupLosses: undefined });
    
    // Bottom 2 go to Bottom Bracket
    bottomBracketTeams.push({ ...ranked[2], group: undefined, groupRank: undefined, groupPoints: undefined, groupWins: undefined, groupLosses: undefined });
    bottomBracketTeams.push({ ...ranked[3], group: undefined, groupRank: undefined, groupPoints: undefined, groupWins: undefined, groupLosses: undefined });
  });

  // Seeding for knockout: ensure teams from same group don't meet in quarterfinals
  // Standard seeding: 1A vs 2B, 1C vs 2D, 1B vs 2A, 1D vs 2C (for upper)
  const seedUpperBracket = () => {
    const seeded: (Participant | null)[] = new Array(8).fill(null);
    
    // Place group winners and runners-up in specific positions
    // Position mapping to avoid same-group matchups in QF
    seeded[0] = rankedGroups['Grup 1'][0]; // 1A
    seeded[1] = rankedGroups['Grup 2'][1]; // 2B
    seeded[2] = rankedGroups['Grup 3'][0]; // 1C
    seeded[3] = rankedGroups['Grup 4'][1]; // 2D
    seeded[4] = rankedGroups['Grup 2'][0]; // 1B
    seeded[5] = rankedGroups['Grup 1'][1]; // 2A
    seeded[6] = rankedGroups['Grup 4'][0]; // 1D
    seeded[7] = rankedGroups['Grup 3'][1]; // 2C
    
    return seeded.map((p) => p ? { ...p, group: undefined, groupRank: undefined, groupPoints: undefined, groupWins: undefined, groupLosses: undefined } : null);
  };

  const seedBottomBracket = () => {
    const seeded: (Participant | null)[] = new Array(8).fill(null);
    
    // Similar logic for bottom bracket
    seeded[0] = rankedGroups['Grup 1'][2]; // 3A
    seeded[1] = rankedGroups['Grup 2'][3]; // 4B
    seeded[2] = rankedGroups['Grup 3'][2]; // 3C
    seeded[3] = rankedGroups['Grup 4'][3]; // 4D
    seeded[4] = rankedGroups['Grup 2'][2]; // 3B
    seeded[5] = rankedGroups['Grup 1'][3]; // 4A
    seeded[6] = rankedGroups['Grup 4'][2]; // 3D
    seeded[7] = rankedGroups['Grup 3'][3]; // 4C
    
    return seeded.map((p) => p ? { ...p, group: undefined, groupRank: undefined, groupPoints: undefined, groupWins: undefined, groupLosses: undefined } : null);
  };

  const generateQuarterFinals = (teams: (Participant | null)[], phase: 'KNOCKOUT_UPPER' | 'KNOCKOUT_BOTTOM') => {
    const qfMatches: Match[] = [];
    
    for (let i = 0; i < 4; i++) {
      const p1 = teams[i * 2];
      const p2 = teams[i * 2 + 1];
      
      const matchId = `${phase === 'KNOCKOUT_UPPER' ? 'upper' : 'bottom'}_qf_${tournamentId}_m${i + 1}`;
      const courtIndex = i % courts.length;
      
      qfMatches.push({
        id: matchId,
        tournamentId,
        round: 1, // Quarterfinals = round 1 of knockout
        roundName: phase === 'KNOCKOUT_UPPER' ? 'Perempat Final Upper' : 'Perempat Final Bottom',
        matchOrder: i + 1,
        participant1: p1,
        participant2: p2,
        scores: Array.from({ length: 5 }, (_, sIdx) => ({ setNumber: sIdx + 1, score1: 0, score2: 0 })),
        currentSet: 1,
        court: courts[courtIndex] || `Court 1`,
        scheduledTime: '14:00 WIB',
        referee: `Wasit ${courtIndex + 1}`,
        status: 'UPCOMING',
        winnerId: null,
        nextMatchId: null,
        nextMatchSlot: undefined,
        phase: phase,
      });
    }
    
    return qfMatches;
  };

  const generateSemifinals = (phase: 'KNOCKOUT_UPPER' | 'KNOCKOUT_BOTTOM') => {
    const sfMatches: Match[] = [];
    
    for (let i = 0; i < 2; i++) {
      const matchId = `${phase === 'KNOCKOUT_UPPER' ? 'upper' : 'bottom'}_sf_${tournamentId}_m${i + 1}`;
      const courtIndex = i % courts.length;
      
      sfMatches.push({
        id: matchId,
        tournamentId,
        round: 2, // Semifinals = round 2
        roundName: phase === 'KNOCKOUT_UPPER' ? 'Semifinal Upper' : 'Semifinal Bottom',
        matchOrder: i + 5, // After QF
        participant1: null,
        participant2: null,
        scores: Array.from({ length: 7 }, (_, sIdx) => ({ setNumber: sIdx + 1, score1: 0, score2: 0 })),
        currentSet: 1,
        court: courts[courtIndex] || `Court 1`,
        scheduledTime: '16:00 WIB',
        referee: `Wasit ${courtIndex + 1}`,
        status: 'UPCOMING',
        winnerId: null,
        nextMatchId: null,
        nextMatchSlot: undefined,
        phase: phase,
      });
    }
    
    return sfMatches;
  };

  const generateFinal = (phase: 'KNOCKOUT_UPPER' | 'KNOCKOUT_BOTTOM') => {
    const finalMatch: Match = {
      id: `${phase === 'KNOCKOUT_UPPER' ? 'upper' : 'bottom'}_final_${tournamentId}`,
      tournamentId,
      round: 3, // Final = round 3
      roundName: phase === 'KNOCKOUT_UPPER' ? 'Final Bagan Atas' : 'Final Bagan Bawah',
      matchOrder: 7,
      participant1: null,
      participant2: null,
      scores: Array.from({ length: 11 }, (_, sIdx) => ({ setNumber: sIdx + 1, score1: 0, score2: 0 })),
      currentSet: 1,
      court: courts[0] || 'Court 1',
      scheduledTime: '18:00 WIB',
      referee: 'Wasit 1',
      status: 'UPCOMING',
      winnerId: null,
      nextMatchId: null,
      nextMatchSlot: undefined,
      phase: phase,
    };
    
    return finalMatch;
  };

  // Build Upper Bracket
  const upperQF = generateQuarterFinals(seedUpperBracket(), 'KNOCKOUT_UPPER');
  const upperSF = generateSemifinals('KNOCKOUT_UPPER');
  const upperFinal = generateFinal('KNOCKOUT_UPPER');
  
  // Link Upper Bracket matches
  upperQF[0].nextMatchId = upperSF[0].id;
  upperQF[0].nextMatchSlot = 1;
  upperQF[1].nextMatchId = upperSF[0].id;
  upperQF[1].nextMatchSlot = 2;
  upperQF[2].nextMatchId = upperSF[1].id;
  upperQF[2].nextMatchSlot = 1;
  upperQF[3].nextMatchId = upperSF[1].id;
  upperQF[3].nextMatchSlot = 2;
  
  upperSF[0].nextMatchId = upperFinal.id;
  upperSF[0].nextMatchSlot = 1;
  upperSF[1].nextMatchId = upperFinal.id;
  upperSF[1].nextMatchSlot = 2;

  // Build Bottom Bracket
  const bottomQF = generateQuarterFinals(seedBottomBracket(), 'KNOCKOUT_BOTTOM');
  const bottomSF = generateSemifinals('KNOCKOUT_BOTTOM');
  const bottomFinal = generateFinal('KNOCKOUT_BOTTOM');
  
  // Link Bottom Bracket matches
  bottomQF[0].nextMatchId = bottomSF[0].id;
  bottomQF[0].nextMatchSlot = 1;
  bottomQF[1].nextMatchId = bottomSF[0].id;
  bottomQF[1].nextMatchSlot = 2;
  bottomQF[2].nextMatchId = bottomSF[1].id;
  bottomQF[2].nextMatchSlot = 1;
  bottomQF[3].nextMatchId = bottomSF[1].id;
  bottomQF[3].nextMatchSlot = 2;
  
  bottomSF[0].nextMatchId = bottomFinal.id;
  bottomSF[0].nextMatchSlot = 1;
  bottomSF[1].nextMatchId = bottomFinal.id;
  bottomSF[1].nextMatchSlot = 2;

  return {
    upperBracketMatches: [...upperQF, ...upperSF, upperFinal],
    bottomBracketMatches: [...bottomQF, ...bottomSF, bottomFinal],
  };
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
