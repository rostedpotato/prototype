'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTournaments } from '@/lib/tournamentStore';
import { SportType, Match } from '@/types/tournament';
import LiveScoreCard from '@/components/LiveScoreCard';
import AdminScoringModal from '@/components/AdminScoringModal';
import {
  Trophy,
  Activity,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  Radio,
  Shield,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAdminAuth } from '@/lib/authStore';
import { useDebounce } from '@/lib/useDebounce';

export default function HomePage() {
  const { tournaments } = useTournaments();
  const { isAdmin } = useAdminAuth();
  const [sportFilter, setSportFilter] = useState<'ALL' | SportType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 350);

  // Referee / Score Control Modal State
  const [scoringModalMatch, setScoringModalMatch] = useState<{
    tournamentId: string;
    sport: SportType;
    pointsPerSet: number;
    match: Match;
  } | null>(null);

  // Extract all currently live matches across tournaments
  const liveMatchesList: {
    tournamentId: string;
    sport: SportType;
    match: Match;
    tournamentName: string;
  }[] = [];

  tournaments.forEach((t) => {
    t.matches
      .filter((m) => m.status === 'LIVE')
      .forEach((m) => {
        liveMatchesList.push({
          tournamentId: t.id,
          sport: t.sport,
          match: m,
          tournamentName: t.name,
        });
      });
  });

  // Tournaments marked as LIVE
  const liveTournaments = tournaments.filter((t) => t.status === 'LIVE');

  const filteredTournaments = tournaments.filter((t) => {
    if (sportFilter !== 'ALL' && t.sport !== sportFilter) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchVenue = t.venue.toLowerCase().includes(q);
      const matchCity = t.city.toLowerCase().includes(q);
      if (!matchName && !matchVenue && !matchCity) return false;
    }
    return true;
  });

  return (
    <div className="space-y-10 pb-16">
      {/* Minimal Clean Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            Live Score & Turnamen Hub
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Turnamen <span className="text-lime-400">Badminton</span> &{' '}
            <span className="text-cyan-400">Padel</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-2xl leading-relaxed">
            Pantau bagan sistem gugur (*knockout*), jadwal pertandingan per lapangan, dan skor langsung (*live score*) secara real-time.
          </p>
        </div>
      </section>

      {/* 🔴 LIVE MATCH CENTER SECTION */}
      {liveMatchesList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-live-dot" />
              <h2 className="text-xl font-black text-white tracking-tight">
                Live Match Center
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                {liveMatchesList.length} Pertandingan Berlangsung
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatchesList.map((item) => (
              <LiveScoreCard
                key={item.match.id}
                match={item.match}
                sport={item.sport}
                tournamentName={item.tournamentName}
                tournamentId={item.tournamentId}
                onOpenScoreControl={(m) =>
                  setScoringModalMatch({
                    tournamentId: item.tournamentId,
                    sport: item.sport,
                    pointsPerSet: item.sport === 'BADMINTON' ? 21 : 6,
                    match: m,
                  })
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* TOURNAMENTS LIST SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Semua Turnamen ({filteredTournaments.length})
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Pilih turnamen untuk melihat bagan lengkap, peserta, dan jadwal pertandingan.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari turnamen / kota..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
            />
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          {/* Sport Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setSportFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                sportFilter === 'ALL'
                  ? 'bg-lime-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua Cabor
            </button>
            <button
              onClick={() => setSportFilter('BADMINTON')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                sportFilter === 'BADMINTON'
                  ? 'bg-lime-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🏸 Badminton
            </button>
            <button
              onClick={() => setSportFilter('PADEL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                sportFilter === 'PADEL'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎾 Padel
            </button>
          </div>

          {/* Status Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => setStatusFilter('LIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                statusFilter === 'LIVE'
                  ? 'bg-red-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-live-dot" />
              🔴 LIVE
            </button>
            <button
              onClick={() => setStatusFilter('UPCOMING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === 'UPCOMING'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🕒 Akan Datang
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✅ Selesai
            </button>
          </div>
        </div>

        {/* Tournaments Grid */}
        {filteredTournaments.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-3">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-bold text-sm">Tidak ada turnamen yang sesuai filter.</p>
            <button
              onClick={() => {
                setSportFilter('ALL');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-lime-400 hover:underline font-semibold"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTournaments.map((t) => {
              const liveCount = t.matches.filter((m) => m.status === 'LIVE').length;
              const completedCount = t.matches.filter((m) => m.status === 'FINISHED').length;

              return (
                <div
                  key={t.id}
                  className={`bg-slate-900/90 border rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between group ${
                    t.status === 'LIVE'
                      ? 'border-lime-500/40 shadow-lg shadow-lime-500/5'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-black px-2.5 py-1 rounded-lg text-xs uppercase tracking-wider ${
                          t.sport === 'BADMINTON'
                            ? 'bg-lime-500/15 text-lime-400 border border-lime-500/30'
                            : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {t.sport === 'BADMINTON' ? '🏸 Badminton' : '🎾 Padel'} • {t.categoryLabel}
                      </span>

                      {t.status === 'LIVE' ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-extrabold">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-live-dot" />
                          {liveCount > 0 ? `${liveCount} Match LIVE` : 'TURNAMEN LIVE'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">
                          {t.status === 'UPCOMING' ? '🕒 Akan Datang' : '✅ Selesai'}
                        </span>
                      )}
                    </div>

                    {/* Tournament Title & Description */}
                    <div>
                      <h3 className="text-xl font-black text-white group-hover:text-lime-300 transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    </div>

                    {/* Location & Meta */}
                    <div className="space-y-1.5 text-xs text-slate-300 font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-lime-400 flex-shrink-0" />
                        <span>
                          {t.venue}, {t.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>
                          {t.startDate} s/d {t.endDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>
                          {t.participants.length} Peserta • {t.matches.length} Pertandingan ({completedCount} Selesai)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <Link
                          href={`/admin/tournament/${t.id}`}
                          className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Kelola
                        </Link>
                      )}
                    </div>

                    <Link
                      href={`/tournament/${t.id}`}
                      className="px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-lime-500/20 transition-all flex items-center gap-1.5 group-hover:gap-2"
                    >
                      <span>Buka Bagan & Jadwal</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Admin Quick Scoring Modal */}
      {scoringModalMatch && (
        <AdminScoringModal
          tournamentId={scoringModalMatch.tournamentId}
          match={scoringModalMatch.match}
          sport={scoringModalMatch.sport}
          pointsPerSet={scoringModalMatch.pointsPerSet}
          isOpen={true}
          onClose={() => setScoringModalMatch(null)}
        />
      )}
    </div>
  );
}
