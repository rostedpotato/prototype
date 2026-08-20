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
  score2: number
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
    // PADEL (Games per set: 6, max 7)
    const target = 6;
    if (score1 >= target && score1 - score2 >= 2) {
      return { isFinished: true, winner: 1, statusLabel: `Set Selesai (${score1}-${score2})`, isDeuce: false, isGamePoint: null };
    }
    if (score2 >= target && score2 - score1 >= 2) {
      return { isFinished: true, winner: 2, statusLabel: `Set Selesai (${score1}-${score2})`, isDeuce: false, isGamePoint: null };
    }
    if (score1 === 7 && score2 === 6) {
      return { isFinished: true, winner: 1, statusLabel: `Set Selesai Tiebreak (7-6)`, isDeuce: false, isGamePoint: null };
    }
    if (score2 === 7 && score1 === 6) {
      return { isFinished: true, winner: 2, statusLabel: `Set Selesai Tiebreak (6-7)`, isDeuce: false, isGamePoint: null };
    }

    const isDeuce = score1 === 5 && score2 === 5;
    let isGamePoint: 1 | 2 | null = null;
    if (score1 >= 5 && score1 > score2) isGamePoint = 1;
    else if (score2 >= 5 && score2 > score1) isGamePoint = 2;

    let statusLabel = 'Set Berjalan';
    if (score1 === 6 && score2 === 6) statusLabel = '🔥 Tiebreak (6-6)';
    else if (isDeuce) statusLabel = '🔥 Deuce Games (5-5)';
    else if (isGamePoint === 1) statusLabel = '⚡ Set Point Peserta 1';
    else if (isGamePoint === 2) statusLabel = '⚡ Set Point Peserta 2';

    return { isFinished: false, winner: null, statusLabel, isDeuce, isGamePoint };
  }
}

export function canIncrementScore(
  sport: SportType,
  score1: number,
  score2: number,
  team: 1 | 2
): { allowed: boolean; reason?: string } {
  const currentSet = checkSetStatus(sport, score1, score2);

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

    // If score is 20 and opponent is < 20, next point is 21 which wins the set (allowed)
    // If score is 21 and opponent is <= 19, set is already finished (handled above)
    // If score >= 21, it can only increase if in deuce (opponent >= 20 and diff < 2)
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
    if (currentScore >= 7) {
      return { allowed: false, reason: 'Maksimal 7 game dalam satu set padel.' };
    }
    if (currentScore >= 6 && opponentScore < 5) {
      return { allowed: false, reason: 'Game tidak bisa melebihi 6 tanpa deuce (lawan minimal 5 game).' };
    }
  }

  return { allowed: true };
}

export function calculateMatchWinner(
  sport: SportType,
  scores: SetScore[],
  setsToWin: number = 2
): { winnerSide: 1 | 2 | null; setsWon1: number; setsWon2: number; isMatchOver: boolean } {
  let setsWon1 = 0;
  let setsWon2 = 0;

  scores.forEach((s) => {
    const res = checkSetStatus(sport, s.score1, s.score2);
    if (res.isFinished) {
      if (res.winner === 1) setsWon1++;
      else if (res.winner === 2) setsWon2++;
    }
  });

  const isMatchOver = setsWon1 >= setsToWin || setsWon2 >= setsToWin;
  const winnerSide = setsWon1 >= setsToWin ? 1 : setsWon2 >= setsToWin ? 2 : null;

  return { winnerSide, setsWon1, setsWon2, isMatchOver };
}
