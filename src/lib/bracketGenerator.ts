import { Match, Participant, TournamentCategory, GroupScheduleScheme } from '@/types/tournament';

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
/**
 * Calculates slot time given start time string (e.g. "08:00 WIB"), slot index, and duration
 */
export function calculateSlotTime(
  startTimeStr: string = '08:00 WIB',
  slotIndex: number,
  slotDurationMinutes: number = 45
): string {
  const clean = (startTimeStr || '08:00').replace(/[^0-9:]/g, '');
  const [hStr, mStr] = clean.split(':');
  const startHour = parseInt(hStr || '8', 10);
  const startMin = parseInt(mStr || '0', 10);

  const totalMin = startHour * 60 + startMin + slotIndex * slotDurationMinutes;
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} WIB`;
}

/**
 * Re-applies court, referee, time, and match order based on chosen scheduling scheme
 * (Split Wave or Rolling Round-Robin)
 */
export function applyGroupStageSchedule(
  allMatches: Match[],
  courts: string[] = ['Court 1', 'Court 2', 'Court 3'],
  scheme: GroupScheduleScheme = 'SPLIT_WAVE',
  startTime: string = '08:00 WIB',
  slotDurationMinutes: number = 45
): Match[] {
  const groupMatches = allMatches.filter((m) => m.phase === 'GROUP');
  const nonGroupMatches = allMatches.filter((m) => m.phase !== 'GROUP');

  if (groupMatches.length === 0) return allMatches;

  const groups = ['Grup 1', 'Grup 2', 'Grup 3', 'Grup 4'];
  const groupMatchesMap: Record<string, Match[]> = {
    'Grup 1': [],
    'Grup 2': [],
    'Grup 3': [],
    'Grup 4': [],
  };

  groupMatches.forEach((m) => {
    const g =
      m.groupName ||
      (m.roundName?.includes('Grup 1')
        ? 'Grup 1'
        : m.roundName?.includes('Grup 2')
        ? 'Grup 2'
        : m.roundName?.includes('Grup 3')
        ? 'Grup 3'
        : 'Grup 4');
    if (groupMatchesMap[g]) {
      groupMatchesMap[g].push(m);
    }
  });

  const orderedMatches: Match[] = [];

  if (scheme === 'ROLLING_ROUND') {
    // Round 1 across all 4 groups
    groups.forEach((g) => {
      if (groupMatchesMap[g]?.[0]) orderedMatches.push(groupMatchesMap[g][0]);
      if (groupMatchesMap[g]?.[1]) orderedMatches.push(groupMatchesMap[g][1]);
    });
    // Round 2 across all 4 groups
    groups.forEach((g) => {
      if (groupMatchesMap[g]?.[2]) orderedMatches.push(groupMatchesMap[g][2]);
      if (groupMatchesMap[g]?.[3]) orderedMatches.push(groupMatchesMap[g][3]);
    });
    // Round 3 across all 4 groups
    groups.forEach((g) => {
      if (groupMatchesMap[g]?.[4]) orderedMatches.push(groupMatchesMap[g][4]);
      if (groupMatchesMap[g]?.[5]) orderedMatches.push(groupMatchesMap[g][5]);
    });
  } else {
    // SPLIT_WAVE (Gelombang 1: Grup 1 & 2, Gelombang 2: Grup 3 & 4)
    const g1 = groupMatchesMap['Grup 1'] || [];
    const g2 = groupMatchesMap['Grup 2'] || [];
    if (g1[0]) orderedMatches.push(g1[0]);
    if (g1[1]) orderedMatches.push(g1[1]);
    if (g2[0]) orderedMatches.push(g2[0]);
    if (g2[1]) orderedMatches.push(g2[1]);
    if (g1[2]) orderedMatches.push(g1[2]);
    if (g2[2]) orderedMatches.push(g2[2]);
    if (g1[3]) orderedMatches.push(g1[3]);
    if (g2[3]) orderedMatches.push(g2[3]);
    if (g1[4]) orderedMatches.push(g1[4]);
    if (g1[5]) orderedMatches.push(g1[5]);
    if (g2[4]) orderedMatches.push(g2[4]);
    if (g2[5]) orderedMatches.push(g2[5]);

    const g3 = groupMatchesMap['Grup 3'] || [];
    const g4 = groupMatchesMap['Grup 4'] || [];
    if (g3[0]) orderedMatches.push(g3[0]);
    if (g3[1]) orderedMatches.push(g3[1]);
    if (g4[0]) orderedMatches.push(g4[0]);
    if (g4[1]) orderedMatches.push(g4[1]);
    if (g3[2]) orderedMatches.push(g3[2]);
    if (g4[2]) orderedMatches.push(g4[2]);
    if (g3[3]) orderedMatches.push(g3[3]);
    if (g4[3]) orderedMatches.push(g4[3]);
    if (g3[4]) orderedMatches.push(g3[4]);
    if (g3[5]) orderedMatches.push(g3[5]);
    if (g4[4]) orderedMatches.push(g4[4]);
    if (g4[5]) orderedMatches.push(g4[5]);
  }

  // Any remaining group matches
  const orderedIds = new Set(orderedMatches.map((m) => m.id));
  groupMatches.forEach((m) => {
    if (!orderedIds.has(m.id)) {
      orderedMatches.push(m);
    }
  });

  const actualCourts = courts.length > 0 ? courts : ['Court 1', 'Court 2', 'Court 3'];
  const updatedGroupMatches = orderedMatches.map((m, idx) => {
    const slotIndex = Math.floor(idx / actualCourts.length);
    const courtIndex = idx % actualCourts.length;
    return {
      ...m,
      matchOrder: idx + 1,
      court: actualCourts[courtIndex] || `Court ${courtIndex + 1}`,
      referee: `Wasit ${courtIndex + 1}`,
      scheduledTime: calculateSlotTime(startTime, slotIndex, slotDurationMinutes),
    };
  });

  return [...updatedGroupMatches, ...nonGroupMatches];
}

/**
 * Generate Group Stage matches for TWO_STAGE Tournament
 * 16 participants divided into 4 groups (A, B, C, D) with 4 teams each
 * Each group plays round-robin (6 matches per group, 24 total)
 */
export function generateGroupStageMatches(
  tournamentId: string,
  participants: Participant[],
  courts: string[] = ['Court 1', 'Court 2', 'Court 3'],
  scheme: GroupScheduleScheme = 'SPLIT_WAVE',
  startTime: string = '08:00 WIB',
  slotDurationMinutes: number = 45
): { matches: Match[]; groupedParticipants: Participant[] } {
  const groups = ['Grup 1', 'Grup 2', 'Grup 3', 'Grup 4'];
  
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
    p.groupSetsWon = 0;
    p.groupSetsLost = 0;
    p.groupSetDiff = 0;
    p.groupPointsWon = 0;
    p.groupPointsLost = 0;
    p.groupPointDiff = 0;
    
    groupedParticipants.push(p);
    groupMaps[p.group].push(p);
  }

  // Canonical Round-Robin Pairings for 4 teams [T0, T1, T2, T3]:
  // Round 1: T0 vs T1, T2 vs T3
  // Round 2: T0 vs T2, T1 vs T3
  // Round 3: T0 vs T3, T1 vs T2
  const groupMatchesMap: Record<string, Match[]> = {
    'Grup 1': [],
    'Grup 2': [],
    'Grup 3': [],
    'Grup 4': [],
  };

  groups.forEach((groupName) => {
    const groupTeams = groupMaps[groupName];
    if (groupTeams.length !== 4) return;

    const roundPairs = [
      [0, 1], // R1 M1
      [2, 3], // R1 M2
      [0, 2], // R2 M1
      [1, 3], // R2 M2
      [0, 3], // R3 M1
      [1, 2], // R3 M2
    ];

    roundPairs.forEach(([t1Idx, t2Idx], pairIdx) => {
      const matchId = `group_${tournamentId}_${groupName.replace(/\s+/g, '')}_m${pairIdx + 1}`;
      const groupMatch: Match = {
        id: matchId,
        tournamentId,
        round: 1,
        roundName: `Fase Grup - ${groupName}`,
        matchOrder: 1, // Will be ordered later
        participant1: groupTeams[t1Idx],
        participant2: groupTeams[t2Idx],
        scores: Array.from({ length: 5 }, (_, i) => ({ setNumber: i + 1, score1: 0, score2: 0 })),
        currentSet: 1,
        court: 'Court 1',
        scheduledTime: '08:00 WIB',
        referee: 'Wasit 1',
        status: 'UPCOMING',
        winnerId: null,
        nextMatchId: null,
        nextMatchSlot: undefined,
        phase: 'GROUP',
        groupName: groupName,
      };
      groupMatchesMap[groupName].push(groupMatch);
    });
  });

  // Order matches according to chosen scheme
  const orderedMatches: Match[] = [];

  if (scheme === 'ROLLING_ROUND') {
    // Round 1 (8 matches)
    groups.forEach((g) => {
      if (groupMatchesMap[g]?.[0]) orderedMatches.push(groupMatchesMap[g][0]);
      if (groupMatchesMap[g]?.[1]) orderedMatches.push(groupMatchesMap[g][1]);
    });
    // Round 2 (8 matches)
    groups.forEach((g) => {
      if (groupMatchesMap[g]?.[2]) orderedMatches.push(groupMatchesMap[g][2]);
      if (groupMatchesMap[g]?.[3]) orderedMatches.push(groupMatchesMap[g][3]);
    });
    // Round 3 (8 matches)
    groups.forEach((g) => {
      if (groupMatchesMap[g]?.[4]) orderedMatches.push(groupMatchesMap[g][4]);
      if (groupMatchesMap[g]?.[5]) orderedMatches.push(groupMatchesMap[g][5]);
    });
  } else {
    // SPLIT_WAVE (Gelombang 1: Grup 1 & 2, Gelombang 2: Grup 3 & 4)
    const g1 = groupMatchesMap['Grup 1'] || [];
    const g2 = groupMatchesMap['Grup 2'] || [];
    if (g1[0]) orderedMatches.push(g1[0]);
    if (g1[1]) orderedMatches.push(g1[1]);
    if (g2[0]) orderedMatches.push(g2[0]);
    if (g2[1]) orderedMatches.push(g2[1]);
    if (g1[2]) orderedMatches.push(g1[2]);
    if (g2[2]) orderedMatches.push(g2[2]);
    if (g1[3]) orderedMatches.push(g1[3]);
    if (g2[3]) orderedMatches.push(g2[3]);
    if (g1[4]) orderedMatches.push(g1[4]);
    if (g1[5]) orderedMatches.push(g1[5]);
    if (g2[4]) orderedMatches.push(g2[4]);
    if (g2[5]) orderedMatches.push(g2[5]);

    const g3 = groupMatchesMap['Grup 3'] || [];
    const g4 = groupMatchesMap['Grup 4'] || [];
    if (g3[0]) orderedMatches.push(g3[0]);
    if (g3[1]) orderedMatches.push(g3[1]);
    if (g4[0]) orderedMatches.push(g4[0]);
    if (g4[1]) orderedMatches.push(g4[1]);
    if (g3[2]) orderedMatches.push(g3[2]);
    if (g4[2]) orderedMatches.push(g4[2]);
    if (g3[3]) orderedMatches.push(g3[3]);
    if (g4[3]) orderedMatches.push(g4[3]);
    if (g3[4]) orderedMatches.push(g3[4]);
    if (g3[5]) orderedMatches.push(g3[5]);
    if (g4[4]) orderedMatches.push(g4[4]);
    if (g4[5]) orderedMatches.push(g4[5]);
  }

  const actualCourts = courts.length > 0 ? courts : ['Court 1', 'Court 2', 'Court 3'];
  orderedMatches.forEach((m, idx) => {
    const slotIndex = Math.floor(idx / actualCourts.length);
    const courtIndex = idx % actualCourts.length;
    m.matchOrder = idx + 1;
    m.court = actualCourts[courtIndex] || `Court ${courtIndex + 1}`;
    m.referee = `Wasit ${courtIndex + 1}`;
    m.scheduledTime = calculateSlotTime(startTime, slotIndex, slotDurationMinutes);
  });

  return { matches: orderedMatches, groupedParticipants };
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
    const sorted = [...groupTeams].sort((a, b) => {
      if ((b.groupPoints || 0) !== (a.groupPoints || 0)) return (b.groupPoints || 0) - (a.groupPoints || 0);
      if ((b.groupSetDiff || 0) !== (a.groupSetDiff || 0)) return (b.groupSetDiff || 0) - (a.groupSetDiff || 0);
      if ((b.groupPointDiff || 0) !== (a.groupPointDiff || 0)) return (b.groupPointDiff || 0) - (a.groupPointDiff || 0);
      if ((b.groupPointsWon || 0) !== (a.groupPointsWon || 0)) return (b.groupPointsWon || 0) - (a.groupPointsWon || 0);
      return (a.seed || 999) - (b.seed || 999);
    });
    
    // Assign ranks
    sorted.forEach((p, idx) => {
      p.groupRank = idx + 1;
    });
    
    rankedGroups[groupName] = sorted;
  });

  // Extract Top 2 and Bottom 2 from each group
  // Seeding for knockout: ensure teams from same group don't meet in quarterfinals
  // Standard seeding: 1A vs 2B, 1C vs 2D, 1B vs 2A, 1D vs 2C (for upper)
  const seedUpperBracket = () => {
    const seeded: (Participant | null)[] = new Array(8).fill(null);
    
    // Place group winners and runners-up in specific positions
    // Position mapping to avoid same-group matchups in QF
    seeded[0] = rankedGroups['Grup 1']?.[0] ?? null; // 1A
    seeded[1] = rankedGroups['Grup 2']?.[1] ?? null; // 2B
    seeded[2] = rankedGroups['Grup 3']?.[0] ?? null; // 1C
    seeded[3] = rankedGroups['Grup 4']?.[1] ?? null; // 2D
    seeded[4] = rankedGroups['Grup 2']?.[0] ?? null; // 1B
    seeded[5] = rankedGroups['Grup 1']?.[1] ?? null; // 2A
    seeded[6] = rankedGroups['Grup 4']?.[0] ?? null; // 1D
    seeded[7] = rankedGroups['Grup 3']?.[1] ?? null; // 2C
    
    return seeded;
  };

  const seedBottomBracket = () => {
    const seeded: (Participant | null)[] = new Array(8).fill(null);
    
    // Similar logic for bottom bracket
    seeded[0] = rankedGroups['Grup 1']?.[2] ?? null; // 3A
    seeded[1] = rankedGroups['Grup 2']?.[3] ?? null; // 4B
    seeded[2] = rankedGroups['Grup 3']?.[2] ?? null; // 3C
    seeded[3] = rankedGroups['Grup 4']?.[3] ?? null; // 4D
    seeded[4] = rankedGroups['Grup 2']?.[2] ?? null; // 3B
    seeded[5] = rankedGroups['Grup 1']?.[3] ?? null; // 4A
    seeded[6] = rankedGroups['Grup 4']?.[2] ?? null; // 3D
    seeded[7] = rankedGroups['Grup 3']?.[3] ?? null; // 4C
    
    return seeded;
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
