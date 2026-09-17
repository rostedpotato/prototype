'use client';

import { CalendarDays, Trophy } from 'lucide-react';
import type { CommunitySlot, Sparring, SparringMatch } from '@/types/sparing';
import {
  communityRecord,
  getDisplayStatus,
  getPlayerMap,
  matchWinnerSlot,
  sortMatches,
  statusLabel,
} from '@/lib/sparingUtils';

const communityAccent: Record<CommunitySlot, string> = {
  A: 'text-cyan-300',
  B: 'text-violet-300',
};

function CommunityScore({
  name,
  slot,
  wins,
  isLeading,
}: {
  name: string;
  slot: CommunitySlot;
  wins: number;
  isLeading: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 sm:p-4 text-center min-w-0 ${
        isLeading ? 'border-lime-500/50 bg-lime-500/5' : 'border-slate-800 bg-slate-950/50'
      }`}
    >
      <div className="flex items-center justify-center gap-1.5">
        <span className={`text-xs font-extrabold leading-snug ${communityAccent[slot]}`}>
          {name || `Komunitas ${slot === 'A' ? '1' : '2'}`}
        </span>
        {isLeading && <Trophy className="w-3.5 h-3.5 text-lime-400 shrink-0" />}
      </div>
      <p className="mt-2 font-score text-4xl sm:text-5xl text-white leading-none">{wins}</p>
      <p className="mt-1.5 text-[10px] font-bold tracking-wide text-slate-500">MATCH MENANG</p>
    </div>
  );
}

function MatchRow({
  match,
  matchNo,
  sparring,
  playerMap,
}: {
  match: SparringMatch;
  matchNo: number;
  sparring: Sparring;
  playerMap: Map<string, { id: string; name: string }>;
}) {
  const playerName = (id: string | null) => (id ? playerMap.get(id)?.name ?? '—' : 'Belum dipilih');
  const winner = matchWinnerSlot(match);

  const pairNames = (community: CommunitySlot, ids: [string | null, string | null]) => (
    <div className={`min-w-0 ${community === 'B' ? 'sm:text-right' : ''}`}>
      {ids.map((id, index) => (
        <p
          key={index}
          className={`text-xs font-bold leading-relaxed ${
            winner === community ? 'text-lime-300' : 'text-slate-200'
          } ${id ? '' : 'text-slate-500 font-semibold'}`}
        >
          {playerName(id)}
        </p>
      ))}
    </div>
  );

  return (
    <div
      className={`rounded-xl border p-3 ${
        match.status === 'ONGOING'
          ? 'border-red-500/40 bg-red-500/5'
          : 'border-slate-800 bg-slate-950/40'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-black tracking-wide text-slate-500">MATCH {matchNo}</span>
        {match.status === 'ONGOING' && (
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/40 px-2 py-0.5 text-[9px] font-black text-red-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-live-dot" />
            BERLANGSUNG
          </span>
        )}
        {match.status === 'DONE' && (
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-black text-emerald-300">
            SELESAI
          </span>
        )}
        {match.status === 'PENDING' && (
          <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[9px] font-black text-slate-400">
            MENUNGGU
          </span>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        {pairNames('A', [match.playerA1Id, match.playerA2Id])}
        <div className="text-center shrink-0">
          {match.status === 'DONE' ? (
            <span className="font-score text-xl sm:text-2xl text-white whitespace-nowrap">
              <span className={winner === 'A' ? 'text-lime-300' : 'text-slate-300'}>{match.scoreA}</span>
              <span className="mx-1 text-slate-500">:</span>
              <span className={winner === 'B' ? 'text-lime-300' : 'text-slate-300'}>{match.scoreB}</span>
            </span>
          ) : (
            <span className={`font-score text-lg ${match.status === 'ONGOING' ? 'text-red-300' : 'text-slate-600'}`}>
              {match.status === 'ONGOING' ? 'VS' : '—'}
            </span>
          )}
        </div>
        {pairNames('B', [match.playerB1Id, match.playerB2Id])}
      </div>
    </div>
  );
}

export default function SparringScoreboard({ sparring }: { sparring: Sparring }) {
  const status = getDisplayStatus(sparring);
  const matches = sortMatches(sparring.matches);
  const playerMap = getPlayerMap(sparring);
  const recordA = communityRecord(sparring, 'A');
  const recordB = communityRecord(sparring, 'B');
  const leader = recordA.won === recordB.won ? null : recordA.won > recordB.won ? 'A' : 'B';

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${
        status === 'LIVE'
          ? 'border-red-500/40 bg-slate-900 shadow-lg shadow-red-500/10'
          : 'border-slate-800 bg-slate-900'
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-slate-950 border-b border-slate-800">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-wide text-slate-500">SPARING ANTAR KOMUNITAS</p>
          <h3 className="text-sm sm:text-base font-black text-white leading-snug">
            {sparring.name || 'Sparing'}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status === 'LIVE' && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] sm:text-[11px] font-extrabold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-live-dot" />
              {statusLabel(status)}
            </span>
          )}
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
            {sparring.date}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-4 p-4 sm:p-5">
        <CommunityScore
          name={sparring.communityAName}
          slot="A"
          wins={recordA.won}
          isLeading={leader === 'A'}
        />
        <div className="flex flex-col items-center justify-center px-1">
          <span className="text-xs font-black text-slate-500">VS</span>
          <span className="mt-1.5 text-center text-[10px] font-bold leading-tight text-slate-500">
            {matches.length}
            <br />
            MATCH
          </span>
        </div>
        <CommunityScore
          name={sparring.communityBName}
          slot="B"
          wins={recordB.won}
          isLeading={leader === 'B'}
        />
      </div>

      <div className="space-y-2.5 px-4 sm:px-5 pb-4 sm:pb-5">
        {matches.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-[11px] font-bold text-slate-500">
            Belum ada match pada sparing ini.
          </p>
        ) : (
          matches.map((match, index) => (
            <MatchRow
              key={match.id}
              match={match}
              matchNo={index + 1}
              sparring={sparring}
              playerMap={playerMap}
            />
          ))
        )}
      </div>
    </div>
  );
}
