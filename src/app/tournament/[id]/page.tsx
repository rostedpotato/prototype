'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTournament } from '@/lib/tournamentStore';
import { useAdminAuth } from '@/lib/authStore';
import BracketViewer from '@/components/BracketViewer';
import MatchList from '@/components/MatchList';
import AdminScoringModal from '@/components/AdminScoringModal';
import GroupStageViewer from '@/components/GroupStageViewer';
import { Match } from '@/types/tournament';
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Shield,
  Layers,
  ListOrdered,
  Medal,
  Tv,
} from 'lucide-react';

export default function TournamentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { tournament } = useTournament(id);
  const { isAdmin } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<'GROUP' | 'BRACKET' | 'MATCHES' | 'PARTICIPANTS'>('BRACKET');
  const [scoringModalMatch, setScoringModalMatch] = useState<Match | null>(null);

  // Auto set to GROUP tab if TWO_STAGE and not yet group stage completed
  useEffect(() => {
    if (tournament?.format?.startsWith('TWO_STAGE') && !tournament.groupStageCompleted) {
      setActiveTab('GROUP');
    }
  }, [tournament?.format, tournament?.groupStageCompleted]);

  if (!tournament) {
    return (
      <div className="text-center py-20 space-y-4">
        <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Turnamen Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400">Turnamen ini mungkin telah dihapus atau URL tidak valid.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Home
        </Link>
      </div>
    );
  }

  const liveMatches = tournament.matches.filter((m) => m.status === 'LIVE');

  return (
    <div className="space-y-8 pb-20">
      {/* Top Back Nav & Admin Switch */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Match Center
        </Link>

        {isAdmin && (
          <Link
            href={`/admin/tournament/${tournament.id}`}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-colors flex items-center gap-1.5"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            Mode Admin Turnamen
          </Link>
        )}
      </div>

      {/* Tournament Header Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`font-extrabold px-3 py-1 rounded-lg text-xs uppercase tracking-wider ${
                tournament.sport === 'BADMINTON'
                  ? 'bg-lime-500/15 text-lime-400 border border-lime-500/30'
                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {tournament.sport === 'BADMINTON' ? '🏸 Badminton' : '🎾 Padel'} • {tournament.categoryLabel}
            </span>

            {liveMatches.length > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-extrabold text-xs">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-live-dot" />
                {liveMatches.length} Match LIVE
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {tournament.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-3xl leading-relaxed">
            {tournament.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <MapPin className="w-4 h-4 text-lime-400 flex-shrink-0" />
              <span className="truncate">
                {tournament.venue}, {tournament.city}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                {tournament.startDate} s/d {tournament.endDate}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <Users className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                {tournament.participants.length} Peserta • {tournament.courts.length} Lapangan
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between gap-3 flex-wrap">
            <Link
              href={`/tournament/${tournament.id}/tv`}
              target="_blank"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-lime-400 hover:text-lime-300 border border-lime-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Tv className="w-4 h-4" />
              <span>📺 Layar TV / Big Screen Venue</span>
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20"
            >
              Daftar Turnamen
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {tournament.format?.startsWith('TWO_STAGE') && (
          <button
            onClick={() => setActiveTab('GROUP')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              activeTab === 'GROUP'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-blue-400" />
            Fase Grup & Klasemen
          </button>
        )}

        <button
          onClick={() => setActiveTab('BRACKET')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
            activeTab === 'BRACKET'
              ? 'bg-lime-500 text-slate-950 shadow-md shadow-lime-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          {tournament.format?.startsWith('TWO_STAGE') ? 'Bagan Knockout (Upper & Beginner)' : 'Bagan Sistem Gugur'}
        </button>

        <button
          onClick={() => setActiveTab('MATCHES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
            activeTab === 'MATCHES'
              ? 'bg-lime-500 text-slate-950 shadow-md shadow-lime-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          Jadwal & Hasil ({tournament.matches.length})
        </button>

        <button
          onClick={() => setActiveTab('PARTICIPANTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
            activeTab === 'PARTICIPANTS'
              ? 'bg-lime-500 text-slate-950 shadow-md shadow-lime-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Peserta ({tournament.participants.length})
        </button>
      </div>

      {/* Tab 0: Group Stage Viewer (For TWO_STAGE tournaments) */}
      {activeTab === 'GROUP' && tournament.format?.startsWith('TWO_STAGE') && (
        <GroupStageViewer
          tournament={tournament}
          onOpenScoreControl={(m) => setScoringModalMatch(m)}
        />
      )}

      {/* Tab 1: Bracket Viewer */}
      {activeTab === 'BRACKET' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                {tournament.format?.startsWith('TWO_STAGE')
                  ? 'Bagan Babak Gugur (Bagan Atas & Bagan Bawah)'
                  : 'Bagan Babak Utama (Single Elimination Tree)'}
              </h3>
              <span className="text-[11px] text-slate-400">
                Geser ke samping pada layar HP untuk melihat babak selanjutnya
              </span>
            </div>
            <BracketViewer
              tournament={tournament}
              onOpenScoreControl={(m) => setScoringModalMatch(m)}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Match List & Schedule */}
      {activeTab === 'MATCHES' && (
        <MatchList
          tournament={tournament}
          onOpenScoreControl={(m) => setScoringModalMatch(m)}
        />
      )}

      {/* Tab 3: Participants List */}
      {activeTab === 'PARTICIPANTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Daftar Pemain & Pasangan Terdaftar</h3>
            <span className="text-xs text-slate-400">
              Total {tournament.participants.length} Peserta
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {tournament.participants.map((p, idx) => (
              <div
                key={p.id}
                className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{p.name}</span>
                      {p.seed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Medal className="w-3 h-3" />
                          Seed #{p.seed}
                        </span>
                      )}
                    </div>
                    {p.club && <p className="text-xs text-slate-400">{p.club}</p>}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <span>Terdaftar</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Scoring Modal */}
      {scoringModalMatch && (
        <AdminScoringModal
          tournamentId={tournament.id}
          match={scoringModalMatch}
          sport={tournament.sport}
          isOpen={true}
          onClose={() => setScoringModalMatch(null)}
        />
      )}
    </div>
  );
}
