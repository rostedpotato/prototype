import { SportType, SetScore } from '@/types/tournament';

export interface SetValidationResult {
  isFinished: boolean;
  winner: 1 | 2 | null;
  statusLabel: string;
  isDeuce: boolean;
  isGamePoint: 1 | 2 | null;
}

export function checkSetStatus(
  sport: SportType,
  score1: number,
  score2: number,
  targetGames?: number
): SetValidationResult {
  if (sport === 'BADMINTON') {
    const target = 21;
    const cap = 30;

    // Check if cap reached
    if (score1 === cap) {
      return { isFinished: true, winner: 1, statusLabel: `Set Selesai (${score1}-${score2})`, isDeuce: false, isGamePoint: null };
    }
    if (score2 === cap) {
      return { isFinished: true, winner: 2, statusLabel: `Set Selesai (${score1}-${score2})`, isDeuce: false, isGamePoint: null };
    }

    // Standard win condition (>= 21 with margin >= 2)
    if (score1 >= target && score1 - score2 >= 2) {
      return { isFinished: true, winner: 1, statusLabel: `Set Selesai (${score1}-${score2})`, isDeuce: false, isGamePoint: null };
    }
    if (score2 >= target && score2 - score1 >= 2) {
      return { isFinished: true, winner: 2, statusLabel: `Set Selesai (${score1}-${score2})`, isDeuce: false, isGamePoint: null };
    }

    // Deuce condition (20-20 or higher equal)
    const isDeuce = score1 >= 20 && score2 >= 20 && Math.abs(score1 - score2) < 2;

    // Game point condition
    let isGamePoint: 1 | 2 | null = null;
    if (score1 >= 20 && score1 > score2) isGamePoint = 1;
    else if (score2 >= 20 && score2 > score1) isGamePoint = 2;

    let statusLabel = 'Set Berjalan';
    if (isDeuce) statusLabel = `🔥 Deuce (${score1}-${score2}) - Selisih 2 Poin`;
    else if (isGamePoint === 1) statusLabel = `⚡ Game Point Peserta 1 (${score1}-${score2})`;
    else if (isGamePoint === 2) statusLabel = `⚡ Game Point Peserta 2 (${score1}-${score2})`;

    return { isFinished: false, winner: null, statusLabel, isDeuce, isGamePoint };
  } else {
    // PADEL
    const target = targetGames || 6;
    
    // Standard win condition (reach target with margin >= 2)
    if (score1 >= target && score1 - score2 >= 2) {
      return { isFinished: true, winner: 1, statusLabel: `Set Selesai (${score1}-${score2})`, isDeuce: false, isGamePoint: null };
    }
    if (score2 >= target && score2 - score1 >= 2) {
      return { isFinished: true, winner: 2, statusLabel: `Set Selesai (${score1}-${score2})`, isDeuce: false, isGamePoint: null };
    }
    
    // Tiebreak condition (if score is target+1 to target, e.g., 7-6 or 5-4 if target is 4)
    if (score1 === target + 1 && score2 === target) {
      return { isFinished: true, winner: 1, statusLabel: `Set Selesai Tiebreak (${score1}-${score2})`, isDeuce: false, isGamePoint: null };
    }
    if (score2 === target + 1 && score1 === target) {
      return { isFinished: true, winner: 2, statusLabel: `Set Selesai Tiebreak (${score1}-${score2})`, isDeuce: false, isGamePoint: null };
    }

    const isDeuce = score1 === target - 1 && score2 === target - 1;
    let isGamePoint: 1 | 2 | null = null;
    if (score1 >= target - 1 && score1 > score2) isGamePoint = 1;
    else if (score2 >= target - 1 && score2 > score1) isGamePoint = 2;

    let statusLabel = 'Set Berjalan';
    if (score1 === target && score2 === target) statusLabel = `🎾 Tiebreak (${score1}-${score2})`;
    else if (isDeuce) statusLabel = `🎾 Deuce Games (${score1}-${score2})`;
    else if (isGamePoint === 1) statusLabel = '🏆 Set Point Peserta 1';
    else if (isGamePoint === 2) statusLabel = '🏆 Set Point Peserta 2';

    return { isFinished: false, winner: null, statusLabel, isDeuce, isGamePoint };
  }
}

export function canIncrementScore(
  sport: SportType,
  score1: number,
  score2: number,
  team: 1 | 2,
  targetGames?: number
): { allowed: boolean; reason?: string } {
  const currentSet = checkSetStatus(sport, score1, score2, targetGames);

  // If set is already won, cannot add more points
  if (currentSet.isFinished) {
    return {
      allowed: false,
      reason: `Set ini sudah selesai dimenangkan oleh Peserta ${currentSet.winner} (${score1}-${score2}). Pindah ke set berikutnya atau kurangi poin terlebih dahulu.`,
    };
  }

  const currentScore = team === 1 ? score1 : score2;
  const opponentScore = team === 1 ? score2 : score1;

  if (sport === 'BADMINTON') {
    // Max point cap in badminton is 30
    if (currentScore >= 30) {
      return { allowed: false, reason: 'Poin maksimal bulutangkis (30 poin) telah tercapai.' };
    }

    if (currentScore >= 21) {
      if (opponentScore < 20) {
        return { allowed: false, reason: 'Skor tidak bisa melebihi 21 tanpa situasi deuce (lawan minimal 20 poin).' };
      }
      if (currentScore - opponentScore >= 2) {
        return { allowed: false, reason: 'Set sudah selesai dengan keunggulan 2 poin deuce.' };
      }
    }
  } else {
    // PADEL
    const target = targetGames || 6;
    if (currentScore >= target + 1) {
      return { allowed: false, reason: `Maksimal ${target + 1} game dalam satu set padel ini.` };
    }
    if (currentScore >= target && opponentScore < target - 1) {
      return { allowed: false, reason: `Game tidak bisa melebihi ${target} tanpa deuce (lawan minimal ${target - 1} game).` };
    }
  }

  return { allowed: true };
}

export function calculateMatchWinner(
  sport: SportType,
  scores: SetScore[],
  setsToWin: number = 2,
  targetGames?: number
): {
  winnerSide: 1 | 2 | null;
  setsWon1: number;
  setsWon2: number;
  pointsWon1: number;
  pointsWon2: number;
  isMatchOver: boolean;
} {
  let setsWon1 = 0;
  let setsWon2 = 0;
  let pointsWon1 = 0;
  let pointsWon2 = 0;

  scores.forEach((s) => {
    pointsWon1 += s.score1 || 0;
    pointsWon2 += s.score2 || 0;

    // Check if set was won
    const res = checkSetStatus(sport, s.score1, s.score2, targetGames);
    if (res.isFinished) {
      if (res.winner === 1) setsWon1++;
      else if (res.winner === 2) setsWon2++;
    } else if (s.score1 > 0 || s.score2 > 0) {
      // Fallback if set has points and unequal
      if (s.score1 > s.score2 && (s.score1 >= (targetGames || 6) || Math.abs(s.score1 - s.score2) >= 2)) {
        setsWon1++;
      } else if (s.score2 > s.score1 && (s.score2 >= (targetGames || 6) || Math.abs(s.score2 - s.score1) >= 2)) {
        setsWon2++;
      }
    }
  });

  const isMatchOver = setsWon1 >= setsToWin || setsWon2 >= setsToWin;
  const winnerSide = setsWon1 >= setsToWin ? 1 : setsWon2 >= setsToWin ? 2 : null;

  return { winnerSide, setsWon1, setsWon2, pointsWon1, pointsWon2, isMatchOver };
}

export function getSetsToWinForRound(
  sport: SportType,
  customPadelScoring: boolean | undefined,
  roundName: string = ''
): number {
  if (sport !== 'PADEL' || !customPadelScoring) return 2;

  const lower = roundName.toLowerCase();
  if (
    lower.includes('final') &&
    !lower.includes('semifinal') &&
    !lower.includes('perempat') &&
    !lower.includes('qf') &&
    !lower.includes('sf')
  ) {
    return 6; // Final: First to 6 sets
  }
  if (lower.includes('semifinal') || lower.includes('sf')) {
    return 4; // Semifinal: First to 4 sets
  }
  // Group Stage & Quarterfinals: Best of 5 (First to 3 sets)
  return 3;
}

export function getMaxSetsForRound(
  sport: SportType,
  customPadelScoring: boolean | undefined,
  roundName: string = ''
): number {
  const setsToWin = getSetsToWinForRound(sport, customPadelScoring, roundName);
  if (setsToWin === 3) return 5; // Best of 5
  if (setsToWin === 4) return 7; // First to 4
  if (setsToWin === 6) return 11; // First to 6
  return 3; // Default best of 3
}

export function getTargetGamesForMatch(
  sport: SportType,
  customPadelScoring: boolean | undefined,
  roundName: string = ''
): number | undefined {
  if (sport !== 'PADEL') return undefined;
  // In padel, points/games in each set is standard 6 (first to 6 games per set)
  return 6;
}
