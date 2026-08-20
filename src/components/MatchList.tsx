'use client';

import { useState } from 'react';
import { Tournament, Match } from '@/types/tournament';
import LiveScoreCard from './LiveScoreCard';
import { Search } from 'lucide-react';
import { useDebounce } from '@/lib/useDebounce';

interface MatchListProps {
  tournament: Tournament;
  onOpenScoreControl?: (match: Match) => void;
}

export default function MatchList({ tournament, onOpenScoreControl }: MatchListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [courtFilter, setCourtFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 350);

  const filteredMatches = tournament.matches.filter((m) => {
    // Status filter
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;

    // Court filter
    if (courtFilter !== 'ALL' && m.court !== courtFilter) return false;

    // Search query
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      const p1Match = m.participant1?.name?.toLowerCase().includes(q);
      const p2Match = m.participant2?.name?.toLowerCase().includes(q);
      const roundMatch = m.roundName.toLowerCase().includes(q);
      if (!p1Match && !p2Match && !roundMatch) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pemain / pasangan..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
          />
        </div>

        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { label: 'Semua', value: 'ALL' },
            { label: '🔴 Live', value: 'LIVE' },
            { label: '🕒 Jadwal', value: 'UPCOMING' },
            { label: '✅ Hasil', value: 'FINISHED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? 'bg-lime-500 text-slate-950 shadow-md shadow-lime-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Court Dropdown */}
        <div className="w-full md:w-auto">
          <select
            value={courtFilter}
            onChange={(e) => setCourtFilter(e.target.value)}
            className="w-full md:w-44 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-lime-400"
          >
            <option value="ALL">Semua Lapangan</option>
            {tournament.courts.map((court) => (
              <option key={court} value={court}>
                {court}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm font-semibold">
            Tidak ada pertandingan yang sesuai dengan filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => (
            <LiveScoreCard
              key={match.id}
              match={match}
              sport={tournament.sport}
              tournamentName={tournament.name}
              tournamentId={tournament.id}
              onOpenScoreControl={onOpenScoreControl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
