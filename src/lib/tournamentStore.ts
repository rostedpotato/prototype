'use client';

import { Tournament, Match, SetScore, MatchStatus, Participant } from '@/types/tournament';
import { INITIAL_TOURNAMENTS } from './initialData';
import { calculateMatchWinner, getSetsToWinForRound, getTargetGamesForMatch } from './scoreRules';
import { calculateGroupStandings } from './standingUtils';
import { generateKnockoutStageFromGroups } from './bracketGenerator';
import {
  deleteTournamentFromSupabase,
  getRealtimeStatus,
  insertRegistrationToSupabase,
  isCurrentUserAdmin,
  loadTournamentsFromSupabase,
  saveTournamentsToSupabase,
  subscribeToRealtimeStatus,
  subscribeToTournamentChanges,
} from './supabase/tournamentRepository';
import type { RealtimeConnectionStatus } from './supabase/tournamentRepository';

const STORAGE_KEY = 'racket_tournaments_v2';
const LEGACY_MIGRATION_KEY = 'racket_tournaments_supabase_migrated_v1';
const EVENT_KEY = 'racket_tournament_updated';
let inMemoryTournaments: Tournament[] | null = null;

function describeStoreError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>;
    if (typeof candidate.message === 'string') return candidate.message;
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }
  return String(error);
}

// BroadcastChannel for instant multi-tab sync
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel('racket_tournament_channel');
  } catch (e) {
    syncChannel = null;
  }
}

// Supabase is the primary source of truth. The browser cache exists only to
// support one-time migration and offline UI continuity during a write.
function getStoredTournaments(): Tournament[] {
  if (inMemoryTournaments !== null) return inMemoryTournaments;
  return getLegacyTournaments() || [];
}

function getLegacyTournaments(): Tournament[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('racket_tournaments_v1');
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function cacheTournaments(tournaments: Tournament[]) {
  inMemoryTournaments = tournaments;
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
}

function isLegacyMigrationComplete(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(LEGACY_MIGRATION_KEY) === 'true';
}

function markLegacyMigrationComplete() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LEGACY_MIGRATION_KEY, 'true');
  }
}

function mergeIncompleteRemoteTournaments(
  remoteTournaments: Tournament[],
  legacyTournaments: Tournament[]
): { tournaments: Tournament[]; needsRepair: boolean } {
  let needsRepair = false;

  const tournaments = remoteTournaments.map((remoteTournament) => {
    const legacyTournament = legacyTournaments.find((item) => item.id === remoteTournament.id);
    if (!legacyTournament) return remoteTournament;

    const shouldRestoreParticipants =
      remoteTournament.participants.length === 0 && legacyTournament.participants.length > 0;
    const shouldRestoreMatches =
      remoteTournament.matches.length === 0 && legacyTournament.matches.length > 0;
    const shouldRestoreRegistrations =
      (remoteTournament.registrations || []).length === 0 &&
      (legacyTournament.registrations || []).length > 0;

    if (!shouldRestoreParticipants && !shouldRestoreMatches && !shouldRestoreRegistrations) {
      return remoteTournament;
    }

    needsRepair = true;
    return {
      ...remoteTournament,
      participants: shouldRestoreParticipants
        ? legacyTournament.participants
        : remoteTournament.participants,
      matches: shouldRestoreMatches ? legacyTournament.matches : remoteTournament.matches,
      registrations: shouldRestoreRegistrations
        ? legacyTournament.registrations
        : remoteTournament.registrations,
    };
  });

  return { tournaments, needsRepair };
}

async function getResolvedRemoteTournaments(): Promise<Tournament[] | null> {
  const remoteTournaments = await loadTournamentsFromSupabase();
  const legacyTournaments = getLegacyTournaments();

  if (remoteTournaments.length === 0) {
    if (!legacyTournaments || !(await isCurrentUserAdmin())) {
      return legacyTournaments ? null : [];
    }

    await saveTournamentsToSupabase(legacyTournaments);
    markLegacyMigrationComplete();
    return loadTournamentsFromSupabase();
  }

  if (isLegacyMigrationComplete() || !legacyTournaments || !(await isCurrentUserAdmin())) {
    return remoteTournaments;
  }

  const merged = mergeIncompleteRemoteTournaments(remoteTournaments, legacyTournaments);
  const remoteIds = new Set(remoteTournaments.map((tournament) => tournament.id));
  const legacyOnlyTournaments = legacyTournaments.filter(
    (tournament) => !remoteIds.has(tournament.id)
  );

  if (merged.needsRepair || legacyOnlyTournaments.length > 0) {
    await saveTournamentsToSupabase([...merged.tournaments, ...legacyOnlyTournaments]);
  }

  markLegacyMigrationComplete();
  return loadTournamentsFromSupabase();
}

function saveTournaments(tournaments: Tournament[], syncRemote = true) {
  if (typeof window === 'undefined') return;
  try {
    cacheTournaments(tournaments);
    // Dispatch local event for current tab
    window.dispatchEvent(new Event(EVENT_KEY));
    // Broadcast to other open tabs
    if (syncChannel) {
      syncChannel.postMessage({ type: 'UPDATE' });
    }

    if (syncRemote) {
      void saveTournamentsToSupabase(tournaments).catch((error: unknown) => {
        console.error('Gagal menyinkronkan turnamen ke Supabase:', error);
      });
    }
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

function syncTournamentToSupabase(tournament: Tournament) {
  void saveTournamentsToSupabase([tournament]).catch((error: unknown) => {
    console.error(
      `Gagal menyinkronkan tournament ${tournament.id} ke Supabase:`,
      describeStoreError(error),
      error
    );
  });
}

export const TournamentService = {
  async syncNow(): Promise<void> {
    await saveTournamentsToSupabase(getStoredTournaments());
  },

  getAll(): Tournament[] {
    return getStoredTournaments();
  },

  getById(id: string): Tournament | null {
    const list = getStoredTournaments();
    return list.find((t) => t.id === id) || null;
  },

  async create(tournament: Tournament): Promise<Tournament> {
    const list = getStoredTournaments();
    const updated = [tournament, ...list];
    saveTournaments(updated, false);
    await saveTournamentsToSupabase([tournament]);
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
    saveTournaments(list, false);
    syncTournamentToSupabase(updated);
    return list[index];
  },

  async submitRegistration(tournamentId: string, payload: Omit<import('@/types/tournament').RegistrationRequest, 'id' | 'tournamentId' | 'status' | 'createdAt'>): Promise<boolean> {
    const list = getStoredTournaments();
    const index = list.findIndex((t) => t.id === tournamentId);
    if (index === -1) return false;

    const previousList = list.map((tournament) => ({
      ...tournament,
      registrations: tournament.registrations ? [...tournament.registrations] : [],
    }));
    const t = list[index];
    const newReg: import('@/types/tournament').RegistrationRequest = {
      ...payload,
      id: crypto.randomUUID(),
      tournamentId,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    t.registrations = [...(t.registrations || []), newReg];
    list[index] = t;
    saveTournaments(list, false);

    try {
      await insertRegistrationToSupabase(newReg);
      return true;
    } catch (error) {
      saveTournaments(previousList, false);
      console.error('Gagal menyimpan pendaftaran ke Supabase:', error);
      return false;
    }
  },

  processRegistration(tournamentId: string, registrationId: string, status: import('@/types/tournament').RegistrationStatus): boolean {
    const list = getStoredTournaments();
    const index = list.findIndex((t) => t.id === tournamentId);
    if (index === -1) return false;

    const t = list[index];
    if (!t.registrations) return false;

    const regIndex = t.registrations.findIndex(r => r.id === registrationId);
    if (regIndex === -1) return false;

    const reg = t.registrations[regIndex];
    const previousStatus = reg.status;
    reg.status = status;

    if (status === 'APPROVED' && previousStatus !== 'APPROVED') {
      const newParticipant: import('@/types/tournament').Participant = {
        id: crypto.randomUUID(),
        name: reg.teamName,
        player1: reg.player1Name,
        player2: reg.player2Name,
        reclubId1: reg.reclubId1,
        reclubId2: reg.reclubId2,
        whatsapp: reg.whatsapp,
        club: reg.sector, // Store sector info in club field
        registrationId: reg.id // Link it back so we can cancel later
      };
      t.participants = [...t.participants, newParticipant];
    } else if (previousStatus === 'APPROVED' && status !== 'APPROVED') {
      // Remove the participant linked to this registration
      t.participants = t.participants.filter(p => {
        if (p.registrationId) return p.registrationId !== reg.id;
        // Fallback for participants approved before we added registrationId
        return p.name !== reg.teamName;
      });
    }

    // FORCE SYNC: Self-healing to ensure participants array perfectly matches APPROVED registrations
    if (t.registrations && t.registrations.length > 0) {
      const approvedTeamNames = new Set(t.registrations.filter(r => r.status === 'APPROVED').map(r => r.teamName));
      t.participants = t.participants.filter(p => approvedTeamNames.has(p.name));
    }

    list[index] = t;
    saveTournaments(list, false);
    syncTournamentToSupabase(t);
    return true;
  },

  delete(id: string): boolean {
    const list = getStoredTournaments();
    const filtered = list.filter((t) => t.id !== id);
    saveTournaments(filtered, false);
    void deleteTournamentFromSupabase(id).catch((error: unknown) => {
      console.error('Gagal menghapus turnamen dari Supabase:', error);
    });
    return true;
  },

  resetDefaults(): Tournament[] {
    if (typeof window !== 'undefined') {
      try {
        saveTournaments(INITIAL_TOURNAMENTS, true);
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

      saveTournaments(parsed, true);
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
    saveTournaments(list, false);
    syncTournamentToSupabase(tournament);
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
      referee?: string;
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

    // Capture the ORIGINAL winnerId before applying payload, needed for revert logic
    const originalWinnerId = matches[mIndex].winnerId;
    let currentMatch = { ...matches[mIndex], ...payload };

    // Auto-detect match winner if scores dictate it
    if (payload.scores) {
      const setsToWin = getSetsToWinForRound(
        tournament.sport,
        tournament.rules?.customPadelScoring,
        currentMatch.roundName
      );
      const targetGames = getTargetGamesForMatch(
        tournament.sport,
        tournament.rules?.customPadelScoring,
        currentMatch.roundName
      );

      const winCheck = calculateMatchWinner(tournament.sport, payload.scores, setsToWin, targetGames);
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
    if ((currentMatch.status === 'FINISHED' || currentMatch.status === 'WALKOVER') && currentMatch.winnerId) {
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
    } else if (
      currentMatch.status !== 'FINISHED' &&
      currentMatch.status !== 'WALKOVER' &&
      currentMatch.nextMatchId &&
      currentMatch.nextMatchSlot
    ) {
      // If match was reverted from FINISHED/WALKOVER, clear advancement using the ORIGINAL winnerId
      const nextIndex = matches.findIndex((m) => m.id === currentMatch.nextMatchId);
      if (nextIndex !== -1 && originalWinnerId) {
        const nextMatch = { ...matches[nextIndex] };
        if (currentMatch.nextMatchSlot === 1 && nextMatch.participant1?.id === originalWinnerId) {
          nextMatch.participant1 = null;
        } else if (currentMatch.nextMatchSlot === 2 && nextMatch.participant2?.id === originalWinnerId) {
          nextMatch.participant2 = null;
        }
        matches[nextIndex] = nextMatch;
      }
    }

    // If tournament is TWO_STAGE and match was in group stage, recalculate group standings
    if (tournament.format?.startsWith('TWO_STAGE') && currentMatch.phase === 'GROUP') {
      const groupMatches = matches.filter((m) => m.phase === 'GROUP');
      const groups = ['Grup 1', 'Grup 2', 'Grup 3', 'Grup 4'];
      const updatedParticipants: Participant[] = [];

      groups.forEach((gName) => {
        const inGroup = tournament.participants.filter((p) => p.group === gName);
        const inGroupMatches = groupMatches.filter(
          (m) => m.groupName === gName || m.roundName?.includes(gName)
        );
        const ranked = calculateGroupStandings(inGroup, inGroupMatches);
        updatedParticipants.push(...ranked);
      });

      const others = tournament.participants.filter((p) => !p.group || !groups.includes(p.group));
      tournament.participants = [...updatedParticipants, ...others];
    }

    tournament.matches = matches;

    // Also update tournament status if all matches finished
    const allFinished = matches.every((m) => m.status === 'FINISHED' || m.status === 'WALKOVER');
    if (allFinished) {
      tournament.status = 'COMPLETED';
    } else if (matches.some((m) => m.status === 'LIVE')) {
      tournament.status = 'LIVE';
    }

    list[tIndex] = tournament;
    saveTournaments(list, false);
    syncTournamentToSupabase(tournament);
    return tournament;
  },

  generateKnockoutForTwoStage(tournamentId: string): Tournament | null {
    const list = getStoredTournaments();
    const tIndex = list.findIndex((t) => t.id === tournamentId);
    if (tIndex === -1) return null;

    const tournament = { ...list[tIndex] };
    if (!tournament.format?.startsWith('TWO_STAGE')) return null;

    const { upperBracketMatches, bottomBracketMatches } = generateKnockoutStageFromGroups(
      tournament.id,
      tournament.participants,
      tournament.courts
    );

    // Keep existing group matches and add the two knockout brackets
    const groupMatches = tournament.matches.filter((m) => m.phase === 'GROUP');
    tournament.matches = [...groupMatches, ...upperBracketMatches, ...bottomBracketMatches];
    tournament.groupStageCompleted = true;

    list[tIndex] = tournament;
    saveTournaments(list, false);
    syncTournamentToSupabase(tournament);
    return tournament;
  },
};

// React hooks
import { useState, useEffect, useSyncExternalStore } from 'react';

export function useRealtimeStatus(): RealtimeConnectionStatus {
  return useSyncExternalStore(
    (onStoreChange) => subscribeToRealtimeStatus(() => onStoreChange()),
    getRealtimeStatus,
    () => 'DISCONNECTED' as RealtimeConnectionStatus
  );
}

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const remoteTournaments = await getResolvedRemoteTournaments();

        if (remoteTournaments) {
          if (!cancelled) {
            cacheTournaments(remoteTournaments);
            setTournaments(remoteTournaments);
            setIsClient(true);
          }
          return;
        }

        const legacyTournaments = getLegacyTournaments();
        if (!cancelled) {
          setTournaments(legacyTournaments || []);
          setIsClient(true);
        }
      } catch (error) {
        console.error('Gagal memuat turnamen dari Supabase:', describeStoreError(error), error);
        if (!cancelled) {
          setTournaments(getStoredTournaments());
          setIsClient(true);
        }
      }
    };

    void hydrate();

    const handleUpdate = () => {
      setTournaments(TournamentService.getAll());
    };

    window.addEventListener(EVENT_KEY, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    if (syncChannel) {
      syncChannel.addEventListener('message', handleUpdate);
    }

    const unsubscribeRealtime = subscribeToTournamentChanges(() => {
      void getResolvedRemoteTournaments()
        .then((remoteTournaments) => {
          if (!cancelled && remoteTournaments) {
            cacheTournaments(remoteTournaments);
            setTournaments(remoteTournaments);
          }
        })
        .catch((error: unknown) => {
          console.error('Realtime refresh tournament gagal:', describeStoreError(error), error);
        });
    });

    return () => {
      cancelled = true;
      unsubscribeRealtime();
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
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const remoteTournaments = await getResolvedRemoteTournaments();

        if (remoteTournaments) {
          const remoteTournament = remoteTournaments.find((item) => item.id === id) || null;
          if (!cancelled) {
            cacheTournaments(remoteTournaments);
            setTournament(remoteTournament);
            setIsClient(true);
          }
          return;
        }

        const legacyTournaments = getLegacyTournaments();
        if (!cancelled) {
          setTournament(legacyTournaments?.find((item) => item.id === id) || null);
          setIsClient(true);
        }
      } catch (error) {
        console.error('Gagal memuat turnamen dari Supabase:', describeStoreError(error), error);
        if (!cancelled) {
          setTournament(TournamentService.getById(id));
          setIsClient(true);
        }
      }
    };

    void hydrate();

    const handleUpdate = () => {
      setTournament(TournamentService.getById(id));
    };

    window.addEventListener(EVENT_KEY, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    if (syncChannel) {
      syncChannel.addEventListener('message', handleUpdate);
    }

    const unsubscribeRealtime = subscribeToTournamentChanges(() => {
      void getResolvedRemoteTournaments()
        .then((remoteTournaments) => {
          if (!cancelled && remoteTournaments) {
            cacheTournaments(remoteTournaments);
            setTournament(remoteTournaments.find((item) => item.id === id) || null);
          }
        })
        .catch((error: unknown) => {
          console.error('Realtime refresh tournament gagal:', describeStoreError(error), error);
        });
    });

    return () => {
      cancelled = true;
      unsubscribeRealtime();
      window.removeEventListener(EVENT_KEY, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (syncChannel) {
        syncChannel.removeEventListener('message', handleUpdate);
      }
    };
  }, [id]);

  return { tournament, isClient, service: TournamentService };
}
