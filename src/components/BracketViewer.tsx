'use client';

import { Tournament, Match } from '@/types/tournament';
import { useAdminAuth } from '@/lib/authStore';
import { Trophy, SlidersHorizontal, Medal } from 'lucide-react';

interface BracketViewerProps {
  tournament: Tournament;
  onOpenScoreControl?: (match: Match) => void;
}

export default function BracketViewer({ tournament, onOpenScoreControl }: BracketViewerProps) {
  const { isAdmin } = useAdminAuth();

  // Group matches by round
  const maxRound = Math.max(...tournament.matches.map((m) => m.round), 1);
  const roundsArray = Array.from({ length: maxRound }, (_, i) => i + 1);

  // Find champion if final is finished
  const finalMatch = tournament.matches.find((m) => m.round === maxRound);
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
      {/* Champion Banner if final finished */}
      {champion && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-lime-500/20 border-2 border-amber-400 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
              <Trophy className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5 justify-center sm:justify-start">
                <Medal className="w-3.5 h-3.5" />
                JUARA 1 / TOURNAMENT CHAMPION
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">{champion.name}</h2>
              {champion.club && (
                <p className="text-xs font-bold text-slate-300">{champion.club}</p>
              )}
            </div>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-black uppercase tracking-wider">
            🏆 Winner
          </div>
        </div>
      )}

      {/* Bracket Tree Container with Panning Scroll */}
      <div className="overflow-x-auto bracket-scroll pb-6 pt-2">
        <div className="inline-flex items-stretch gap-0 min-w-[840px] px-2">
          {roundsArray.map((roundNum) => {
            const matchesInRound = tournament.matches
              .filter((m) => m.round === roundNum)
              .sort((a, b) => a.matchOrder - b.matchOrder);

            const roundTitle = matchesInRound[0]?.roundName || `Babak ${roundNum}`;
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
                                <span className="font-extrabold text-slate-400">
                                  {match.court || `Match #${match.matchOrder}`}
                                </span>

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
                                          className={`w-5 h-5 rounded flex items-center justify-center border ${
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
                                          className={`w-5 h-5 rounded flex items-center justify-center border ${
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
