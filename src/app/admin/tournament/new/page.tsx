'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/lib/authStore';
import { TournamentService } from '@/lib/tournamentStore';
import { generateBracketMatches, getCategoryLabel } from '@/lib/bracketGenerator';
import {
  SportType,
  TournamentCategory,
  Participant,
  Tournament,
} from '@/types/tournament';
import {
  ArrowLeft,
  Trophy,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

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
  const [sport, setSport] = useState<SportType>('BADMINTON');
  const [category, setCategory] = useState<TournamentCategory>('MEN_DOUBLES');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-03');
  const [description, setDescription] = useState('');
  const [courtsText, setCourtsText] = useState('Court 1, Court 2, Court 3');

  // Participants (default 8)
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'p_1', name: 'Pemain 1 / Pasangan 1', player1: 'Pemain 1', seed: 1, club: 'Klub A' },
    { id: 'p_2', name: 'Pemain 2 / Pasangan 2', player1: 'Pemain 2', seed: 8, club: 'Klub B' },
    { id: 'p_3', name: 'Pemain 3 / Pasangan 3', player1: 'Pemain 3', seed: 4, club: 'Klub C' },
    { id: 'p_4', name: 'Pemain 4 / Pasangan 4', player1: 'Pemain 4', seed: 5, club: 'Klub D' },
    { id: 'p_5', name: 'Pemain 5 / Pasangan 5', player1: 'Pemain 5', seed: 6, club: 'Klub E' },
    { id: 'p_6', name: 'Pemain 6 / Pasangan 6', player1: 'Pemain 6', seed: 3, club: 'Klub F' },
    { id: 'p_7', name: 'Pemain 7 / Pasangan 7', player1: 'Pemain 7', seed: 7, club: 'Klub G' },
    { id: 'p_8', name: 'Pemain 8 / Pasangan 8', player1: 'Pemain 8', seed: 2, club: 'Klub H' },
  ]);

  const handleFillSample = () => {
    if (sport === 'BADMINTON') {
      setName('Surabaya Badminton Super Series 2026');
      setVenue('GOR Kertajaya');
      setCity('Surabaya');
      setDescription('Kejuaraan bulutangkis antar klub se-Jawa Timur kategori ganda.');
      setParticipants([
        { id: 'p_1', name: 'Anthony Ginting / Jonatan Christie', player1: 'Anthony Ginting', player2: 'Jonatan Christie', seed: 1, club: 'PB Tangkas' },
        { id: 'p_2', name: 'Chico Wardoyo / Alwi Farhan', player1: 'Chico Wardoyo', player2: 'Alwi Farhan', seed: 8, club: 'PB Exist' },
        { id: 'p_3', name: 'Bagas Maulana / Daniel Marthin', player1: 'Bagas Maulana', player2: 'Daniel Marthin', seed: 4, club: 'PB Djarum' },
        { id: 'p_4', name: 'Leo Carnando / M. Shohibul Fikri', player1: 'Leo Carnando', player2: 'M. Shohibul Fikri', seed: 5, club: 'PB Djarum' },
        { id: 'p_5', name: 'Pramudya K. / Rahmat Hidayat', player1: 'Pramudya K.', player2: 'Rahmat Hidayat', seed: 6, club: 'PB Jaya Raya' },
        { id: 'p_6', name: 'Mohammad Ahsan / Hendra Setiawan', player1: 'Mohammad Ahsan', player2: 'Hendra Setiawan', seed: 3, club: 'PB Djarum' },
        { id: 'p_7', name: 'Sabar Karyaman / Reza Pahlevi', player1: 'Sabar Karyaman', player2: 'Reza Pahlevi', seed: 7, club: 'PB Tangkas' },
        { id: 'p_8', name: 'Fajar Alfian / M. Rian Ardianto', player1: 'Fajar Alfian', player2: 'M. Rian Ardianto', seed: 2, club: 'PB Jaya Raya' },
      ]);
    } else {
      setName('Lombok Padel Open Trophy 2026');
      setVenue('Senggigi Padel Club');
      setCity('Lombok Barat');
      setDescription('Turnamen padel invitasi nasional di pulau Lombok.');
      setParticipants([
        { id: 'p_1', name: 'Ale Galán / Juan Lebrón', player1: 'Ale Galán', player2: 'Juan Lebrón', seed: 1, club: 'Lombok Padel' },
        { id: 'p_2', name: 'Paquito Navarro / Sanyo Gutiérrez', player1: 'Paquito Navarro', player2: 'Sanyo Gutiérrez', seed: 8, club: 'Jakarta Smash' },
        { id: 'p_3', name: 'Franco Stupaczuk / Martin Di Nenno', player1: 'Franco Stupaczuk', player2: 'Martin Di Nenno', seed: 4, club: 'Bali Arena' },
        { id: 'p_4', name: 'Momo González / Alex Ruiz', player1: 'Momo González', player2: 'Alex Ruiz', seed: 5, club: 'Lombok Padel' },
        { id: 'p_5', name: 'Fede Chingotto / Javi Garrido', player1: 'Fede Chingotto', player2: 'Javi Garrido', seed: 6, club: 'Surabaya Padel' },
        { id: 'p_6', name: 'Jon Sanz / Coki Nieto', player1: 'Jon Sanz', player2: 'Coki Nieto', seed: 3, club: 'Jakarta Smash' },
        { id: 'p_7', name: 'Maxi Sánchez / Lucho Capra', player1: 'Maxi Sánchez', player2: 'Lucho Capra', seed: 7, club: 'Bali Arena' },
        { id: 'p_8', name: 'Arturo Coello / Agustín Tapia', player1: 'Arturo Coello', player2: 'Agustín Tapia', seed: 2, club: 'Senggigi Club' },
      ]);
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
        name: `Pemain ${nextIdx}`,
        player1: `Pemain ${nextIdx}`,
        club: 'Klub Mandiri',
      },
    ]);
  };

  const handleRemoveParticipant = (index: number) => {
    if (participants.length <= 4) {
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

    const courts = courtsText
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const tournamentId = `t_${Date.now()}`;
    const generatedMatches = generateBracketMatches(tournamentId, participants, courts);

    const newTournament: Tournament = {
      id: tournamentId,
      name,
      sport,
      category,
      categoryLabel: getCategoryLabel(category),
      venue: venue || 'GOR Utama',
      city: city || 'Jakarta',
      startDate,
      endDate,
      status: 'UPCOMING',
      description: description || 'Turnamen resmi dengan bagan sistem gugur (knockout).',
      courts: courts.length > 0 ? courts : ['Court 1', 'Court 2'],
      participants,
      matches: generatedMatches,
      rules: {
        pointsPerSet: sport === 'BADMINTON' ? 21 : 6,
        maxSets: 3,
        deuceMargin: 2,
        maxPointCap: sport === 'BADMINTON' ? 30 : undefined,
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
          Isi Contoh Cepat ({sport})
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="space-y-1 border-b border-slate-800 pb-5">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Buat Turnamen Baru & Generate Bagan
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Sistem akan secara otomatis menyusun bagan sistem gugur (*knockout bracket tree*) berdasarkan peserta yang didaftarkan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Contoh: Jakarta Badminton Open 2026"
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
                onChange={(e) => setSport(e.target.value as SportType)}
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
                <option value="MEN_DOUBLES">Ganda Putra (Men Doubles)</option>
                <option value="WOMEN_DOUBLES">Ganda Putri (Women Doubles)</option>
                <option value="MIXED_DOUBLES">Ganda Campuran (Mixed Doubles)</option>
                <option value="OPEN_DOUBLES">Ganda Open (Padel/Badminton)</option>
                <option value="MEN_SINGLES">Tunggal Putra (Men Singles)</option>
                <option value="WOMEN_SINGLES">Tunggal Putri (Women Singles)</option>
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
                placeholder="Contoh: Court 1, Court 2, Court 3"
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Daftar Peserta & Seeding Bagan ({participants.length} Peserta)
                </h3>
                <p className="text-xs text-slate-400">
                  Untuk bagan sistem gugur ideal, disarankan 4, 8, atau 16 peserta.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddParticipant}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
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
                      placeholder="Seed (1-8, Opsional)"
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
              <span>Simpan & Generate Bagan Turnamen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
