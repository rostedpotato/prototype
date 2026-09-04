'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTournament } from '@/lib/tournamentStore';
import { getMatchSetsSummary, getActiveSets } from '@/lib/standingUtils';
import { Match } from '@/types/tournament';
import {
  Trophy,
  Clock,
  Maximize2,
  Minimize2,
  ArrowLeft,
  CircleDot,
  Radio,
  Flame,
  Calendar,
  Users,
} from 'lucide-react';

export default function TournamentTVDisplayPage() {
  const params = useParams();
  const id = params.id as string;
  const { tournament } = useTournament(id);

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Digital clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-400">Memuat Live Scoreboard TV...</p>
        </div>
      </div>
    );
  }

  const courts = tournament.courts && tournament.courts.length > 0
    ? tournament.courts
    : ['Court 1', 'Court 2', 'Court 3'];

  // Determine Current Active Match & Next On-Deck Match for each court
  const courtData = courts.map((courtName) => {
    const courtMatches = tournament.matches
      .filter((m) => m.court === courtName)
      .sort((a, b) => (a.matchOrder || 0) - (b.matchOrder || 0));

    // Priority 1: LIVE match on this court
    let activeMatch = courtMatches.find((m) => m.status === 'LIVE');

    // Priority 2: Next UPCOMING match on this court
    if (!activeMatch) {
      activeMatch = courtMatches.find((m) => m.status === 'UPCOMING');
    }

    // Priority 3: If all finished or none upcoming, show the latest finished match
    if (!activeMatch) {
      activeMatch = courtMatches[courtMatches.length - 1];
    }

    // Find the NEXT match on this court (after activeMatch)
    let nextMatch: Match | undefined = undefined;
    if (activeMatch) {
      const activeIdx = courtMatches.findIndex((m) => m.id === activeMatch?.id);
      nextMatch = courtMatches.slice(activeIdx + 1).find((m) => m.status === 'UPCOMING');
    }

    return {
      courtName,
      activeMatch,
      nextMatch,
    };
  });

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between select-none font-sans overflow-x-hidden">
      {/* Top TV Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/90">
        <div className="flex items-center gap-4">
          <Link
            href={`/tournament/${tournament.id}`}
            className="w-10 h-10 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Kembali ke Tampilan Web"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-400 text-xs font-black tracking-wide animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                LIVE VENUE SCOREBOARD
              </span>
              <span className="text-xs font-bold text-slate-400">
                {tournament.venue || 'GOR Utama'} • {tournament.city || 'Jakarta'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 flex-shrink-0" />
              <span>{tournament.name}</span>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                {tournament.categoryLabel || 'Padel'}
              </span>
            </h1>
          </div>
        </div>

        {/* Digital Clock & Fullscreen button */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-wider text-lime-400">
              {currentTime}
            </div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {currentDate}
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="w-11 h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-lg"
            title="Toggle Fullscreen (Layar Penuh TV)"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main 3-Courts Arena Display */}
      <main className="my-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 xl:gap-6 h-full">
          {courtData.map(({ courtName, activeMatch, nextMatch }) => {
            const isLive = activeMatch?.status === 'LIVE';
            const isFinished = activeMatch?.status === 'FINISHED';
            const isWalkover = activeMatch?.status === 'WALKOVER';
            const { setsWon1, setsWon2 } = getMatchSetsSummary(activeMatch?.scores);
            const activeSets = getActiveSets(activeMatch?.scores);

            return (
              <div
                key={courtName}
                className={`relative rounded-3xl border flex flex-col justify-between overflow-hidden shadow-2xl transition-all ${
                  isLive
                    ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-[#0c1626] border-lime-500/60 ring-2 ring-lime-500/20 shadow-lime-500/10'
                    : isWalkover
                    ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-[#220c11] border-rose-600/50'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                {/* Court Card Header */}
                <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-400" />
                      {courtName}
                    </span>
                    {activeMatch?.referee && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-bold border border-slate-700">
                        🧑‍⚖️ {activeMatch.referee}
                      </span>
                    )}
                  </div>

                  <div>
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500 text-slate-950 text-xs font-black shadow-lg shadow-lime-500/30 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                        LIVE MATCH
                      </span>
                    ) : isWalkover ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-black">
                        WALKOVER
                      </span>
                    ) : isFinished ? (
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                        SELESAI
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold">
                        🕒 {activeMatch?.scheduledTime || 'JADWAL'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Information & Teams */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-6">
                  {/* Round & Match Order subtitle */}
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-slate-800/60 pb-2">
                    <span>{activeMatch?.roundName || 'Fase Pertandingan'}</span>
                    <span>Match #{activeMatch?.matchOrder || '-'}</span>
                  </div>

                  {/* Team 1 vs Team 2 Big Score Board */}
                  <div className="space-y-4 my-auto">
                    {/* Team 1 Row */}
                    <div
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        activeMatch?.winnerId === activeMatch?.participant1?.id
                          ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {activeMatch?.servingSide === 1 && isLive && (
                          <span className="text-base animate-bounce" title="Sedang Servis">
                            🎾
                          </span>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg lg:text-xl font-black text-white truncate">
                            {activeMatch?.participant1?.name || 'Menunggu Lawan'}
                          </h3>
                          <p className="text-xs text-slate-400 font-semibold truncate">
                            {activeMatch?.participant1?.player1 || ''}
                            {activeMatch?.participant1?.player2 ? ` / ${activeMatch.participant1.player2}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Sets & Set Points */}
                      <div className="flex items-center gap-2">
                        {/* Per-set breakdown boxes */}
                        <div className="flex items-center gap-1.5">
                          {activeMatch?.scores.map((s) => (
                            <div
                              key={s.setNumber}
                              className={`w-7 h-9 rounded-lg flex items-center justify-center font-mono text-sm font-bold border ${
                                activeMatch.currentSet === s.setNumber && isLive
                                  ? 'bg-lime-500/20 border-lime-500/50 text-lime-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-300'
                              }`}
                            >
                              {s.score1}
                            </div>
                          ))}
                        </div>

                        {/* Large Sets Won Indicator */}
                        <div className="w-11 h-12 rounded-xl bg-lime-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-lime-500/20 ml-2">
                          {setsWon1}
                        </div>
                      </div>
                    </div>

                    {/* Team 2 Row */}
                    <div
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        activeMatch?.winnerId === activeMatch?.participant2?.id
                          ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {activeMatch?.servingSide === 2 && isLive && (
                          <span className="text-base animate-bounce" title="Sedang Servis">
                            🎾
                          </span>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg lg:text-xl font-black text-white truncate">
                            {activeMatch?.participant2?.name || 'Menunggu Lawan'}
                          </h3>
                          <p className="text-xs text-slate-400 font-semibold truncate">
                            {activeMatch?.participant2?.player1 || ''}
                            {activeMatch?.participant2?.player2 ? ` / ${activeMatch.participant2.player2}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Sets & Set Points */}
                      <div className="flex items-center gap-2">
                        {/* Per-set breakdown boxes */}
                        <div className="flex items-center gap-1.5">
                          {activeMatch?.scores.map((s) => (
                            <div
                              key={s.setNumber}
                              className={`w-7 h-9 rounded-lg flex items-center justify-center font-mono text-sm font-bold border ${
                                activeMatch.currentSet === s.setNumber && isLive
                                  ? 'bg-lime-500/20 border-lime-500/50 text-lime-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-300'
                              }`}
                            >
                              {s.score2}
                            </div>
                          ))}
                        </div>

                        {/* Large Sets Won Indicator */}
                        <div className="w-11 h-12 rounded-xl bg-lime-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-lime-500/20 ml-2">
                          {setsWon2}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* On-Deck / Up Next Bar (Pertandingan Selanjutnya di Lapangan Ini) */}
                <div className="px-5 py-3 bg-slate-950/95 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-extrabold text-[10px] tracking-wide uppercase">
                      Berikutnya (On-Deck)
                    </span>
                    {nextMatch ? (
                      <span className="text-slate-300 font-bold truncate">
                        {nextMatch.participant1?.name || 'TBD'} vs {nextMatch.participant2?.name || 'TBD'}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Tidak ada jadwal berikutnya</span>
                    )}
                  </div>
                  {nextMatch?.scheduledTime && (
                    <span className="text-slate-400 font-mono font-bold whitespace-nowrap ml-2">
                      🕒 {nextMatch.scheduledTime}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom Live Venue Announcements Ticker */}
      <footer className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-ping" />
          <span className="font-bold text-slate-300">Pemberitahuan Peserta:</span>
          <span>
            Pasangan pada jadwal <strong>Berikutnya (On-Deck)</strong> diharapkan segera melakukan pemanasan di area pemanggilan atlet.
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 font-semibold self-end sm:self-auto">
          <span>Format: Best of 5 Sets</span>
          <span>•</span>
          <span>Sistem Turnamen Dua Tahap</span>
        </div>
      </footer>
    </div>
  );
}
