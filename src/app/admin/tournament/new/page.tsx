'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/lib/authStore';
import { TournamentService } from '@/lib/tournamentStore';
import {
  generateBracketMatches,
  generateGroupStageMatches,
  getCategoryLabel,
} from '@/lib/bracketGenerator';
import {
  SportType,
  TournamentCategory,
  TournamentFormat,
  Participant,
  Tournament,
  Match,
} from '@/types/tournament';
import {
  ArrowLeft,
  Trophy,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Layers,
  Shield,
  Medal,
} from 'lucide-react';

const SAMPLE_16_BADMINTON: Participant[] = [
  { id: 'p_1', name: 'Fajar Alfian / M. Rian Ardianto', player1: 'Fajar Alfian', player2: 'M. Rian Ardianto', seed: 1, club: 'PB Tangkas' },
  { id: 'p_2', name: 'Kevin Sanjaya / Marcus Gideon', player1: 'Kevin Sanjaya', player2: 'Marcus Gideon', seed: 2, club: 'PB Djarum' },
  { id: 'p_3', name: 'Mohammad Ahsan / Hendra Setiawan', player1: 'Mohammad Ahsan', player2: 'Hendra Setiawan', seed: 3, club: 'PB Jaya Raya' },
  { id: 'p_4', name: 'Leo Rolly Carnando / Daniel Marthin', player1: 'Leo Rolly Carnando', player2: 'Daniel Marthin', seed: 4, club: 'PB Exist' },
  { id: 'p_5', name: 'Bagas Maulana / M. Shohibul Fikri', player1: 'Bagas Maulana', player2: 'M. Shohibul Fikri', seed: 5, club: 'PB Djarum' },
  { id: 'p_6', name: 'Pramudya K. / Yeremia Rambitan', player1: 'Pramudya K.', player2: 'Yeremia R.', seed: 6, club: 'PB Jaya Raya' },
  { id: 'p_7', name: 'Sabar Karyaman / Reza Pahlevi', player1: 'Sabar Karyaman', player2: 'Reza Pahlevi', seed: 7, club: 'PB Tangkas' },
  { id: 'p_8', name: 'Rayhan Nur Fadillah / Rahmat Hidayat', player1: 'Rayhan N. F.', player2: 'Rahmat Hidayat', seed: 8, club: 'PB Djarum' },
  { id: 'p_9', name: 'Chico Wardoyo / Alwi Farhan', player1: 'Chico Wardoyo', player2: 'Alwi Farhan', seed: 9, club: 'PB Exist' },
  { id: 'p_10', name: 'Christian Adinata / Yohanes Saut', player1: 'Christian Adinata', player2: 'Yohanes Saut', seed: 10, club: 'PB Tangkas' },
  { id: 'p_11', name: 'Bobby Setiabudi / Teges Satriaji', player1: 'Bobby Setiabudi', player2: 'Teges Satriaji', seed: 11, club: 'PB Djarum' },
  { id: 'p_12', name: 'Putra Erwiansyah / Patra Harapan', player1: 'Putra Erwiansyah', player2: 'Patra Harapan', seed: 12, club: 'PB Jaya Raya' },
  { id: 'p_13', name: 'Raymond Indra / Nikolaus Joaquin', player1: 'Raymond Indra', player2: 'Nikolaus Joaquin', seed: 13, club: 'PB Djarum' },
  { id: 'p_14', name: 'Anselmus Prasetya / Pulung Ramadhan', player1: 'Anselmus Prasetya', player2: 'Pulung Ramadhan', seed: 14, club: 'PB Djarum' },
  { id: 'p_15', name: 'Adrian Pratama / Jonathan Farrell', player1: 'Adrian Pratama', player2: 'Jonathan Farrell', seed: 15, club: 'PB Jaya Raya' },
  { id: 'p_16', name: 'Dexter Farrell / Wahyu Agung', player1: 'Dexter Farrell', player2: 'Wahyu Agung', seed: 16, club: 'PB Exist' },
];

const SAMPLE_16_PADEL: Participant[] = [
  { id: 'p_1', name: 'Arturo Coello / Agustín Tapia', player1: 'Arturo Coello', player2: 'Agustín Tapia', seed: 1, club: 'Bali Padel Club' },
  { id: 'p_2', name: 'Ale Galán / Juan Lebrón', player1: 'Ale Galán', player2: 'Juan Lebrón', seed: 2, club: 'Lombok Padel' },
  { id: 'p_3', name: 'Franco Stupaczuk / Martin Di Nenno', player1: 'Franco Stupaczuk', player2: 'Martin Di Nenno', seed: 3, club: 'Canggu Arena' },
  { id: 'p_4', name: 'Paquito Navarro / Sanyo Gutiérrez', player1: 'Paquito Navarro', player2: 'Sanyo Gutiérrez', seed: 4, club: 'Jakarta Smash' },
  { id: 'p_5', name: 'Fede Chingotto / Javi Garrido', player1: 'Fede Chingotto', player2: 'Javi Garrido', seed: 5, club: 'Surabaya Padel' },
  { id: 'p_6', name: 'Momo González / Alex Ruiz', player1: 'Momo González', player2: 'Alex Ruiz', seed: 6, club: 'Lombok Padel' },
  { id: 'p_7', name: 'Coki Nieto / Jon Sanz', player1: 'Coki Nieto', player2: 'Jon Sanz', seed: 7, club: 'Bali Padel Club' },
  { id: 'p_8', name: 'Maxi Sánchez / Lucho Capra', player1: 'Maxi Sánchez', player2: 'Lucho Capra', seed: 8, club: 'Seminyak Padel' },
  { id: 'p_9', name: 'Lucas Campagnolo / Javi Leal', player1: 'Lucas Campagnolo', player2: 'Javi Leal', seed: 9, club: 'Jakarta Smash' },
  { id: 'p_10', name: 'Gonzalo Rubio / Maxi Arce', player1: 'Gonzalo Rubio', player2: 'Maxi Arce', seed: 10, club: 'Bali Padel Club' },
  { id: 'p_11', name: 'Ramiro Moyano / Xisco Gil', player1: 'Ramiro Moyano', player2: 'Xisco Gil', seed: 11, club: 'Bandung Padel' },
  { id: 'p_12', name: 'Javier Barahona / Javi García', player1: 'Javier Barahona', player2: 'Javi García', seed: 12, club: 'Surabaya Padel' },
  { id: 'p_13', name: 'Pincho Fernández / José Diestro', player1: 'Pincho Fernández', player2: 'José Diestro', seed: 13, club: 'Lombok Padel' },
  { id: 'p_14', name: 'Tino Libaak / Leo Augsburger', player1: 'Tino Libaak', player2: 'Leo Augsburger', seed: 14, club: 'Bali Padel Club' },
  { id: 'p_15', name: 'Pablo Cardona / Ivan Ramirez', player1: 'Pablo Cardona', player2: 'Ivan Ramirez', seed: 15, club: 'Jakarta Smash' },
  { id: 'p_16', name: 'Edu Alonso / Alex Arroyo', player1: 'Edu Alonso', player2: 'Alex Arroyo', seed: 16, club: 'Seminyak Padel' },
];

export default function NewTournamentPage() {
  const router = useRouter();
  const { isAdmin, isReady } = useAdminAuth();

  useEffect(() => {
    if (isReady && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, isReady, router]);

  // Form states
  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('TWO_STAGE');
  const [sport, setSport] = useState<SportType>('BADMINTON');
  const [customPadelScoring, setCustomPadelScoring] = useState(false);
  const [category, setCategory] = useState<TournamentCategory>('MEN_DOUBLES');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-03');
  const [description, setDescription] = useState('');
  const [courtsText, setCourtsText] = useState('Court 1, Court 2, Court 3, Court 4');

  // Participants
  const [participants, setParticipants] = useState<Participant[]>(SAMPLE_16_BADMINTON);

  // When format changes, adjust participant count
  const handleFormatChange = (newFormat: TournamentFormat) => {
    setFormat(newFormat);
    if (newFormat === 'TWO_STAGE_PADEL_CUSTOM') {
      setParticipants([]); // Start empty for registration workflow
      setCourtsText('Court 1, Court 2, Court 3, Court 4');
    } else if (newFormat === 'TWO_STAGE') {
      setParticipants(sport === 'BADMINTON' ? SAMPLE_16_BADMINTON : SAMPLE_16_PADEL);
      setCourtsText('Court 1, Court 2, Court 3, Court 4');
    } else {
      setParticipants(
        (sport === 'BADMINTON' ? SAMPLE_16_BADMINTON : SAMPLE_16_PADEL).slice(0, 8)
      );
      setCourtsText('Court 1, Court 2, Court 3');
    }
  };

  const handleFillSample = () => {
    if (format === 'TWO_STAGE') {
      if (sport === 'BADMINTON') {
        setName('Kejuaraan Ganda Badminton 4 Grup & Double Knockout 2026');
        setVenue('GOR Djarum Arena');
        setCity('Kudus');
        setDescription(
          'Format Dua Tahap: 16 Pasangan di 4 Grup Round Robin, dilanjutkan 2 Bagan Knockout (Upper Beginner & Beginner).'
        );
        setParticipants(SAMPLE_16_BADMINTON);
      } else {
        setName('Lombok Padel Two-Stage Championship 2026');
        setVenue('Senggigi Padel Club');
        setCity('Lombok Barat');
        setDescription(
          'Format Dua Tahap: 16 Pasangan di 4 Grup Round Robin, dilanjutkan 2 Bagan Knockout (Upper & Beginner).'
        );
        setParticipants(SAMPLE_16_PADEL);
      }
    } else {
      if (sport === 'BADMINTON') {
        setName('Surabaya Badminton Super Series 2026');
        setVenue('GOR Kertajaya');
        setCity('Surabaya');
        setDescription('Kejuaraan bulutangkis antar klub se-Jawa Timur kategori ganda.');
        setParticipants(SAMPLE_16_BADMINTON.slice(0, 8));
      } else {
        setName('Lombok Padel Open Trophy 2026');
        setVenue('Senggigi Padel Club');
        setCity('Lombok Barat');
        setDescription('Turnamen padel invitasi nasional di pulau Lombok.');
        setParticipants(SAMPLE_16_PADEL.slice(0, 8));
      }
    }
  };

  const handleUpdateParticipant = (index: number, key: keyof Participant, value: any) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [key]: value };
    setParticipants(updated);
  };

  const handleAddParticipant = () => {
    const nextIdx = participants.length + 1;
    setParticipants([
      ...participants,
      {
        id: `p_${Date.now()}_${nextIdx}`,
        name: `Pasangan ${nextIdx}`,
        player1: `Pemain ${nextIdx}A`,
        player2: `Pemain ${nextIdx}B`,
        seed: nextIdx,
        club: 'Klub Mandiri',
      },
    ]);
  };

  const handleRemoveParticipant = (index: number) => {
    if (format === 'TWO_STAGE' && participants.length <= 16) {
      if (
        !confirm('Sistem Dua Tahap membutuhkan tepat 16 pasangan (4 grup @ 4 tim). Tetap ingin menghapus?')
      ) {
        return;
      }
    } else if (format === 'KNOCKOUT' && participants.length <= 4) {
      alert('Minimal 4 peserta untuk bagan sistem gugur.');
      return;
    }
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Mohon masukkan nama turnamen.');
      return;
    }

    if (format === 'TWO_STAGE' && participants.length < 16) {
      alert('Sistem Dua Tahap membutuhkan minimal 16 pasangan (4 grup @ 4 pasangan). Silakan tambahkan slot peserta.');
      return;
    }

    const courts = courtsText
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const tournamentId = `t_${Date.now()}`;
    let generatedMatches: Match[] = [];
    let finalParticipants: Participant[] = participants;

    if (format === 'TWO_STAGE_PADEL_CUSTOM') {
      // Start empty, admin will generate groups later when 16 participants register
      generatedMatches = [];
      finalParticipants = [];
    } else if (format === 'TWO_STAGE') {
      const result = generateGroupStageMatches(
        tournamentId,
        participants,
        courts.length > 0 ? courts : ['Court 1', 'Court 2', 'Court 3', 'Court 4']
      );
      generatedMatches = result.matches;
      finalParticipants = result.groupedParticipants;
    } else {
      generatedMatches = generateBracketMatches(
        tournamentId,
        participants,
        courts.length > 0 ? courts : ['Court 1', 'Court 2']
      );
    }

    const newTournament: Tournament = {
      id: tournamentId,
      name,
      sport,
      format,
      groupStageCompleted: false,
      category,
      categoryLabel: getCategoryLabel(category),
      venue: venue || 'GOR Utama',
      city: city || 'Jakarta',
      startDate,
      endDate,
      status: 'UPCOMING',
      description:
        description ||
        (format === 'TWO_STAGE'
          ? 'Turnamen Dua Tahap (4 Grup Round Robin ➔ 2 Bagan Knockout Upper & Beginner).'
          : 'Turnamen resmi dengan bagan sistem gugur (knockout).'),
      courts:
        courts.length > 0
          ? courts
          : format === 'TWO_STAGE'
          ? ['Court 1', 'Court 2', 'Court 3', 'Court 4']
          : ['Court 1', 'Court 2'],
      participants: finalParticipants,
      matches: generatedMatches,
      rules: {
        pointsPerSet: sport === 'BADMINTON' ? 21 : 6,
        maxSets: 3,
        deuceMargin: 2,
        maxPointCap: sport === 'BADMINTON' ? 30 : undefined,
        customPadelScoring: format === 'TWO_STAGE_PADEL_CUSTOM',
      },
      createdAt: new Date().toISOString(),
    };

    TournamentService.create(newTournament);
    router.push(`/admin/tournament/${tournamentId}`);
  };

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard Admin
        </Link>
        <button
          type="button"
          onClick={handleFillSample}
          className="px-3.5 py-1.5 rounded-xl bg-lime-500/20 hover:bg-lime-500/30 border border-lime-500/40 text-lime-300 text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          Isi Contoh Cepat ({sport} - {format === 'TWO_STAGE' ? '16 Pasangan' : '8 Pasangan'})
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="space-y-1 border-b border-slate-800 pb-5">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Buat Turnamen Baru
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Pilih model format turnamen dan daftarkan peserta. Sistem akan secara otomatis membentuk bagan pertandingan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* FORMAT PERTANDINGAN SELECTION */}
          <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Pilih Format & Sistem Pertandingan *
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Option 1: Two-Stage (Group Stage + Double Bracket) */}
              <div
                onClick={() => handleFormatChange('TWO_STAGE')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  format === 'TWO_STAGE'
                    ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      FORMAT RESMI • 4 GRUP + 2 BAGAN
                    </span>
                    <h3 className="text-sm font-black text-white mt-2 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-blue-400" />
                      Sistem 4 Grup ➔ Double Knockout
                    </h3>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      format === 'TWO_STAGE' ? 'border-blue-400 bg-blue-500' : 'border-slate-600'
                    }`}
                  >
                    {format === 'TWO_STAGE' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-2 font-medium">
                  <strong>16 Pasangan</strong> dibagi ke dalam <strong>4 Grup (@ 4 Pasangan)</strong>.
                </p>
                <ul className="text-[11px] text-slate-400 mt-2 space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <li className="text-blue-300 font-bold">
                    • <strong>Top 2 Tiap Grup</strong> ➔ Lolos ke <strong>Bagan Upper Beginner</strong> (8 Tim)
                  </li>
                  <li className="text-emerald-300 font-bold">
                    • <strong>Bottom 2 Tiap Grup</strong> ➔ Lolos ke <strong>Bagan Beginner</strong> (8 Tim)
                  </li>
                  <li className="text-amber-300 font-bold">
                    • Terdapat <strong>2 Juara / Podium</strong> (Juara Upper & Juara Beginner).
                  </li>
                </ul>
              </div>

              {/* Option 2: Single Elimination Knockout */}
              <div
                onClick={() => handleFormatChange('KNOCKOUT')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  format === 'KNOCKOUT'
                    ? 'bg-lime-500/10 border-lime-400 ring-2 ring-lime-400/30 shadow-lg shadow-lime-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-300 border border-lime-500/40">
                      STANDAR KNOCKOUT
                    </span>
                    <h3 className="text-sm font-black text-white mt-2 flex items-center gap-1.5">
                      <Medal className="w-4 h-4 text-lime-400" />
                      Bagan Sistem Gugur Langsung
                    </h3>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      format === 'KNOCKOUT' ? 'border-lime-400 bg-lime-400' : 'border-slate-600'
                    }`}
                  >
                    {format === 'KNOCKOUT' && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-2 font-medium">
                  Bagan pohon eliminasi tunggal langsung (4, 8, atau 16 peserta).
                </p>
                <ul className="text-[11px] text-slate-400 mt-2 space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <li>• Peserta langsung diundi ke babak Perempat Final / Semifinal</li>
                  <li>• Pemenang pertandingan langsung melaju ke babak berikutnya</li>
                  <li>• 1 Juara Utama</li>
                </ul>
              </div>

              {/* Option 3: Two-Stage Padel Custom */}
              {sport === 'PADEL' && (
                <div
                  onClick={() => handleFormatChange('TWO_STAGE_PADEL_CUSTOM')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    format === 'TWO_STAGE_PADEL_CUSTOM'
                      ? 'bg-purple-600/10 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        TWO-STAGE PADEL CUSTOM
                      </span>
                      <h3 className="text-sm font-black text-white mt-2 flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-purple-400" />
                        Sistem 2 Tahap (Scoring Khusus)
                      </h3>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        format === 'TWO_STAGE_PADEL_CUSTOM' ? 'border-purple-400 bg-purple-500' : 'border-slate-600'
                      }`}
                    >
                      {format === 'TWO_STAGE_PADEL_CUSTOM' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 font-medium">
                    Template khusus dengan target *games* berbeda per fase.
                  </p>
                  <ul className="text-[11px] text-slate-400 mt-2 space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <li>• <strong>Group & Quarter:</strong> Best of 5 (First to 3 Games)</li>
                    <li>• <strong>Semifinal:</strong> First to 4 Games</li>
                    <li>• <strong>Final:</strong> First to 6 Games</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Nama Turnamen *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Jakarta Badminton Double Open 2026"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Cabang Olahraga *
              </label>
              <select
                value={sport}
                onChange={(e) => {
                  const s = e.target.value as SportType;
                  setSport(s);
                  if (format === 'TWO_STAGE') {
                    setParticipants(s === 'BADMINTON' ? SAMPLE_16_BADMINTON : SAMPLE_16_PADEL);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-lime-400"
              >
                <option value="BADMINTON">🏸 Bulutangkis / Badminton (21 Poin)</option>
                <option value="PADEL">🎾 Padel Tennis (6 Games Set)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Kategori Pertandingan *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TournamentCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-lime-400"
              >
                <option value="MEN_DOUBLES">Ganda Putra (Men Doubles / MD)</option>
                <option value="WOMEN_DOUBLES">Ganda Putri (Women Doubles / WD)</option>
                <option value="MIXED_DOUBLES">Ganda Campuran (Mixed Doubles / XD)</option>
                <option value="OPEN_DOUBLES">Ganda Open (Padel / Badminton)</option>
                <option value="MEN_SINGLES">Tunggal Putra (Men Singles / MS)</option>
                <option value="WOMEN_SINGLES">Tunggal Putri (Women Singles / WS)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Nama Venue / GOR *
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Contoh: Istora Senayan GBK"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Kota Pelaksanaan *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Contoh: Jakarta Pusat"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-lime-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-lime-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Daftar Lapangan (Pisahkan dengan tanda koma)
              </label>
              <input
                type="text"
                value={courtsText}
                onChange={(e) => setCourtsText(e.target.value)}
                placeholder="Contoh: Court 1, Court 2, Court 3, Court 4"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-lime-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Deskripsi Singkat Turnamen
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Penjelasan singkat turnamen..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-lime-400"
              />
            </div>
          </div>

          {/* Participants Seeding */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Daftar Peserta & Seeding</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-lime-400 text-xs font-black">
                    {participants.length} Pasangan
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {format === 'TWO_STAGE'
                    ? 'Sistem Dua Tahap membagi 16 pasangan secara otomatis ke 4 grup seimbang berdasarkan urutan Seed.'
                    : 'Untuk bagan sistem gugur standar, disarankan 4, 8, atau 16 peserta.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddParticipant}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Slot
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {participants.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800"
                >
                  <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handleUpdateParticipant(idx, 'name', e.target.value)}
                      placeholder="Nama Pemain / Pasangan"
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-lime-400"
                      required
                    />
                    <input
                      type="text"
                      value={p.club || ''}
                      onChange={(e) => handleUpdateParticipant(idx, 'club', e.target.value)}
                      placeholder="Klub / Asal Kota"
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-lime-400"
                    />
                    <input
                      type="number"
                      value={p.seed || ''}
                      onChange={(e) =>
                        handleUpdateParticipant(
                          idx,
                          'seed',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="Seed (1-16)"
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(idx)}
                    className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-black shadow-lg shadow-lime-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>
                {format === 'TWO_STAGE'
                  ? 'Simpan & Bentuk 4 Grup Round Robin'
                  : 'Simpan & Generate Bagan Turnamen'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
