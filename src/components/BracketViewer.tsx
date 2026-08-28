'use client';

import { useState } from 'react';
import { Tournament, Match } from '@/types/tournament';
import { useAdminAuth } from '@/lib/authStore';
import { Trophy, SlidersHorizontal, Medal, Sparkles, Layers } from 'lucide-react';

interface BracketViewerProps {
  tournament: Tournament;
  onOpenScoreControl?: (match: Match) => void;
  defaultPhase?: 'KNOCKOUT_UPPER' | 'KNOCKOUT_BOTTOM';
}

export default function BracketViewer({
  tournament,
  onOpenScoreControl,
  defaultPhase = 'KNOCKOUT_UPPER',
}: BracketViewerProps) {
  const { isAdmin } = useAdminAuth();
  const [activePhase, setActivePhase] = useState<'KNOCKOUT_UPPER' | 'KNOCKOUT_BOTTOM'>(defaultPhase);

  const isTwoStage = tournament.format?.startsWith('TWO_STAGE');

  const knockoutUpperMatches = tournament.matches.filter((m) => m.phase === 'KNOCKOUT_UPPER');
  const knockoutBottomMatches = tournament.matches.filter((m) => m.phase === 'KNOCKOUT_BOTTOM');
  const hasKnockoutMatches = knockoutUpperMatches.length > 0 || knockoutBottomMatches.length > 0;

  // Filter matches by phase if TWO_STAGE, otherwise use all matches
  const targetMatches = isTwoStage
    ? tournament.matches.filter((m) => m.phase === activePhase)
    : tournament.matches;

  // If Two-Stage and Knockout Brackets are not generated yet, show informative locked state
  if (isTwoStage && !hasKnockoutMatches) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto shadow-inner">
          <Layers className="w-8 h-8 text-blue-400" />
        </div>

        <div className="max-w-xl mx-auto space-y-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Sistem Turnamen Dua Tahap (Two-Stage)
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Bagan Knockout Dimulai Setelah Fase Grup Selesai
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Turnamen ini sedang dalam <strong>Fase 1 (Round Robin 4 Grup)</strong>. Setelah semua pertandingan grup selesai, Admin akan mengunci klasemen dan membuat <strong>2 Bagan Knockout Terpisah</strong> yang langsung dimulai dari babak <strong>Perempat Final (Quarter Final)</strong>:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left pt-2">
          <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
              <Trophy className="w-4 h-4 text-amber-400" />
              🏆 Bagan Atas (Upper Bracket)
            </div>
            <p className="text-xs text-slate-300 font-semibold">
              Diikuti oleh 8 tim (Peringkat 1 & 2 dari Grup 1, 2, 3, dan 4).
            </p>
            <p className="text-[11px] text-slate-400">
              Mulai dari QF ➔ Semifinal ➔ Final (Memperebutkan Juara 1 Bagan Atas).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Medal className="w-4 h-4 text-emerald-400" />
              🏅 Bagan Bawah (Bottom Bracket)
            </div>
            <p className="text-xs text-slate-300 font-semibold">
              Diikuti oleh 8 tim (Peringkat 3 & 4 dari Grup 1, 2, 3, dan 4).
            </p>
            <p className="text-[11px] text-slate-400">
              Mulai dari QF ➔ Semifinal ➔ Final (Memperebutkan Juara 1 Bagan Bawah).
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Group matches by round
  const maxRound = targetMatches.length > 0 ? Math.max(...targetMatches.map((m) => m.round)) : 1;
  const roundsArray = Array.from({ length: maxRound }, (_, i) => i + 1);

  // Find champion if final is finished
  const finalMatch = targetMatches.find((m) => m.round === maxRound);
  const champion =
    finalMatch?.status === 'FINISHED' && finalMatch.winnerId
      ? finalMatch.participant1?.id === finalMatch.winnerId
        ? finalMatch.participant1
        : finalMatch.participant2?.id === finalMatch.winnerId
        ? finalMatch.participant2
        : null
      : null;

  return (
    <div className="w-full space-y-6">
      {/* Two-Stage Bracket Switcher */}
      {isTwoStage && hasKnockoutMatches && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Pilih Bagan Knockout:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActivePhase('KNOCKOUT_UPPER')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                activePhase === 'KNOCKOUT_UPPER'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>🏆 Bagan Atas (Top 2 Grup)</span>
            </button>

            <button
              onClick={() => setActivePhase('KNOCKOUT_BOTTOM')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                activePhase === 'KNOCKOUT_BOTTOM'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Medal className="w-4 h-4 text-emerald-400" />
              <span>🏅 Bagan Bawah (Peringkat 3 & 4)</span>
            </button>
          </div>
        </div>
      )}

      {/* Champion Banner if final finished */}
      {champion && (
        <div
          className={`p-5 rounded-2xl border-2 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in ${
            activePhase === 'KNOCKOUT_UPPER' || !isTwoStage
              ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-lime-500/20 border-amber-400'
              : 'bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-cyan-500/20 border-emerald-400'
          }`}
        >
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                activePhase === 'KNOCKOUT_UPPER' || !isTwoStage
                  ? 'bg-amber-400 text-slate-950 shadow-amber-500/30'
                  : 'bg-emerald-400 text-slate-950 shadow-emerald-500/30'
              }`}
            >
              {activePhase === 'KNOCKOUT_UPPER' || !isTwoStage ? (
                <Trophy className="w-8 h-8 stroke-[2.5]" />
              ) : (
                <Medal className="w-8 h-8 stroke-[2.5]" />
              )}
            </div>
            <div>
              <span
                className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 justify-center sm:justify-start ${
                  activePhase === 'KNOCKOUT_UPPER' || !isTwoStage
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isTwoStage
                  ? activePhase === 'KNOCKOUT_UPPER'
                    ? 'JUARA 1 BAGAN ATAS (UPPER BRACKET)'
                    : 'JUARA 1 BAGAN BAWAH (BOTTOM BRACKET)'
                  : 'JUARA 1 / TOURNAMENT CHAMPION'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">{champion.name}</h2>
              {champion.club && (
                <p className="text-xs font-bold text-slate-300">{champion.club}</p>
              )}
            </div>
          </div>
          <div
            className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider ${
              activePhase === 'KNOCKOUT_UPPER' || !isTwoStage
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                : 'bg-emerald-400/20 border-emerald-400/50 text-emerald-300'
            }`}
          >
            🏆 Winner
          </div>
        </div>
      )}

      {/* Bracket Tree Container with Panning Scroll */}
      <div className="overflow-x-auto bracket-scroll pb-6 pt-2">
        <div className="inline-flex items-stretch gap-0 min-w-[840px] px-2">
          {roundsArray.map((roundNum) => {
            const matchesInRound = targetMatches
              .filter((m) => m.round === roundNum)
              .sort((a, b) => a.matchOrder - b.matchOrder);

            let roundTitle = matchesInRound[0]?.roundName || `Babak ${roundNum}`;
            if (isTwoStage) {
              if (roundNum === 1) roundTitle = 'Perempat Final (Quarter Final)';
              else if (roundNum === 2) roundTitle = 'Semifinal';
              else if (roundNum === 3) roundTitle = activePhase === 'KNOCKOUT_UPPER' ? 'Final Bagan Atas' : 'Final Bagan Bawah';
            }

            const isFinal = roundNum === maxRound;
            const hasNextRound = roundNum < maxRound;

            // Pair matches (every 2 matches feed into 1 match next round)
            const pairs: Match[][] = [];
            for (let i = 0; i < matchesInRound.length; i += 2) {
              pairs.push(matchesInRound.slice(i, i + 2));
            }

            return (
              <div key={roundNum} className="flex items-stretch">
                {/* Round Column */}
                <div className="w-72 flex flex-col">
                  {/* Round Header */}
                  <div className="mb-6 text-center">
                    <span
                      className={`inline-block px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 ${
                        isFinal
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-md shadow-amber-500/10'
                          : 'bg-slate-900 text-slate-200 border-slate-700 shadow-sm'
                      }`}
                    >
                      {roundTitle}
                    </span>
                  </div>

                  {/* Matches List grouped by pairs */}
                  <div className="flex-1 flex flex-col justify-around gap-8">
                    {pairs.map((pair, pIdx) => (
                      <div key={pIdx} className="flex flex-col justify-around gap-6 flex-1">
                        {pair.map((match) => {
                          const isWinner1 =
                            match.status === 'FINISHED' &&
                            match.winnerId &&
                            match.winnerId === match.participant1?.id;
                          const isWinner2 =
                            match.status === 'FINISHED' &&
                            match.winnerId &&
                            match.winnerId === match.participant2?.id;

                          const isLive = match.status === 'LIVE';

                          return (
                            <div
                              key={match.id}
                              className={`rounded-2xl border-2 transition-all bg-slate-900 shadow-xl overflow-hidden ${
                                isLive
                                  ? 'border-lime-400 shadow-lime-500/10 ring-2 ring-lime-400/30'
                                  : match.status === 'FINISHED'
                                  ? 'border-slate-700'
                                  : 'border-slate-800'
                              }`}
                            >
                              {/* Match Card Top Strip */}
                              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[11px]">
                                <div className="flex items-center gap-1.5 truncate pr-2">
                                  <span className="font-extrabold text-slate-400">
                                    {match.court || `Match #${match.matchOrder}`}
                                  </span>
                                  {match.referee && (
                                    <span className="text-amber-300 font-semibold text-[10px]">
                                      • 🧑‍⚖️ {match.referee}
                                    </span>
                                  )}
                                </div>

                                <div>
                                  {isLive && (
                                    <span className="flex items-center gap-1 font-black text-red-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-live-dot" />
                                      LIVE
                                    </span>
                                  )}
                                  {match.status === 'FINISHED' && (
                                    <span className="text-slate-400 font-bold text-[10px]">
                                      SELESAI
                                    </span>
                                  )}
                                  {match.status === 'UPCOMING' && (
                                    <span className="text-slate-500 font-medium text-[10px]">
                                      {match.scheduledTime || 'Upcoming'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Teams List */}
                              <div className="divide-y divide-slate-800/80">
                                {/* Team 1 */}
                                <div
                                  className={`flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors ${
                                    isWinner1
                                      ? 'bg-lime-500/15 text-lime-300 border-l-4 border-l-lime-400'
                                      : match.status === 'FINISHED' && !isWinner1
                                      ? 'text-slate-400 opacity-80'
                                      : 'text-slate-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                    {match.participant1?.seed && (
                                      <span className="text-[10px] text-amber-400 font-black px-1 rounded bg-amber-400/10 border border-amber-400/30">
                                        [{match.participant1.seed}]
                                      </span>
                                    )}
                                    <span className="truncate">
                                      {match.participant1?.name || (
                                        <span className="text-slate-500 italic font-normal">
                                          Menunggu pemenang...
                                        </span>
                                      )}
                                    </span>
                                  </div>

                                  {/* Score Boxes */}
                                  <div className="flex items-center gap-1 font-score text-xs flex-shrink-0">
                                    {match.scores.map((s, idx) => {
                                      if (
                                        s.score1 === 0 &&
                                        s.score2 === 0 &&
                                        match.status === 'UPCOMING'
                                      )
                                        return null;
                                      return (
                                        <span
                                          key={idx}
                                          className={`w-6 h-6 rounded flex items-center justify-center border font-bold text-xs ${
                                            s.score1 > s.score2
                                              ? 'bg-slate-800 border-slate-600 text-white font-black'
                                              : 'bg-slate-950 border-slate-800 text-slate-400'
                                          }`}
                                        >
                                          {s.score1}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Team 2 */}
                                <div
                                  className={`flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors ${
                                    isWinner2
                                      ? 'bg-lime-500/15 text-lime-300 border-l-4 border-l-lime-400'
                                      : match.status === 'FINISHED' && !isWinner2
                                      ? 'text-slate-400 opacity-80'
                                      : 'text-slate-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                    {match.participant2?.seed && (
                                      <span className="text-[10px] text-amber-400 font-black px-1 rounded bg-amber-400/10 border border-amber-400/30">
                                        [{match.participant2.seed}]
                                      </span>
                                    )}
                                    <span className="truncate">
                                      {match.participant2?.name || (
                                        <span className="text-slate-500 italic font-normal">
                                          Menunggu pemenang...
                                        </span>
                                      )}
                                    </span>
                                  </div>

                                  {/* Score Boxes */}
                                  <div className="flex items-center gap-1 font-score text-xs flex-shrink-0">
                                    {match.scores.map((s, idx) => {
                                      if (
                                        s.score1 === 0 &&
                                        s.score2 === 0 &&
                                        match.status === 'UPCOMING'
                                      )
                                        return null;
                                      return (
                                        <span
                                          key={idx}
                                          className={`w-6 h-6 rounded flex items-center justify-center border font-bold text-xs ${
                                            s.score2 > s.score1
                                              ? 'bg-slate-800 border-slate-600 text-white font-black'
                                              : 'bg-slate-950 border-slate-800 text-slate-400'
                                          }`}
                                        >
                                          {s.score2}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Admin Live Score Shortcut */}
                              {isAdmin && onOpenScoreControl && (
                                <div className="p-1.5 bg-slate-950 border-t border-slate-800">
                                  <button
                                    onClick={() => onOpenScoreControl(match)}
                                    className="w-full py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-extrabold transition-colors flex items-center justify-center gap-1"
                                  >
                                    <SlidersHorizontal className="w-3 h-3" />
                                    Update Skor
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* BRACKET CONNECTOR LINES (Garis Penghubung Tegas) */}
                {hasNextRound && (
                  <div className="w-12 flex flex-col justify-around py-12 relative">
                    {pairs.map((_, pIdx) => (
                      <div key={pIdx} className="flex-1 flex flex-col justify-center relative">
                        {/* Upper branch horizontal arm */}
                        <div className="absolute top-[25%] left-0 w-1/2 h-[2px] bg-slate-600" />
                        {/* Lower branch horizontal arm */}
                        <div className="absolute top-[75%] left-0 w-1/2 h-[2px] bg-slate-600" />
                        {/* Vertical bridge joining upper and lower branches */}
                        <div className="absolute top-[25%] bottom-[25%] left-1/2 w-[2px] bg-slate-600" />
                        {/* Center horizontal stem extending into next round */}
                        <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-slate-600" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* FINAL PODIUM / TROPHY CONNECTOR */}
          <div className="w-10 flex flex-col justify-center items-center relative py-12">
            <div className="w-full h-[2px] bg-amber-400" />
          </div>

          <div className="w-36 flex flex-col justify-center items-center text-center">
            <div className="p-4 rounded-2xl bg-slate-900 border-2 border-amber-400 shadow-xl flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Trophy className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                JUARA 1
              </span>
              <p className="text-xs font-black text-white line-clamp-2">
                {champion?.name || 'TBD (Menunggu Final)'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
