'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTournament } from '@/lib/tournamentStore';
import { useAdminAuth } from '@/lib/authStore';
import BracketViewer from '@/components/BracketViewer';
import AdminScoringModal from '@/components/AdminScoringModal';
import GroupStageViewer from '@/components/GroupStageViewer';
import ScheduleConfigModal from '@/components/ScheduleConfigModal';
import { generateGroupStageMatches, applyGroupStageSchedule } from '@/lib/bracketGenerator';
import { Match, GroupScheduleScheme } from '@/types/tournament';
import {
  ArrowLeft,
  Trophy,
  ExternalLink,
  SlidersHorizontal,
  Layers,
  Calendar,
  MapPin,
  Lock,
  Shield,
  Sparkles,
  RotateCcw,
  Tv,
} from 'lucide-react';

export default function AdminTournamentManagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { tournament, service } = useTournament(id);
  const { isAdmin, isReady } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<'GROUP' | 'BRACKET' | 'MATCHES' | 'VERIFICATION'>('BRACKET');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isScheduleConfigOpen, setIsScheduleConfigOpen] = useState(false);
  const [scheduleConfigMode, setScheduleConfigMode] = useState<'GENERATE' | 'RESCHEDULE'>('GENERATE');

  // Auto set to GROUP tab if TWO_STAGE and not yet group stage completed
  useEffect(() => {
    if (tournament?.format?.startsWith('TWO_STAGE') && !tournament.groupStageCompleted) {
      setActiveTab('GROUP');
    }
  }, [tournament?.format, tournament?.groupStageCompleted]);

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

  const handleQuickMatchUpdate = (
    matchId: string,
    updates: { court?: string; scheduledTime?: string; referee?: string }
  ) => {
    service.updateMatch(tournament.id, matchId, updates);
  };

  const handleScheduleConfigConfirm = (config: {
    scheme: GroupScheduleScheme;
    startTime: string;
    slotDurationMinutes: number;
  }) => {
    if (!tournament) return;
    const courts =
      tournament.courts && tournament.courts.length > 0
        ? tournament.courts
        : ['Court 1', 'Court 2', 'Court 3'];

    if (scheduleConfigMode === 'GENERATE') {
      const approvedRegs = (tournament.registrations || []).filter(
        (r) => r.status === 'APPROVED'
      );
      const freshParticipants = approvedRegs.map((reg) => ({
        id: crypto.randomUUID(),
        name: reg.teamName,
        player1: reg.player1Name,
        player2: reg.player2Name,
        reclubId1: reg.reclubId1,
        reclubId2: reg.reclubId2,
        whatsapp: reg.whatsapp,
        club: reg.sector,
        registrationId: reg.id,
      }));

      const result = generateGroupStageMatches(
        tournament.id,
        freshParticipants,
        courts,
        config.scheme,
        config.startTime,
        config.slotDurationMinutes
      );

      service.update(tournament.id, {
        participants: result.groupedParticipants,
        matches: result.matches,
        groupScheduleScheme: config.scheme,
      });
    } else {
      // Mode RESCHEDULE: re-apply court, time, referee, matchOrder
      const updatedMatches = applyGroupStageSchedule(
        tournament.matches,
        courts,
        config.scheme,
        config.startTime,
        config.slotDurationMinutes
      );

      service.update(tournament.id, {
        matches: updatedMatches,
        groupScheduleScheme: config.scheme,
      });
    }
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

        <div className="flex items-center gap-2">
          <Link
            href={`/tournament/${tournament.id}/tv`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 hover:text-lime-300 border border-lime-500/30 text-xs font-bold transition-all shadow-sm"
          >
            <Tv className="w-4 h-4" />
            <span>📺 Layar TV Venue</span>
          </Link>

          <Link
            href={`/tournament/${tournament.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Lihat Tampilan Publik</span>
          </Link>
        </div>
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

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {tournament.format?.startsWith('TWO_STAGE') && (
          <button
            onClick={() => setActiveTab('GROUP')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
            activeTab === 'BRACKET'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          {tournament.format?.startsWith('TWO_STAGE') ? 'Bagan Knockout & Wasit' : 'Bagan & Live Scoring Wasit'}
        </button>

        <button
          onClick={() => setActiveTab('MATCHES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
            activeTab === 'MATCHES'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Atur Jadwal & Lapangan ({tournament.matches.length})
        </button>
        <button
          onClick={() => setActiveTab('VERIFICATION')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
            activeTab === 'VERIFICATION'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          Verifikasi Pendaftaran ({(tournament.registrations || []).filter(r => r.status === 'PENDING').length})
        </button>
      </div>

      {/* TAB 0: GROUP STAGE VIEWER (For TWO_STAGE tournaments) */}
      {activeTab === 'GROUP' && tournament.format?.startsWith('TWO_STAGE') && (
        <div className="space-y-4">
          {(() => {
            const approvedCount = (tournament.registrations || []).filter(r => r.status === 'APPROVED').length;
            
            if (tournament.matches.length === 0 && approvedCount === 16) {
              return (
                <div className="p-5 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span>16 Pasang Peserta Siap Diundi ke 4 Grup</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Pilih skema penjadwalan (Opsi 1: 2 Gelombang atau Opsi 2: Putaran Bergulir) sebelum jadwal dibuat.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setScheduleConfigMode('GENERATE');
                      setIsScheduleConfigOpen(true);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-xs font-black rounded-xl whitespace-nowrap shadow-lg shadow-blue-500/20 flex items-center gap-2"
                  >
                    <span>🎲 Acak & Pilih Skema Jadwal</span>
                  </button>
                </div>
              );
            }
            
            if (tournament.matches.length === 0 && approvedCount !== 16) {
              return (
                <div className="p-4 bg-slate-800 text-center text-slate-400 rounded-2xl text-sm">
                  Menunggu pendaftaran. Turnamen ini membutuhkan tepat 16 peserta yang disetujui untuk memulai Fase Grup. (Saat ini: {approvedCount}/16)
                </div>
              );
            }
            
            return null;
          })()}
          
          {tournament.matches.length > 0 && (
            <>
              {/* Quick Re-schedule Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-lime-500/10 text-lime-300 font-bold border border-lime-500/30 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Skema: {tournament.groupScheduleScheme === 'ROLLING_ROUND' ? 'Opsi 2 (Putaran Bergulir)' : 'Opsi 1 (2 Gelombang / Split Wave)'}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Jika ada kendala/perubahan mendadak di lapangan, jadwal dapat ditata ulang otomatis kapan saja.
                  </span>
                </div>

                <button
                  onClick={() => {
                    setScheduleConfigMode('RESCHEDULE');
                    setIsScheduleConfigOpen(true);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md whitespace-nowrap"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚙️ Sesuaikan Jadwal (Opsi 1 / Opsi 2)</span>
                </button>
              </div>

              <GroupStageViewer
                tournament={tournament}
                onOpenScoreControl={(m) => setSelectedMatch(m)}
              />
            </>
          )}
        </div>
      )}

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

      {/* TAB 2: MANAGE COURTS, TIMES & REFEREES */}
      {activeTab === 'MATCHES' && (() => {
        const courtOptions = tournament.courts && tournament.courts.length > 0 ? tournament.courts : ['Court 1', 'Court 2', 'Court 3', 'Court 4'];
        const refereeOptions = courtOptions.map((_, idx) => `Wasit ${idx + 1}`);
        const timeOptions = [
          '07:00 WIB', '07:30 WIB', '08:00 WIB', '08:30 WIB',
          '09:00 WIB', '09:30 WIB', '10:00 WIB', '10:30 WIB',
          '11:00 WIB', '11:30 WIB', '12:00 WIB', '12:30 WIB',
          '13:00 WIB', '13:30 WIB', '14:00 WIB', '14:30 WIB',
          '15:00 WIB', '15:30 WIB', '16:00 WIB', '16:30 WIB',
          '17:00 WIB', '17:30 WIB', '18:00 WIB', '18:30 WIB',
          '19:00 WIB', '19:30 WIB', '20:00 WIB', '20:30 WIB',
          '21:00 WIB', '21:30 WIB', '22:00 WIB'
        ];

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Daftar Jadwal, Lapangan & Penugasan Wasit
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Atur lapangan, jam main, dan wasit ({refereeOptions.length} wasit tersedia sesuai {courtOptions.length} lapangan) via dropdown.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {tournament.format?.startsWith('TWO_STAGE') && tournament.matches.length > 0 && (
                  <button
                    onClick={() => {
                      setScheduleConfigMode('RESCHEDULE');
                      setIsScheduleConfigOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚙️ Sesuaikan Jadwal Otomatis</span>
                  </button>
                )}
                <span className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 w-fit">
                  Total {tournament.matches.length} Match
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-800/80">
              {tournament.matches.map((m) => {
                const currentCourt = m.court || courtOptions[0] || 'Court 1';
                const currentTime = m.scheduledTime || '09:00 WIB';
                const currentReferee = m.referee || '';

                return (
                  <div
                    key={m.id}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {m.groupName ? `${m.groupName} • ` : ''}{m.roundName}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Match #{m.matchOrder}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            m.status === 'LIVE'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : m.status === 'FINISHED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {m.status === 'LIVE' ? '🔴 LIVE' : m.status === 'FINISHED' ? '✅ Selesai' : '🕒 Upcoming'}
                        </span>
                      </div>
                      <p className="text-sm font-black text-white">
                        {m.participant1?.name || 'TBD (Menunggu)'} <span className="text-slate-500 font-normal">vs</span> {m.participant2?.name || 'TBD (Menunggu)'}
                      </p>
                    </div>

                    {/* Dropdown inputs for Court, Time, and Referee */}
                    <div className="flex flex-wrap items-end gap-3">
                      {/* Lapangan Dropdown */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Lapangan
                        </label>
                        <select
                          value={currentCourt}
                          onChange={(e) => handleQuickMatchUpdate(m.id, { court: e.target.value })}
                          className="bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none transition-colors"
                        >
                          {courtOptions.map((c) => (
                            <option key={c} value={c}>
                              🏟️ {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Jam Main Dropdown */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Jam Main
                        </label>
                        <select
                          value={currentTime}
                          onChange={(e) => handleQuickMatchUpdate(m.id, { scheduledTime: e.target.value })}
                          className="bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none transition-colors"
                        >
                          {!timeOptions.includes(currentTime) && (
                            <option value={currentTime}>{currentTime}</option>
                          )}
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              🕒 {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Wasit Dropdown */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Wasit
                        </label>
                        <select
                          value={currentReferee}
                          onChange={(e) => handleQuickMatchUpdate(m.id, { referee: e.target.value })}
                          className="bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-amber-300 focus:outline-none transition-colors"
                        >
                          <option value="">- Tanpa Wasit -</option>
                          {refereeOptions.map((ref) => (
                            <option key={ref} value={ref}>
                              🧑‍⚖️ {ref}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Score Button */}
                      <div>
                        <button
                          onClick={() => setSelectedMatch(m)}
                          className="px-3.5 py-1.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-extrabold transition-colors flex items-center gap-1.5 shadow-md shadow-lime-500/20 h-[34px]"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Skor
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* TAB 3: VERIFICATION */}
      {activeTab === 'VERIFICATION' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Verifikasi Pendaftaran</h3>
            <span className="text-xs text-slate-400">Total {tournament.registrations?.length || 0} Pendaftar</span>
          </div>

          <div className="divide-y divide-slate-800">
            {(!tournament.registrations || tournament.registrations.length === 0) ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Belum ada data pendaftaran masuk.
              </div>
            ) : (
              [...tournament.registrations]
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((reg, idx) => (
                <div key={reg.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                      <span className="text-sm font-bold text-white">{reg.teamName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        reg.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                        reg.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {reg.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                      <div><span className="text-slate-500">Waktu:</span> {new Date(reg.createdAt).toLocaleString('id-ID')}</div>
                      <div><span className="text-slate-500">Sektor:</span> {reg.sector}</div>
                      <div><span className="text-slate-500">WA:</span> {reg.whatsapp}</div>
                      <div><span className="text-slate-500">P1:</span> {reg.player1Name} {reg.reclubId1 && `(${reg.reclubId1})`}</div>
                      <div><span className="text-slate-500">P2:</span> {reg.player2Name || '-'} {reg.reclubId2 && `(${reg.reclubId2})`}</div>
                    </div>
                  </div>
                  
                  {reg.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (confirm('Terima pendaftaran ini?')) {
                            service.processRegistration(tournament.id, reg.id, 'APPROVED');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                      >
                        Terima
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Tolak pendaftaran ini?')) {
                            service.processRegistration(tournament.id, reg.id, 'REJECTED');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs font-bold transition-colors"
                      >
                        Tolak
                      </button>
                    </div>
                  )}

                  {reg.status === 'APPROVED' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (confirm('Batal setujui pendaftaran ini? Data peserta akan ditarik kembali dari turnamen.')) {
                            service.processRegistration(tournament.id, reg.id, 'PENDING');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 text-xs font-bold transition-colors"
                      >
                        Batal (Kembalikan ke PENDING)
                      </button>
                    </div>
                  )}

                  {reg.status === 'REJECTED' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (confirm('Kembalikan pendaftaran ini ke antrean?')) {
                            service.processRegistration(tournament.id, reg.id, 'PENDING');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 text-xs font-bold transition-colors"
                      >
                        Kembalikan ke PENDING
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Admin Scoring Modal */}
      {selectedMatch && (
        <AdminScoringModal
          tournamentId={tournament.id}
          match={selectedMatch}
          sport={tournament.sport}
          isOpen={true}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* Schedule Config Modal (Opsi 1 / Opsi 2) */}
      {tournament && (
        <ScheduleConfigModal
          isOpen={isScheduleConfigOpen}
          onClose={() => setIsScheduleConfigOpen(false)}
          tournament={tournament}
          mode={scheduleConfigMode}
          onConfirm={handleScheduleConfigConfirm}
        />
      )}
    </div>
  );
}
