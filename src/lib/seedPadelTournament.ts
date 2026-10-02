import type { Match, Participant, Tournament } from '@/types/tournament';

/**
 * Data uji nyata: Padel Tournament — Men's Double & Women's Double
 * (Sabtu, 3 Oktober 2026 — WIN PADEL SUVARNA SUTERA).
 *
 * Men's Double  : 16 pasangan, 4 pool round robin best-of-5,
 *                 lanjut Upper & Beginner knockout (format TWO_STAGE).
 * Women's Double: 12 pasangan, 3 pool round robin best-of-5,
 *                 knockout 6 pasangan + 2 bye.
 *
 * Grup memakai penamaan 'Grup 1..4' agar kompatibel dengan generator
 * knockout bawaan aplikasi (Pool A = Grup 1, Pool B = Grup 2, dst).
 */

interface GroupSeed {
  name: string;
  teams: string[];
  court: string;
  // [rentang waktu, court, index tim 1, index tim 2]
  slots: Array<[string, string, number, number]>;
}

interface PadelSeedConfig {
  id: string;
  name: string;
  category: Tournament['category'];
  categoryLabel: string;
  groups: GroupSeed[];
  description: string;
}

const PADEL_RULES = {
  pointsPerSet: 6,
  maxSets: 5,
  deuceMargin: 2,
  // Admin hanya menginput jumlah set menang di semua babak.
  customPadelScoring: false,
  groupScoreMode: 'SET_TALLY' as const,
  knockoutScoreMode: 'SET_TALLY' as const,
  registrationOpen: false,
};

const VENUE = 'WIN PADEL SUVARNA SUTERA';
const EVENT_DATE = '2026-10-03';

// Pola round robin 4 tim: R1 [0-1, 2-3], R2 [0-2, 1-3], R3 [0-3, 1-2]
const RR_ORDER: Array<[number, number]> = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
];

const WD_TIMES = ['09:00-09:15', '09:15-09:30', '09:30-09:45', '09:45-10:00', '10:00-10:15', '10:15-10:30'];

const MD_CONFIG: PadelSeedConfig = {
  id: 'seed_padel_md_v1',
  name: 'Padel Tournament — Men\u2019s Double',
  category: 'MEN_DOUBLES',
  categoryLabel: 'Ganda Putra (MD)',
  description:
    '16 pasangan • 4 pool round robin, race to 3 set (maksimal 5 set), pemenang/lolos ditentukan dari klasemen. ' +
    'Juara & runner-up masuk Upper Beginner; peringkat 3-4 masuk Beginner. Slot QF mengikuti diagram PDF; jadwal semifinal/final dapat diisi admin. ' +
    'Basic rules: match harus mulai tepat waktu (toleransi telat 5 menit = WO), skor dicatat pemain/panitia (konfirmasi ganda), fixed partner.',
  groups: [
    {
      name: 'Grup 1',
      court: 'Court 1',
      teams: ['Padel Kaget', 'Net Not', 'BPC', 'Cochie Slayer'],
      slots: [
        ['12:20-12:35', 'Court 1', 0, 1],
        ['12:20-12:35', 'Court 2', 2, 3],
        ['12:35-12:50', 'Court 1', 0, 2],
        ['12:35-12:50', 'Court 2', 1, 3],
        ['13:05-13:20', 'Court 1', 0, 3],
        ['13:05-13:20', 'Court 2', 1, 2],
      ],
    },
    {
      name: 'Grup 2',
      court: 'Court 3',
      teams: ['Bangka Ngin', 'PKPK', 'Dirigen', 'Lucky Man'],
      slots: [
        ['12:20-12:35', 'Court 3', 0, 1],
        ['12:35-12:50', 'Court 3', 2, 3],
        ['14:00-14:15', 'Court 1', 0, 2],
        ['13:20-13:35', 'Court 1', 1, 3],
        ['13:05-13:20', 'Court 3', 0, 3],
        ['12:50-13:05', 'Court 1', 1, 2],
      ],
    },
    {
      name: 'Grup 3',
      court: 'Court 2',
      teams: ['AS Padel', 'Ruru', 'OG', 'Bocah AF'],
      slots: [
        ['12:50-13:05', 'Court 2', 0, 1],
        ['12:50-13:05', 'Court 3', 2, 3],
        ['13:35-13:50', 'Court 1', 0, 2],
        ['13:35-13:50', 'Court 2', 1, 3],
        ['14:00-14:15', 'Court 2', 0, 3],
        ['14:15-14:30', 'Court 1', 1, 2],
      ],
    },
    {
      name: 'Grup 4',
      court: 'Court 3',
      teams: ['Beat The Odds', 'Anak Tuhan', 'Bandar Bumi', 'KG Team'],
      slots: [
        ['13:20-13:35', 'Court 2', 0, 1],
        ['13:20-13:35', 'Court 3', 2, 3],
        ['13:35-13:50', 'Court 3', 0, 2],
        ['14:00-14:15', 'Court 3', 1, 3],
        ['14:15-14:30', 'Court 2', 0, 3],
        ['14:15-14:30', 'Court 3', 1, 2],
      ],
    },
  ],
};

const WD_CONFIG: PadelSeedConfig = {
  id: 'seed_padel_wd_v1',
  name: 'Padel Tournament — Women\u2019s Double',
  category: 'WOMEN_DOUBLES',
  categoryLabel: 'Ganda Putri (WD)',
  description:
    '12 pasangan • 3 pool round robin, race to 3 set (maksimal 5 set). Juara & runner-up masuk Upper Beginner; peringkat 3-4 masuk Beginner (masing-masing 6 pasangan + 2 bye). ' +
    'Basic rules: match harus mulai tepat waktu (toleransi telat 5 menit = WO), skor dicatat pemain/panitia (konfirmasi ganda), fixed partner.',
  groups: [
    {
      name: 'Grup 1',
      court: 'Court 1',
      teams: ['Bertiga', 'Padelpals', 'Gagak Putih', 'Huru Hara'],
      slots: WD_TIMES.map((time, i) => [time, 'Court 1', RR_ORDER[i][0], RR_ORDER[i][1]] as [string, string, number, number]),
    },
    {
      name: 'Grup 2',
      court: 'Court 2',
      teams: ['Rikitz', 'Patito', 'Sugarush', 'Chamomile'],
      slots: WD_TIMES.map((time, i) => [time, 'Court 2', RR_ORDER[i][0], RR_ORDER[i][1]] as [string, string, number, number]),
    },
    {
      name: 'Grup 3',
      court: 'Court 3',
      teams: ['Kalamata', 'Makuna', 'Pontang Panting', 'Double S'],
      slots: WD_TIMES.map((time, i) => [time, 'Court 3', RR_ORDER[i][0], RR_ORDER[i][1]] as [string, string, number, number]),
    },
  ],
};

function buildPadelTournament(cfg: PadelSeedConfig): Tournament {
  const participants: Participant[] = [];
  const matches: Match[] = [];
  let matchOrder = 1;
  let teamNo = 0;

  cfg.groups.forEach((group) => {
    const groupTeams: Participant[] = group.teams.map((team) => {
      teamNo += 1;
      const participant: Participant = {
        id: `${cfg.id}_team_${teamNo}`,
        name: team,
        player1: team,
        seed: teamNo,
        club: VENUE,
        group: group.name,
        groupRank: 0,
        groupPoints: 0,
        groupWins: 0,
        groupLosses: 0,
        groupSetsWon: 0,
        groupSetsLost: 0,
        groupSetDiff: 0,
        groupPointsWon: 0,
        groupPointsLost: 0,
        groupPointDiff: 0,
      };
      return participant;
    });
    participants.push(...groupTeams);

    group.slots.forEach(([time, court, p1Idx, p2Idx]) => {
      matches.push({
        id: `${cfg.id}_m${matchOrder}`,
        tournamentId: cfg.id,
        round: 1,
        roundName: `Fase Grup — ${group.name}`,
        matchOrder,
        participant1: groupTeams[p1Idx],
        participant2: groupTeams[p2Idx],
        scores: Array.from({ length: 5 }, (_, i) => ({ setNumber: i + 1, score1: 0, score2: 0 })),
        currentSet: 1,
        court,
        scheduledTime: `${time} WIB`,
        status: 'UPCOMING',
        winnerId: null,
        nextMatchId: null,
        phase: 'GROUP',
        groupName: group.name,
      });
      matchOrder += 1;
    });
  });

  return {
    id: cfg.id,
    name: cfg.name,
    sport: 'PADEL',
    category: cfg.category,
    categoryLabel: cfg.categoryLabel,
    venue: VENUE,
    city: 'Tangerang',
    startDate: EVENT_DATE,
    endDate: EVENT_DATE,
    status: 'UPCOMING',
    description: cfg.description,
    courts: ['Court 1', 'Court 2', 'Court 3'],
    participants,
    matches,
    rules: { ...PADEL_RULES },
    format: 'TWO_STAGE',
    groupStageCompleted: false,
    groupScheduleScheme: 'SPLIT_WAVE',
    registrations: [],
    createdAt: new Date().toISOString(),
  };
}

export const PADEL_MD_SEED_ID = MD_CONFIG.id;
export const PADEL_WD_SEED_ID = WD_CONFIG.id;

export function buildPadelTournamentSeed(): { mensDouble: Tournament; womensDouble: Tournament } {
  return {
    mensDouble: buildPadelTournament(MD_CONFIG),
    womensDouble: buildPadelTournament(WD_CONFIG),
  };
}
