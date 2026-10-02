'use client';

import { useState } from 'react';
import { Tournament, Match } from '@/types/tournament';
import { useAdminAuth } from '@/lib/authStore';
import { TournamentService } from '@/lib/tournamentStore';
import { calculateGroupStandings, getMatchSetsSummary, getActiveSets } from '@/lib/standingUtils';
import {
  Trophy,
  Shield,
  Medal,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  Users,
  Layers,
  Calendar,
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

  const groups = [...new Set(tournament.participants.map((p) => p.group).filter((g): g is string => Boolean(g)))];
  const poolLabel = (groupName: string) => {
    const index = groups.indexOf(groupName);
    return index >= 0 ? `Pool ${String.fromCharCode(65 + index)}` : groupName;
  };

  // Filter group matches
  const groupMatches = tournament.matches.filter((m) => m.phase === 'GROUP');
  const allGroupsComplete = groupMatches.length > 0 && groupMatches.every((m) => m.status === 'FINISHED' || m.status === 'WALKOVER');

  const handleGenerateKnockout = () => {
    if (
      confirm(
        'Kunci klasemen grup sekarang dan buat 2 Bagan Knockout (Upper Bracket & Beginner Bracket)?'
      )
    ) {
      TournamentService.generateKnockoutForTwoStage(tournament.id);
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
              Fase 1: Round Robin ({groups.length} Pool) ➔ Fase 2: Upper & Beginner Knockout
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {tournament.participants.length} pasangan bertanding di {groups.length} pool. Juara &amp; runner-up lolos ke{' '}
              <strong className="text-blue-400">Bagan Atas (Upper Bracket)</strong>, dan 2 peringkat
              3 &amp; 4 lolos ke{' '}
              <strong className="text-emerald-400">Bagan Bawah (Bottom Bracket)</strong>.
            </p>
          </div>

          {/* Admin Knockout Trigger */}
          {isAdmin && (
            <div className="flex-shrink-0">
              {tournament.groupStageCompleted ? (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>2 Bagan Knockout Sudah Aktif (Mulai dari QF)</span>
                </div>
              ) : (
                <div className="space-y-1.5 text-right">
                  <button
                    onClick={handleGenerateKnockout}
                    className={`px-5 py-3 rounded-2xl text-white font-black text-xs shadow-lg transition-all flex items-center gap-2 ${
                      allGroupsComplete
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/30 ring-2 ring-emerald-400 animate-pulse'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 shadow-blue-500/25'
                    }`}
                    disabled={!allGroupsComplete}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Kunci Klasemen & Buat 2 Bagan Knockout</span>
                  </button>
                  {allGroupsComplete && (
                    <p className="text-[11px] text-emerald-400 font-bold">
                      ✅ Semua {groupMatches.length} match grup selesai! Siap dibuat bagan.
                    </p>
                  )}
                  {!allGroupsComplete && <p className="text-[11px] text-slate-500">Selesaikan semua pertandingan grup sebelum mengunci klasemen.</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Visual Flow diagram summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
              <Users className="w-4 h-4 text-amber-400" />
              Fase 1: {groups.length} Pool ({tournament.participants.length / groups.length} pasangan/pool)
            </div>
            <p className="text-sm font-black text-white">Round Robin Antar Tim</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Total {groupMatches.length} pertandingan. Setiap pasangan bermain {Math.max(0, tournament.participants.filter((p) => p.group === groups[0]).length - 1)} kali. {tournament.rules.groupScoreMode === 'SET_TALLY' ? 'Admin menginput jumlah set menang; skor game per set tidak ditampilkan.' : 'Peringkat ditentukan dari hasil pertandingan.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-1">
              <Trophy className="w-4 h-4 text-blue-400" />
              🏆 Bagan Atas / Upper ({Math.ceil(tournament.participants.length / groups.length) * groups.length / 2} Tim)
            </div>
            <p className="text-sm font-black text-blue-200">Juara &amp; runner-up dari setiap pool (WD: dua tim mendapat bye)</p>
            <p className="text-[11px] text-blue-300/70 mt-1">
              Mulai dari QF ➔ SF ➔ Final (Memperebutkan Juara 1 Bagan Atas).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
              <Medal className="w-4 h-4 text-emerald-400" />
              🏅 Bagan Bawah / Beginner ({Math.ceil(tournament.participants.length / groups.length) * groups.length / 2} Tim)
            </div>
            <p className="text-sm font-black text-emerald-200">Peringkat 3 &amp; 4 dari setiap pool (WD: dua tim mendapat bye)</p>
            <p className="text-[11px] text-emerald-300/70 mt-1">
              Mulai dari QF ➔ SF ➔ Final (Memperebutkan Juara 1 Bagan Bawah).
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
            const rawParticipants = tournament.participants.filter(
              (p) => p.group === groupName
            );

            const inGroupMatches = tournament.matches.filter(
              (m) => m.phase === 'GROUP' && (m.groupName === groupName || m.roundName?.includes(groupName))
            );

            const sortedStandings = calculateGroupStandings(rawParticipants, inGroupMatches, tournament.rules.groupScoreMode);

            const colorThemes = [
              { header: 'from-blue-600/30 to-blue-900/20' },
              { header: 'from-emerald-600/30 to-emerald-900/20' },
              { header: 'from-amber-600/30 to-amber-900/20' },
              { header: 'from-rose-600/30 to-rose-900/20' },
            ];
            const theme = colorThemes[gIdx % colorThemes.length];

            return (
              <div key={groupName} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className={`px-5 py-3.5 bg-gradient-to-r ${theme.header} border-b border-slate-800 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-950/80 border border-slate-700 flex items-center justify-center font-black text-xs text-white">{gIdx + 1}</span>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">{poolLabel(groupName)}</h4>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">{rawParticipants.length} Pasangan (Best of 5)</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-black">
                        <th className="py-2.5 px-3 text-center w-8">POS</th>
                        <th className="py-2.5 px-3">PASANGAN / TIM</th>
                        <th className="py-2.5 px-1.5 text-center w-8">M</th>
                        <th className="py-2.5 px-1.5 text-center w-8 text-emerald-400">W</th>
                        <th className="py-2.5 px-1.5 text-center w-8 text-rose-400">L</th>
                        <th className="py-2.5 px-2 text-center">SET (±)</th>
                        {tournament.rules.groupScoreMode !== 'SET_TALLY' && <th className="py-2.5 px-2 text-center">POIN (±)</th>}
                        <th className="py-2.5 px-2.5 text-center text-lime-400 font-extrabold">PTS</th>
                        <th className="py-2.5 px-3 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {sortedStandings.map((p, pIdx) => {
                        const rank = pIdx + 1;
                        const isTop2 = rank <= 2;
                        return (
                          <tr key={p.id} className="bg-slate-950/30 hover:bg-slate-800/40">
                            <td className="py-3 px-3 text-center font-black">
                              <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${rank <= 2 ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400'}`}>{rank}</span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span className="truncate max-w-[130px]">{p.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-1.5 text-center text-slate-300 font-bold">{p.played}</td>
                            <td className="py-3 px-1.5 text-center text-emerald-400 font-bold">{p.groupWins}</td>
                            <td className="py-3 px-1.5 text-center text-rose-400 font-bold">{p.groupLosses}</td>
                            <td className="py-3 px-2 text-center text-slate-300 font-score font-bold">
                              {p.groupSetsWon}-{p.groupSetsLost} <span className="text-[10px] text-slate-500">({(p.groupSetDiff ?? 0) > 0 ? `+${p.groupSetDiff}` : p.groupSetDiff})</span>
                            </td>
                            {tournament.rules.groupScoreMode !== 'SET_TALLY' && <td className="py-3 px-2 text-center text-slate-300 font-score font-bold">
                              {p.groupPointsWon}-{p.groupPointsLost} <span className="text-[10px] text-slate-500">({(p.groupPointDiff ?? 0) > 0 ? `+${p.groupPointDiff}` : p.groupPointDiff})</span>
                            </td>}
                            <td className="py-3 px-2.5 text-center font-black font-score text-lime-400 text-sm">{p.groupPoints}</td>
                            <td className="py-3 px-3 text-right">
                              {isTop2 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">Top 2 Bagan Atas</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">Pos {rank} Bagan Bawah</span>
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

      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-lime-400" />
              Jadwal & Hasil Pertandingan Fase Grup (Race to 3 dari maksimal 5 set)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Total {groupMatches.length} pertandingan round-robin. Skor grup hanya mencatat jumlah set menang; tie-break berdasar selisih set lalu seed.</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedGroupTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedGroupTab === 'ALL' ? 'bg-lime-500 text-slate-950 font-black shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
            >
              Semua Grup
            </button>
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroupTab(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedGroupTab === g ? 'bg-lime-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400'}`}
              >
                {poolLabel(g)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tournament.matches
            .filter((m) => m.phase === 'GROUP' && (selectedGroupTab === 'ALL' || m.groupName === selectedGroupTab || m.roundName?.includes(selectedGroupTab)))
            .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || '') || (a.matchOrder || 0) - (b.matchOrder || 0))
            .map((match) => {
              const isFinished = match.status === 'FINISHED' || match.status === 'WALKOVER';
              const isWalkover = match.status === 'WALKOVER';
              const isLive = match.status === 'LIVE';
              const { setsWon1, setsWon2 } = getMatchSetsSummary(match.scores, tournament.rules.groupScoreMode);
              const activeScores = getActiveSets(match.scores);

              return (
                <div
                  key={match.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isLive
                      ? 'bg-lime-500/5 border-lime-500/40 shadow-lg shadow-lime-500/5'
                      : isWalkover
                      ? 'bg-rose-950/20 border-rose-800/40'
                      : isFinished
                      ? 'bg-slate-900/80 border-slate-800'
                      : 'bg-slate-900/50 border-slate-800/80'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800/60 pb-2 mb-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {match.groupName ? poolLabel(match.groupName) : 'Fase Grup'} • #{match.matchOrder}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span>{match.court || 'Court 1'}</span>
                      {match.referee && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-amber-300 font-semibold">🧑‍⚖️ {match.referee}</span>
                        </>
                      )}
                      {match.scheduledTime && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">🕒 {match.scheduledTime}</span>
                        </>
                      )}
                      {isLive && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 font-black">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          LIVE
                        </span>
                      )}
                      {isWalkover && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black">
                          Menang WO
                        </span>
                      )}
                      {match.status === 'FINISHED' && (
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
                        {tournament.rules.groupScoreMode === 'SET_TALLY' ? (
                          <span className="ml-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-lime-400 font-black text-xs">{setsWon1} set</span>
                        ) : activeScores.length > 0 ? (
                          activeScores.map((s, idx) => (
                            <span
                              key={idx}
                              className={`w-6 h-6 rounded-md flex items-center justify-center border text-xs ${
                                s.score1 > s.score2
                                  ? 'bg-slate-800 text-white font-black border-slate-600'
                                  : 'bg-slate-950 text-slate-500 border-slate-800 font-bold'
                              }`}
                            >
                              {s.score1}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                        {tournament.rules.groupScoreMode !== 'SET_TALLY' && (isFinished || isLive) && (
                          <span className="ml-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-lime-400 font-black text-xs">
                            {setsWon1} Set
                          </span>
                        )}
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
                        {tournament.rules.groupScoreMode === 'SET_TALLY' ? (
                          <span className="ml-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-lime-400 font-black text-xs">{setsWon2} set</span>
                        ) : activeScores.length > 0 ? (
                          activeScores.map((s, idx) => (
                            <span
                              key={idx}
                              className={`w-6 h-6 rounded-md flex items-center justify-center border text-xs ${
                                s.score2 > s.score1
                                  ? 'bg-slate-800 text-white font-black border-slate-600'
                                  : 'bg-slate-950 text-slate-500 border-slate-800 font-bold'
                              }`}
                            >
                              {s.score2}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                        {tournament.rules.groupScoreMode !== 'SET_TALLY' && (isFinished || isLive) && (
                          <span className="ml-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-lime-400 font-black text-xs">
                            {setsWon2} Set
                          </span>
                        )}
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
