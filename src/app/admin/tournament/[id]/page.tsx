'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTournament } from '@/lib/tournamentStore';
import { useAdminAuth } from '@/lib/authStore';
import BracketViewer from '@/components/BracketViewer';
import AdminScoringModal from '@/components/AdminScoringModal';
import { Match, MatchStatus } from '@/types/tournament';
import {
  ArrowLeft,
  Shield,
  Trophy,
  ExternalLink,
  SlidersHorizontal,
  Layers,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function AdminTournamentManagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { tournament, service } = useTournament(id);
  const { isAdmin, isReady } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<'BRACKET' | 'MATCHES' | 'SETTINGS'>('BRACKET');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (isReady && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, isReady, router]);

  if (!isReady || !isAdmin) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Lock className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
          <p className="text-xs text-slate-400 font-bold">Memeriksa hak akses admin...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-20 space-y-4">
        <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Turnamen Tidak Ditemukan</h2>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard Admin
        </Link>
      </div>
    );
  }

  const handleTournamentStatusChange = (newStatus: 'UPCOMING' | 'LIVE' | 'COMPLETED') => {
    service.update(tournament.id, { status: newStatus });
  };

  const handleQuickMatchUpdate = (matchId: string, court: string, scheduledTime: string) => {
    service.updateMatch(tournament.id, matchId, { court, scheduledTime });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard Admin
        </Link>

        <Link
          href={`/tournament/${tournament.id}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Lihat Tampilan Publik</span>
        </Link>
      </div>

      {/* Admin Tournament Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
                ADMIN CONSOLE
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  tournament.sport === 'BADMINTON'
                    ? 'bg-lime-500/20 text-lime-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}
              >
                {tournament.sport === 'BADMINTON' ? '🏸 Badminton' : '🎾 Padel'}
              </span>
              <span className="text-xs text-slate-400">{tournament.categoryLabel}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">{tournament.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {tournament.venue}, {tournament.city} • {tournament.startDate}
            </p>
          </div>

          {/* Tournament Overall Status Changer */}
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400">
              Status Keseluruhan Turnamen:
            </label>
            <div className="flex items-center gap-1.5">
              {(['UPCOMING', 'LIVE', 'COMPLETED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => handleTournamentStatusChange(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                    tournament.status === st
                      ? st === 'LIVE'
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                        : 'bg-lime-500 text-slate-950 shadow-md shadow-lime-500/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'UPCOMING' ? 'Akan Datang' : st === 'LIVE' ? '🔴 LIVE' : 'Selesai'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('BRACKET')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'BRACKET'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Bagan & Live Scoring Wasit
        </button>

        <button
          onClick={() => setActiveTab('MATCHES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'MATCHES'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Atur Jadwal & Lapangan ({tournament.matches.length})
        </button>
      </div>

      {/* TAB 1: BRACKET WITH CLICK-TO-SCORE */}
      {activeTab === 'BRACKET' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <SlidersHorizontal className="w-4 h-4" />
              <span>
                Klik tombol <strong>&quot;Update Skor&quot;</strong> pada kotak pertandingan mana pun untuk
                membuka kontrol wasit live & memajukan pemenang ke babak berikutnya!
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-3xl">
            <BracketViewer
              tournament={tournament}
              onOpenScoreControl={(m) => setSelectedMatch(m)}
            />
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE COURTS & TIMES */}
      {activeTab === 'MATCHES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Daftar Jadwal & Penugasan Lapangan</h3>
            <span className="text-xs text-slate-400">Total {tournament.matches.length} Match</span>
          </div>

          <div className="divide-y divide-slate-800">
            {tournament.matches.map((m) => (
              <div
                key={m.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {m.roundName}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        m.status === 'LIVE'
                          ? 'bg-red-500/20 text-red-400'
                          : m.status === 'FINISHED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {m.participant1?.name || 'TBD'} vs {m.participant2?.name || 'TBD'}
                  </p>
                </div>

                {/* Court & Time inputs */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    defaultValue={m.court || 'Court 1'}
                    onBlur={(e) =>
                      handleQuickMatchUpdate(m.id, e.target.value, m.scheduledTime || '14:00 WIB')
                    }
                    placeholder="Lapangan"
                    className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    defaultValue={m.scheduledTime || '14:00 WIB'}
                    onBlur={(e) =>
                      handleQuickMatchUpdate(m.id, m.court || 'Court 1', e.target.value)
                    }
                    placeholder="Waktu"
                    className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <button
                    onClick={() => setSelectedMatch(m)}
                    className="px-3.5 py-1.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-extrabold transition-colors flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Skor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Scoring Modal */}
      {selectedMatch && (
        <AdminScoringModal
          tournamentId={tournament.id}
          match={selectedMatch}
          sport={tournament.sport}
          pointsPerSet={tournament.rules.pointsPerSet}
          isOpen={true}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
