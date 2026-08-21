'use client';

import { useState } from 'react';
import { Tournament, Match, Participant } from '@/types/tournament';
import { useAdminAuth } from '@/lib/authStore';
import { TournamentService } from '@/lib/tournamentStore';
import {
  Trophy,
  Shield,
  Medal,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
  Layers,
} from 'lucide-react';

interface GroupStageViewerProps {
  tournament: Tournament;
  onOpenScoreControl?: (match: Match) => void;
}

export default function GroupStageViewer({
  tournament,
  onOpenScoreControl,
}: GroupStageViewerProps) {
  const { isAdmin } = useAdminAuth();
  const [selectedGroupTab, setSelectedGroupTab] = useState<string>('ALL');
  const [isGenerating, setIsGenerating] = useState(false);

  const groups = ['Grup 1', 'Grup 2', 'Grup 3', 'Grup 4'];

  // Filter group matches
  const groupMatches = tournament.matches.filter((m) => m.phase === 'GROUP');

  const handleGenerateKnockout = () => {
    if (
      confirm(
        'Kunci klasemen grup sekarang dan buat 2 Bagan Knockout (Upper Bracket & Beginner Bracket)?'
      )
    ) {
      setIsGenerating(true);
      TournamentService.generateKnockoutForTwoStage(tournament.id);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Visual System Overview Banner (Matching the format specification) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-[#0c1626] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Turnamen Dua Tahap (Two-Stage Tournament)
            </div>
            <h3 className="text-xl font-black text-white">
              Fase 1: Round Robin (4 Grup) ➔ Fase 2: Double Knockout Brackets
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              16 Pasangan bertanding di 4 grup. 2 Peringkat teratas (Top 2) lolos ke{' '}
              <strong className="text-blue-400">Bagan Upper Beginner</strong>, dan 2 peringkat
              terbawah (Bottom 2) lolos ke{' '}
              <strong className="text-emerald-400">Bagan Beginner</strong>.
            </p>
          </div>

          {/* Admin Knockout Trigger */}
          {isAdmin && (
            <div className="flex-shrink-0">
              {tournament.groupStageCompleted ? (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>2 Bagan Knockout Sudah Aktif</span>
                </div>
              ) : (
                <button
                  onClick={handleGenerateKnockout}
                  disabled={isGenerating}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 animate-pulse hover:animate-none"
                >
                  <Layers className="w-4 h-4" />
                  <span>Kunci Klasemen & Buat 2 Bagan Knockout</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Visual Flow diagram summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
              <Users className="w-4 h-4 text-amber-400" />
              Fase 1: 4 Grup (@ 4 Pasangan)
            </div>
            <p className="text-sm font-black text-white">Round Robin Antar Tim</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Masing-masing tim bermain 3 kali untuk menentukan peringkat grup.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-1">
              <Trophy className="w-4 h-4 text-blue-400" />
              Lolos ke Bagan Upper (8 Tim)
            </div>
            <p className="text-sm font-black text-blue-200">Top 2 dari Setiap Grup</p>
            <p className="text-[11px] text-blue-300/70 mt-1">
              Peringkat 1 & 2 (1A, 2A, 1B, 2B, 1C, 2C, 1D, 2D) memperebutkan Juara Upper.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
              <Medal className="w-4 h-4 text-emerald-400" />
              Lolos ke Bagan Beginner (8 Tim)
            </div>
            <p className="text-sm font-black text-emerald-200">Bottom 2 dari Setiap Grup</p>
            <p className="text-[11px] text-emerald-300/70 mt-1">
              Peringkat 3 & 4 (3A, 4A, 3B, 4B, 3C, 4C, 3D, 4D) memperebutkan Juara Beginner.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Group Standings Tables */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          Klasemen Sementara Fase Grup
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.map((groupName, gIdx) => {
            const groupParticipants = tournament.participants.filter(
              (p) => p.group === groupName
            );

            // Group colors styling
            const colorThemes = [
              { header: 'from-blue-600/30 to-blue-900/20', border: 'border-blue-500/30', text: 'text-blue-400' },
              { header: 'from-emerald-600/30 to-emerald-900/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
              { header: 'from-amber-600/30 to-amber-900/20', border: 'border-amber-500/30', text: 'text-amber-400' },
              { header: 'from-rose-600/30 to-rose-900/20', border: 'border-rose-500/30', text: 'text-rose-400' },
            ];
            const theme = colorThemes[gIdx % colorThemes.length];

            return (
              <div
                key={groupName}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
              >
                {/* Group Header */}
                <div
                  className={`px-5 py-3.5 bg-gradient-to-r ${theme.header} border-b border-slate-800 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-950/80 border border-slate-700 flex items-center justify-center font-black text-xs text-white">
                      {gIdx + 1}
                    </span>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      {groupName}
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">4 Pasangan</span>
                </div>

                {/* Standings Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-black">
                        <th className="py-2.5 px-3 text-center w-10">POS</th>
                        <th className="py-2.5 px-3">PASANGAN / TIM</th>
                        <th className="py-2.5 px-2 text-center w-10">M</th>
                        <th className="py-2.5 px-2 text-center w-10">W</th>
                        <th className="py-2.5 px-2 text-center w-10">L</th>
                        <th className="py-2.5 px-3 text-center w-12 text-lime-400">PTS</th>
                        <th className="py-2.5 px-3 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {groupParticipants.map((p, pIdx) => {
                        const rank = p.groupRank || pIdx + 1;
                        const isTop2 = rank <= 2;
                        const played = (p.groupWins || 0) + (p.groupLosses || 0);

                        return (
                          <tr
                            key={p.id}
                            className={`transition-colors ${
                              isTop2
                                ? 'bg-blue-500/5 hover:bg-blue-500/10'
                                : 'bg-slate-950/30 hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-3 px-3 text-center font-black">
                              <span
                                className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${
                                  rank === 1
                                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                                    : rank === 2
                                    ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40'
                                    : 'text-slate-400'
                                }`}
                              >
                                {rank}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span className="truncate max-w-[150px] sm:max-w-[180px]">
                                  {p.name}
                                </span>
                                {p.seed && (
                                  <span className="text-[9px] font-black px-1 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                                    #{p.seed}
                                  </span>
                                )}
                              </div>
                              {p.club && (
                                <p className="text-[10px] text-slate-400 truncate">{p.club}</p>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center text-slate-300 font-bold">
                              {played}
                            </td>
                            <td className="py-3 px-2 text-center text-emerald-400 font-black">
                              {p.groupWins || 0}
                            </td>
                            <td className="py-3 px-2 text-center text-rose-400 font-bold">
                              {p.groupLosses || 0}
                            </td>
                            <td className="py-3 px-3 text-center font-black text-lime-400 font-score text-sm">
                              {p.groupPoints || 0}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {isTop2 ? (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 whitespace-nowrap">
                                  Top 2 (Upper)
                                </span>
                              ) : (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                                  Bottom 2 (Beginner)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Group Matches Schedule & Scoring */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Jadwal & Skor Pertandingan Fase Grup ({groupMatches.length} Match)
          </h3>

          {/* Group Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setSelectedGroupTab('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedGroupTab === 'ALL'
                  ? 'bg-lime-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Grup
            </button>
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroupTab(g)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  selectedGroupTab === g
                    ? 'bg-lime-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupMatches
            .filter((m) => selectedGroupTab === 'ALL' || m.groupName === selectedGroupTab)
            .map((match) => {
              const isFinished = match.status === 'FINISHED';
              const isLive = match.status === 'LIVE';

              return (
                <div
                  key={match.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isLive
                      ? 'bg-lime-500/5 border-lime-500/40 shadow-lg shadow-lime-500/5'
                      : isFinished
                      ? 'bg-slate-900/80 border-slate-800'
                      : 'bg-slate-900/50 border-slate-800/80'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800/60 pb-2 mb-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {match.groupName || 'Fase Grup'} • #{match.matchOrder}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{match.court || 'Court 1'}</span>
                      {isLive && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 font-black">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          LIVE
                        </span>
                      )}
                      {isFinished && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-black">
                          Selesai
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Teams & Scores */}
                  <div className="space-y-2">
                    {/* Team 1 */}
                    <div
                      className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold ${
                        match.winnerId === match.participant1?.id
                          ? 'bg-lime-500/15 text-lime-300 border-l-4 border-l-lime-400'
                          : 'text-slate-200'
                      }`}
                    >
                      <span className="truncate pr-2">{match.participant1?.name || 'TBD'}</span>
                      <div className="flex items-center gap-1 font-score">
                        {match.scores.map((s, idx) => (
                          <span
                            key={idx}
                            className={`w-6 h-6 rounded flex items-center justify-center border ${
                              s.score1 > s.score2
                                ? 'bg-slate-800 text-white font-black border-slate-600'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {s.score1}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div
                      className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold ${
                        match.winnerId === match.participant2?.id
                          ? 'bg-lime-500/15 text-lime-300 border-l-4 border-l-lime-400'
                          : 'text-slate-200'
                      }`}
                    >
                      <span className="truncate pr-2">{match.participant2?.name || 'TBD'}</span>
                      <div className="flex items-center gap-1 font-score">
                        {match.scores.map((s, idx) => (
                          <span
                            key={idx}
                            className={`w-6 h-6 rounded flex items-center justify-center border ${
                              s.score2 > s.score1
                                ? 'bg-slate-800 text-white font-black border-slate-600'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {s.score2}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Admin Update Button */}
                  {isAdmin && onOpenScoreControl && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                      <button
                        onClick={() => onOpenScoreControl(match)}
                        className="w-full py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-black transition-colors flex items-center justify-center gap-1.5"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Update Skor & Wasit</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
