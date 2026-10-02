'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Database, Loader2, Plus, Trash2 } from 'lucide-react';
import { TournamentService } from '@/lib/tournamentStore';
import { generateGroupStageMatches, getCategoryLabel } from '@/lib/bracketGenerator';
import { useAdminAuth } from '@/lib/authStore';
import type { Match, Participant, SetScore } from '@/types/tournament';
import {
  buildPadelTournamentSeed,
  PADEL_MD_SEED_ID,
  PADEL_WD_SEED_ID,
} from '@/lib/seedPadelTournament';

const SEED_ID = 'seed_two_stage_padel_custom';

// Data fixture tetap tersembunyi di production; data turnamen resmi bisa di-inject admin.
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

function isoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function buildParticipants(): Participant[] {
  const teams = [
    ['Smash Bros PC', 'Rizky Pratama', 'Aldi Saputra'],
    ['Garuda Padel', 'Bima Nugroho', 'Fajar Ramadhan'],
    ['Padel Rakyat', 'Deni Setiawan', 'Agus Wibowo'],
    ['Court Kings', 'Eko Prasetyo', 'Gilang Permana'],
    ['Bandung Smash', 'Hendra Wijaya', 'Irfan Maulana'],
    ['Surabaya Aces', 'Joko Santoso', 'Krisna Adi'],
    ['Bali Padel Club', 'Lukman Hakim', 'Mira Lestari'],
    ['Jakarta Volleys', 'Nadia Putri', 'Oscar Pratama'],
    ['Depok Drive', 'Putra Wibowo', 'Rani Safitri'],
    ['Bogor Backhand', 'Sari Dewi', 'Teguh Santosa'],
    ['Tangerang Tops', 'Umar Abdullah', 'Vina Anggraini'],
    ['Bekasi Boosters', 'Wawan Kurniawan', 'Yoga Permana'],
    ['Semarang Spins', 'Zaki Mubarok', 'Dita Rahma'],
    ['Yogya Aces', 'Feri Gunawan', 'Gita Savitri'],
    ['Malang Masters', 'Hariyanto', 'Indra Kusuma'],
    ['Medan Mavericks', 'Jihan Aulia', 'Kevin Halim'],
  ];

  return teams.map(([name, player1, player2], index) => ({
    id: `seed_team_${index + 1}`,
    name,
    player1,
    player2,
    seed: index + 1,
    club: name,
  }));
}

// Skor custom padel: set sampai 6 game (7-5 bila deuce), fase grup best-of-5
// (pertama mencapai 3 set). Pola diputar agar hasil grup terlihat beragam.
const FINISH_PATTERNS: number[][][] = [
  [[6, 2], [6, 3], [6, 4]], // 3-0
  [[6, 4], [2, 6], [6, 3], [6, 3]], // 3-1
  [[6, 4], [3, 6], [7, 5], [4, 6], [6, 4]], // 3-2
];

function buildScoreSlots(pattern: number[][], winnerSide: 1 | 2): SetScore[] {
  const played: SetScore[] = pattern.map(([a, b], index) => ({
    setNumber: index + 1,
    score1: winnerSide === 1 ? a : b,
    score2: winnerSide === 1 ? b : a,
  }));
  while (played.length < 5) {
    played.push({ setNumber: played.length + 1, score1: 0, score2: 0 });
  }
  return played;
}

function seedTournament(): { tournament: ReturnType<typeof buildSeedTournament> } {
  return { tournament: buildSeedTournament() };
}

function buildSeedTournament() {
  const participants = buildParticipants();
  const courts = ['Court 1', 'Court 2', 'Court 3', 'Court 4'];
  const { matches, groupedParticipants } = generateGroupStageMatches(SEED_ID, participants, courts);

  const processedMatches: Match[] = matches.map((match, index) => {
    // 12 match pertama selesai, 1 match LIVE, sisanya menjadwal
    if (index < 12) {
      const pattern = FINISH_PATTERNS[index % FINISH_PATTERNS.length];
      const winnerSide: 1 | 2 = index % 2 === 0 ? 1 : 2;
      const winnerId = winnerSide === 1 ? match.participant1?.id : match.participant2?.id;
      return {
        ...match,
        scores: buildScoreSlots(pattern, winnerSide),
        status: 'FINISHED' as const,
        winnerId: winnerId || null,
      };
    }
    if (index === 12) {
      return {
        ...match,
        scores: [
          { setNumber: 1, score1: 6, score2: 4 },
          { setNumber: 2, score1: 3, score2: 2 },
          { setNumber: 3, score1: 0, score2: 0 },
          { setNumber: 4, score1: 0, score2: 0 },
          { setNumber: 5, score1: 0, score2: 0 },
        ],
        currentSet: 2,
        servingSide: 1,
        status: 'LIVE' as const,
      };
    }
    return match;
  });

  return {
    id: SEED_ID,
    name: 'Uji Coba Two Stage Padel Custom',
    sport: 'PADEL' as const,
    format: 'TWO_STAGE_PADEL_CUSTOM' as const,
    groupStageCompleted: false,
    category: 'OPEN_DOUBLES' as const,
    categoryLabel: getCategoryLabel('OPEN_DOUBLES'),
    venue: 'GOR Padel Sentral',
    city: 'Jakarta',
    startDate: isoDate(),
    endDate: isoDate(2),
    status: 'LIVE' as const,
    description:
      'Data uji: Two Stage Padel Custom — 16 pasangan (4 grup round robin) ➔ 2 bagan knockout (Upper & Bottom), skor custom best-of-5.',
    courts,
    participants: groupedParticipants,
    matches: processedMatches,
    rules: {
      pointsPerSet: 6,
      maxSets: 3,
      deuceMargin: 2,
      customPadelScoring: true,
    },
    groupScheduleScheme: 'SPLIT_WAVE' as const,
    registrations: [],
    createdAt: new Date().toISOString(),
  };
}

export default function SeedPage() {
  const router = useRouter();
  const { isAdmin, isReady } = useAdminAuth();
  const [isWorking, setIsWorking] = useState<'inject' | 'delete' | 'padel' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, isReady, router]);

  const alreadyExists = TournamentService.getById(SEED_ID) !== null;

  const handleInject = async () => {
    setIsWorking('inject');
    setNotice(null);
    try {
      const { tournament } = seedTournament();
      await TournamentService.create(tournament);
      router.push(`/admin/tournament/${SEED_ID}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Gagal meng-inject data uji.');
      setIsWorking(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Hapus data uji Two Stage Padel Custom dari database?')) return;
    setIsWorking('delete');
    setNotice(null);
    try {
      TournamentService.delete(SEED_ID);
      setNotice('Data uji dihapus (jika sebelumnya ada).');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Gagal menghapus data uji.');
    } finally {
      setIsWorking(null);
    }
  };

  const handleInjectPadel = async () => {
    const hasExisting = TournamentService.getById(PADEL_MD_SEED_ID) || TournamentService.getById(PADEL_WD_SEED_ID);
    if (hasExisting && !confirm('Salah satu turnamen padel template sudah ada. Meng-inject ulang akan mengganti kedua turnamen template ini beserta jadwal dan skornya. Lanjutkan?')) return;
    setIsWorking('padel');
    setNotice(null);
    try {
      const { mensDouble, womensDouble } = buildPadelTournamentSeed();
      await TournamentService.create(mensDouble);
      await TournamentService.create(womensDouble);
      router.push(`/admin/tournament/${PADEL_MD_SEED_ID}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Gagal meng-inject turnamen padel.');
      setIsWorking(null);
    }
  };

  if (!isReady || !isAdmin) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {IS_DEVELOPMENT && (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="space-y-1 border-b border-slate-800 pb-5">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-lime-400" />
            Inject Data Uji
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Isi database dengan contoh turnamen <b className="text-slate-200">Two Stage Padel Custom</b> siap
            diuji — tanpa input manual satu per satu.
          </p>
        </div>

        <ul className="space-y-2 text-xs text-slate-300 font-medium">
          <li>• 16 pasangan (doubles) → otomatis dibagi ke <b className="text-slate-200">4 Grup</b> round robin.</li>
          <li>• 24 match fase grup: <b className="text-emerald-300">12 selesai</b> (dengan skor lengkap), <b className="text-red-300">1 LIVE</b>, 11 terjadwal dengan lapangan/wasit/jam.</li>
          <li>• Skor custom padel: set ke 6 game (7-5 bila deuce), fase grup best-of-5.</li>
          <li>• Status turnamen LIVE → langsung tampil di Live Match Center & halaman publik.</li>
        </ul>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex gap-3 text-xs text-amber-200 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Data ditulis langsung ke Supabase dengan sesi admin Anda dan akan terlihat di semua perangkat.
            Gunakan tombol hapus di bawah untuk membersihkannya setelah selesai menguji.
          </span>
        </div>

        {notice && (
          <p className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs font-bold text-slate-200">
            {notice}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => void handleInject()}
            disabled={isWorking !== null}
            className="flex-1 rounded-xl bg-lime-500 px-4 py-3.5 text-sm font-black text-slate-950 hover:bg-lime-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isWorking === 'inject' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 stroke-[3]" />
            )}
            {isWorking === 'inject' ? 'Meng-inject...' : 'Inject Data Uji'}
          </button>
          <button
            onClick={() => void handleDelete()}
            disabled={isWorking !== null}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isWorking === 'delete' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Hapus Data Uji
          </button>
        </div>

        {alreadyExists && (
          <p className="text-[11px] font-bold text-amber-300">
            Data uji sudah ada di perangkat ini — meng-inject ulang akan menggantinya dengan yang baru.
          </p>
        )}
      </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-white">Inject Turnamen Padel (Data Nyata)</h2>
          <p className="text-xs text-slate-400 font-medium">
            Men&apos;s Double (16 pasangan, 4 pool) &amp; Women&apos;s Double (12 pasangan, 3 pool) —
            Sabtu 3 Oktober 2026, WIN PADEL SUVARNA SUTERA. Semua grup, lapangan, dan jadwal sesuai dokumen resmi.
          </p>
        </div>

        <ul className="space-y-2 text-xs text-slate-300 font-medium">
          <li>• <b className="text-slate-200">Men&apos;s Double</b>: 16 pasangan, Grup 1-4 (Pool A-D), 24 match grup terjadwal 12:20-14:30 WIB.</li>
          <li>• <b className="text-slate-200">Women&apos;s Double</b>: 12 pasangan, Grup 1-3, 18 match grup terjadwal 09:00-10:30 WIB.</li>
          <li>• Skor grup hanya menginput jumlah set menang race-to-3 (contoh 3–2), tanpa memasukkan skor game per set.</li>
          <li>• Status awal UPCOMING. Setelah semua laga grup selesai, kunci klasemen untuk membentuk upper &amp; beginner knockout.</li>
          <li>• Meng-inject ulang akan memperbarui dua turnamen dengan ID template yang sama; data turnamen lain tidak disentuh.</li>
        </ul>

        <button
          onClick={() => void handleInjectPadel()}
          disabled={isWorking !== null}
          className="w-full rounded-xl bg-lime-500 px-4 py-3.5 text-sm font-black text-slate-950 hover:bg-lime-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isWorking === 'padel' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 stroke-[3]" />
          )}
          {isWorking === 'padel' ? 'Meng-inject...' : 'Inject Turnamen Padel (MD & WD)'}
        </button>
      </div>
    </div>
  );
}
