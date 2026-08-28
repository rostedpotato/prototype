'use client';

import { Match, SportType } from '@/types/tournament';
import { useAdminAuth } from '@/lib/authStore';
import { getMatchSetsSummary } from '@/lib/standingUtils';
import { Clock, CheckCircle2, SlidersHorizontal } from 'lucide-react';

interface LiveScoreCardProps {
  match: Match;
  sport: SportType;
  tournamentName?: string;
  tournamentId: string;
  onOpenScoreControl?: (match: Match) => void;
}

export default function LiveScoreCard({
  match,
  sport,
  tournamentName,
  tournamentId,
  onOpenScoreControl,
}: LiveScoreCardProps) {
  const { isAdmin } = useAdminAuth();

  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';
  const { setsWon1, setsWon2 } = getMatchSetsSummary(match.scores);

  const isWinner1 = match.winnerId && match.winnerId === match.participant1?.id;
  const isWinner2 = match.winnerId && match.winnerId === match.participant2?.id;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isLive
          ? 'bg-slate-900/90 border-lime-500/40 shadow-lg shadow-lime-500/5 ring-1 ring-lime-500/20'
          : isFinished
          ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          {/* Sport Indicator */}
          <span
            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              sport === 'BADMINTON'
                ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            {sport === 'BADMINTON' ? '🏸 Badminton' : '🎾 Padel'}
          </span>

          <span className="font-semibold text-slate-300">
            {match.court || 'Court 1'}
          </span>
          {match.referee && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-amber-300 font-semibold">🧑‍⚖️ {match.referee}</span>
            </>
          )}
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-medium">{match.roundName}</span>
        </div>

        {/* Status Badge */}
        <div>
          {isLive && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-extrabold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-live-dot" />
              LIVE SET {match.currentSet}
            </span>
          )}
          {isFinished && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold text-[11px] border border-slate-700">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Selesai
            </span>
          )}
          {match.status === 'UPCOMING' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 font-medium text-[11px]">
              <Clock className="w-3 h-3 text-amber-400" />
              {match.scheduledTime || 'Upcoming'}
            </span>
          )}
        </div>
      </div>

      {/* Main Score Body */}
      <div className="p-4 space-y-3">
        {/* Participant 1 Row */}
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
            isWinner1
              ? 'bg-lime-500/10 border border-lime-500/30'
              : 'bg-slate-950/40 border border-slate-800/40'
          }`}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`font-bold text-sm truncate ${
                    isWinner1 ? 'text-lime-300' : 'text-slate-100'
                  }`}
                >
                  {match.participant1?.name || 'TBD (Menunggu Lawan)'}
                </span>
                {match.participant1?.seed && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-400/30">
                    [{match.participant1.seed}]
                  </span>
                )}
              </div>
              {match.participant1?.club && (
                <p className="text-[11px] text-slate-400 truncate">
                  {match.participant1.club}
                </p>
              )}
            </div>
          </div>

          {/* Scores Matrix for Participant 1 */}
          <div className="flex items-center gap-1.5 flex-shrink-0 font-score">
            {match.scores.map((set, idx) => {
              const isCurrentActiveSet = isLive && match.currentSet === set.setNumber;
              const hasScore = set.score1 > 0 || set.score2 > 0 || isCurrentActiveSet;
              if (!hasScore && idx > 0 && !isLive) return null;

              return (
                <div
                  key={set.setNumber}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                    isCurrentActiveSet
                      ? 'bg-lime-500/20 text-lime-300 border-lime-500/50 shadow-inner'
                      : isWinner1 && set.score1 > set.score2
                      ? 'bg-slate-800 text-slate-100 border-slate-700 font-extrabold'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800'
                  }`}
                >
                  {set.score1}
                </div>
              );
            })}
            {/* Sets summary tally */}
            {(isLive || isFinished || setsWon1 > 0 || setsWon2 > 0) && (
              <div className="w-8 h-8 rounded-lg bg-lime-500/20 text-lime-300 border border-lime-500/40 flex items-center justify-center text-xs font-black ml-1">
                {setsWon1}
              </div>
            )}
          </div>
        </div>

        {/* Participant 2 Row */}
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
            isWinner2
              ? 'bg-lime-500/10 border border-lime-500/30'
              : 'bg-slate-950/40 border border-slate-800/40'
          }`}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`font-bold text-sm truncate ${
                    isWinner2 ? 'text-lime-300' : 'text-slate-100'
                  }`}
                >
                  {match.participant2?.name || 'TBD (Menunggu Lawan)'}
                </span>
                {match.participant2?.seed && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-400/30">
                    [{match.participant2.seed}]
                  </span>
                )}
              </div>
              {match.participant2?.club && (
                <p className="text-[11px] text-slate-400 truncate">
                  {match.participant2.club}
                </p>
              )}
            </div>
          </div>

          {/* Scores Matrix for Participant 2 */}
          <div className="flex items-center gap-1.5 flex-shrink-0 font-score">
            {match.scores.map((set, idx) => {
              const isCurrentActiveSet = isLive && match.currentSet === set.setNumber;
              const hasScore = set.score1 > 0 || set.score2 > 0 || isCurrentActiveSet;
              if (!hasScore && idx > 0 && !isLive) return null;

              return (
                <div
                  key={set.setNumber}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                    isCurrentActiveSet
                      ? 'bg-lime-500/20 text-lime-300 border-lime-500/50 shadow-inner'
                      : isWinner2 && set.score2 > set.score1
                      ? 'bg-slate-800 text-slate-100 border-slate-700 font-extrabold'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800'
                  }`}
                >
                  {set.score2}
                </div>
              );
            })}
            {/* Sets summary tally */}
            {(isLive || isFinished || setsWon1 > 0 || setsWon2 > 0) && (
              <div className="w-8 h-8 rounded-lg bg-lime-500/20 text-lime-300 border border-lime-500/40 flex items-center justify-center text-xs font-black ml-1">
                {setsWon2}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Live Scoring Control Quick Action */}
      {isAdmin && onOpenScoreControl && (
        <div className="px-4 pb-3 pt-1">
          <button
            onClick={() => onOpenScoreControl(match)}
            className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Update Skor / Kontrol Wasit
          </button>
        </div>
      )}
    </div>
  );
}
