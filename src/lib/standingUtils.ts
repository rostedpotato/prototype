import { Participant, Match, SetScore } from '@/types/tournament';

export interface ParticipantStanding extends Participant {
  played: number;
  groupWins: number;
  groupLosses: number;
  groupPoints: number;
  groupSetsWon: number;
  groupSetsLost: number;
  groupSetDiff: number;
  groupPointsWon: number;
  groupPointsLost: number;
  groupPointDiff: number;
}

/**
 * Calculates match and set tallies for a match's scores
 */
export function getMatchSetsSummary(scores: SetScore[] = []) {
  let setsWon1 = 0;
  let setsWon2 = 0;
  let pointsWon1 = 0;
  let pointsWon2 = 0;

  scores.forEach((s) => {
    pointsWon1 += s.score1 || 0;
    pointsWon2 += s.score2 || 0;
    if (s.score1 > 0 || s.score2 > 0) {
      if (s.score1 > s.score2) setsWon1++;
      else if (s.score2 > s.score1) setsWon2++;
    }
  });

  return { setsWon1, setsWon2, pointsWon1, pointsWon2 };
}

/**
 * Filters only sets that have scores
 */
export function getActiveSets(scores: SetScore[] = []): SetScore[] {
  return scores.filter((s) => s.score1 > 0 || s.score2 > 0);
}

/**
 * Pure, centralized calculation of group stage standings & 5-tier tiebreaker sorting
 */
export function calculateGroupStandings(
  participants: Participant[],
  groupMatches: Match[]
): ParticipantStanding[] {
  const standings: ParticipantStanding[] = participants.map((p) => {
    const finishedMatches = groupMatches.filter(
      (m) =>
        (m.participant1?.id === p.id || m.participant2?.id === p.id) &&
        (m.status === 'FINISHED' || m.status === 'WALKOVER')
    );

    let wins = 0;
    let losses = 0;
    let setsWon = 0;
    let setsLost = 0;
    let pointsWon = 0;
    let pointsLost = 0;

    finishedMatches.forEach((m) => {
      if (m.winnerId === p.id) {
        wins += 1;
      } else if (m.winnerId) {
        losses += 1;
      }

      m.scores.forEach((s) => {
        const isP1 = m.participant1?.id === p.id;
        const myScore = isP1 ? s.score1 : s.score2;
        const oppScore = isP1 ? s.score2 : s.score1;

        if (myScore > 0 || oppScore > 0) {
          pointsWon += myScore;
          pointsLost += oppScore;
          if (myScore > oppScore) setsWon += 1;
          else if (oppScore > myScore) setsLost += 1;
        }
      });
    });

    const points = wins * 1; // Menang +1, Kalah +0
    const setDiff = setsWon - setsLost;
    const pointDiff = pointsWon - pointsLost;

    return {
      ...p,
      played: finishedMatches.length,
      groupWins: wins,
      groupLosses: losses,
      groupPoints: points,
      groupSetsWon: setsWon,
      groupSetsLost: setsLost,
      groupSetDiff: setDiff,
      groupPointsWon: pointsWon,
      groupPointsLost: pointsLost,
      groupPointDiff: pointDiff,
    };
  });

  // Sort with 5-tier official tiebreaker
  standings.sort((a, b) => {
    // 1. PTS (Match Points: +1 per win)
    if (b.groupPoints !== a.groupPoints) return b.groupPoints - a.groupPoints;
    // 2. Set Difference (SD)
    if (b.groupSetDiff !== a.groupSetDiff) return b.groupSetDiff - a.groupSetDiff;
    // 3. Point Difference (PD)
    if (b.groupPointDiff !== a.groupPointDiff) return b.groupPointDiff - a.groupPointDiff;
    // 4. Points Won (PW)
    if (b.groupPointsWon !== a.groupPointsWon) return b.groupPointsWon - a.groupPointsWon;
    // 5. Seed
    return (a.seed || 999) - (b.seed || 999);
  });

  // Assign ranks
  standings.forEach((p, idx) => {
    p.groupRank = idx + 1;
  });

  return standings;
}
