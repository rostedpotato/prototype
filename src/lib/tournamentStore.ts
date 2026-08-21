'use client';

import { Tournament, Match, SetScore, MatchStatus, Participant } from '@/types/tournament';
import { INITIAL_TOURNAMENTS } from './initialData';
import { calculateMatchWinner } from './scoreRules';

const STORAGE_KEY = 'racket_tournaments_v2';
const EVENT_KEY = 'racket_tournament_updated';

// BroadcastChannel for instant multi-tab sync
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel('racket_tournament_channel');
  } catch (e) {
    syncChannel = null;
  }
}

// Helper to safely access localStorage in client
function getStoredTournaments(): Tournament[] {
  if (typeof window === 'undefined') {
    return INITIAL_TOURNAMENTS;
  }
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check if v1 exists and migrate it
      const v1 = localStorage.getItem('racket_tournaments_v1');
      if (v1) {
        localStorage.setItem(STORAGE_KEY, v1);
        return JSON.parse(v1);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TOURNAMENTS));
      return INITIAL_TOURNAMENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TOURNAMENTS));
      return INITIAL_TOURNAMENTS;
    }
    return parsed;
  } catch (e) {
    console.error('Error reading localStorage', e);
    return INITIAL_TOURNAMENTS;
  }
}

function saveTournaments(tournaments: Tournament[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
    // Dispatch local event for current tab
    window.dispatchEvent(new Event(EVENT_KEY));
    // Broadcast to other open tabs
    if (syncChannel) {
      syncChannel.postMessage({ type: 'UPDATE' });
    }
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

export const TournamentService = {
  getAll(): Tournament[] {
    return getStoredTournaments();
  },

  getById(id: string): Tournament | null {
    const list = getStoredTournaments();
    return list.find((t) => t.id === id) || null;
  },

  create(tournament: Tournament): Tournament {
    const list = getStoredTournaments();
    const updated = [tournament, ...list];
    saveTournaments(updated);
    return tournament;
  },

  update(id: string, updates: Partial<Tournament>): Tournament | null {
    const list = getStoredTournaments();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const current = list[index];
    const updated = { ...current, ...updates };

    // If tournament status is changed to LIVE, ensure at least the first upcoming match is set to LIVE
    if (updates.status === 'LIVE' && current.status !== 'LIVE') {
      const hasLiveMatch = updated.matches.some((m) => m.status === 'LIVE');
      if (!hasLiveMatch) {
        const firstUpcoming = updated.matches.find((m) => m.status === 'UPCOMING');
        if (firstUpcoming) {
          firstUpcoming.status = 'LIVE';
        }
      }
    }

    list[index] = updated;
    saveTournaments(list);
    return list[index];
  },

  delete(id: string): boolean {
    const list = getStoredTournaments();
    const filtered = list.filter((t) => t.id !== id);
    saveTournaments(filtered);
    return true;
  },

  resetDefaults(): Tournament[] {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TOURNAMENTS));
        window.dispatchEvent(new Event(EVENT_KEY));
        if (syncChannel) syncChannel.postMessage({ type: 'UPDATE' });
      } catch (e) {
        // localStorage may be full or disabled - silent fallback
      }
    }
    return INITIAL_TOURNAMENTS;
  },

  exportData(): string {
    const list = getStoredTournaments();
    return JSON.stringify(list, null, 2);
  },

  importData(data: string | Tournament[]): { success: boolean; count?: number; error?: string } {
    try {
      let parsed: any;
      if (typeof data === 'string') {
        parsed = JSON.parse(data);
      } else {
        parsed = data;
      }

      if (!Array.isArray(parsed)) {
        return { success: false, error: 'Format data tidak valid (harus berupa array turnamen).' };
      }

      const isValid = parsed.every(
        (t) =>
          t &&
          typeof t.id === 'string' &&
          typeof t.name === 'string' &&
          Array.isArray(t.matches) &&
          Array.isArray(t.participants)
      );

      if (!isValid) {
        return { success: false, error: 'Struktur data turnamen dalam file tidak sesuai.' };
      }

      saveTournaments(parsed);
      return { success: true, count: parsed.length };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Gagal memproses file JSON.' };
    }
  },

  assignMatchParticipant(
    tournamentId: string,
    matchId: string,
    slot: 1 | 2,
    participantId: string | null
  ): Tournament | null {
    const list = getStoredTournaments();
    const tIndex = list.findIndex((t) => t.id === tournamentId);
    if (tIndex === -1) return null;

    const tournament = { ...list[tIndex] };
    const matches = [...tournament.matches];
    const mIndex = matches.findIndex((m) => m.id === matchId);
    if (mIndex === -1) return null;

    const targetParticipant = participantId
      ? tournament.participants.find((p) => p.id === participantId) || null
      : null;

    const currentMatch = { ...matches[mIndex] };
    if (slot === 1) {
      currentMatch.participant1 = targetParticipant;
    } else {
      currentMatch.participant2 = targetParticipant;
    }

    matches[mIndex] = currentMatch;
    tournament.matches = matches;
    list[tIndex] = tournament;
    saveTournaments(list);
    return tournament;
  },

  updateMatch(
    tournamentId: string,
    matchId: string,
    payload: {
      scores?: SetScore[];
      currentSet?: number;
      servingSide?: 1 | 2;
      status?: MatchStatus;
      winnerId?: string | null;
      court?: string;
      scheduledTime?: string;
      participant1?: Participant | null;
      participant2?: Participant | null;
    }
  ): Tournament | null {
    const list = getStoredTournaments();
    const tIndex = list.findIndex((t) => t.id === tournamentId);
    if (tIndex === -1) return null;

    const tournament = { ...list[tIndex] };
    const matches = [...tournament.matches];
    const mIndex = matches.findIndex((m) => m.id === matchId);
    if (mIndex === -1) return null;

    let currentMatch = { ...matches[mIndex], ...payload };

    // Auto-detect match winner if scores dictate it
    if (payload.scores) {
      const winCheck = calculateMatchWinner(tournament.sport, payload.scores, 2);
      if (winCheck.isMatchOver && winCheck.winnerSide) {
        const autoWinner =
          winCheck.winnerSide === 1 ? currentMatch.participant1 : currentMatch.participant2;
        if (autoWinner) {
          currentMatch.winnerId = autoWinner.id;
          currentMatch.status = 'FINISHED';
        }
      }
    }

    matches[mIndex] = currentMatch;

    // Automatic Bracket Advancement Logic
    if (currentMatch.status === 'FINISHED' && currentMatch.winnerId) {
      const winner =
        currentMatch.participant1?.id === currentMatch.winnerId
          ? currentMatch.participant1
          : currentMatch.participant2?.id === currentMatch.winnerId
          ? currentMatch.participant2
          : tournament.participants.find((p) => p.id === currentMatch.winnerId) || null;

      if (winner && currentMatch.nextMatchId && currentMatch.nextMatchSlot) {
        const nextIndex = matches.findIndex((m) => m.id === currentMatch.nextMatchId);
        if (nextIndex !== -1) {
          const nextMatch = { ...matches[nextIndex] };
          if (currentMatch.nextMatchSlot === 1) {
            nextMatch.participant1 = winner;
          } else {
            nextMatch.participant2 = winner;
          }
          matches[nextIndex] = nextMatch;
        }
      }
    } else if (currentMatch.status !== 'FINISHED' && currentMatch.nextMatchId && currentMatch.nextMatchSlot) {
      // If match was reverted back from FINISHED to LIVE/UPCOMING, clear advancement in subsequent match
      const nextIndex = matches.findIndex((m) => m.id === currentMatch.nextMatchId);
      if (nextIndex !== -1) {
        const nextMatch = { ...matches[nextIndex] };
        if (currentMatch.nextMatchSlot === 1 && nextMatch.participant1?.id === currentMatch.winnerId) {
          nextMatch.participant1 = null;
        } else if (currentMatch.nextMatchSlot === 2 && nextMatch.participant2?.id === currentMatch.winnerId) {
          nextMatch.participant2 = null;
        }
        matches[nextIndex] = nextMatch;
      }
    }

    tournament.matches = matches;

    // Also update tournament status if all matches finished
    const allFinished = matches.every((m) => m.status === 'FINISHED');
    if (allFinished) {
      tournament.status = 'COMPLETED';
    } else if (matches.some((m) => m.status === 'LIVE')) {
      tournament.status = 'LIVE';
    }

    list[tIndex] = tournament;
    saveTournaments(list);
    return tournament;
  },
};

// React hooks
import { useState, useEffect } from 'react';

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTournaments(TournamentService.getAll());

    const handleUpdate = () => {
      setTournaments(TournamentService.getAll());
    };

    window.addEventListener(EVENT_KEY, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    if (syncChannel) {
      syncChannel.addEventListener('message', handleUpdate);
    }

    return () => {
      window.removeEventListener(EVENT_KEY, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (syncChannel) {
        syncChannel.removeEventListener('message', handleUpdate);
      }
    };
  }, []);

  return { tournaments, isClient, service: TournamentService };
}

export function useTournament(id: string) {
  const [tournament, setTournament] = useState<Tournament | null>(() => {
    return INITIAL_TOURNAMENTS.find((t) => t.id === id) || null;
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTournament(TournamentService.getById(id));

    const handleUpdate = () => {
      setTournament(TournamentService.getById(id));
    };

    window.addEventListener(EVENT_KEY, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    if (syncChannel) {
      syncChannel.addEventListener('message', handleUpdate);
    }

    return () => {
      window.removeEventListener(EVENT_KEY, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (syncChannel) {
        syncChannel.removeEventListener('message', handleUpdate);
      }
    };
  }, [id]);

  return { tournament, isClient, service: TournamentService };
}
