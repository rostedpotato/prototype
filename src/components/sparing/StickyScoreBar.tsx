'use client';

import { Trophy } from 'lucide-react';
import type { Sparring } from '@/types/sparing';
import { communityRecord, sortMatches } from '@/lib/sparingUtils';

// Bar ringkas yang menempel di bawah navbar saat sesi LIVE, agar skor head-to-head
// selalu terlihat tanpa menutupi konten di bawahnya.
export default function StickyScoreBar({ sparring }: { sparring: Sparring }) {
  const matches = sortMatches(sparring.matches);
  const recordA = communityRecord(sparring, 'A');
  const recordB = communityRecord(sparring, 'B');
  const leader = recordA.won === recordB.won ? null : recordA.won > recordB.won ? 'A' : 'B';
  const ongoingIndex = matches.findIndex((match) => match.status === 'ONGOING');
  const ongoingNo = ongoingIndex >= 0 ? ongoingIndex + 1 : null;

  return (
    <div className="rounded-2xl border border-red-500/40 bg-slate-900 shadow-lg shadow-red-500/10 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5">
        <span className="flex items-center gap-1.5 shrink-0 rounded-full bg-red-500/20 border border-red-500/40 px-2.5 py-1 text-[10px] font-extrabold text-red-300">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-live-dot" />
          LIVE{ongoingNo && <span className="sm:hidden">· M{ongoingNo}</span>}
        </span>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-xs sm:text-sm font-extrabold text-cyan-300 truncate max-w-[9rem] sm:max-w-[14rem] text-right">
            {sparring.communityAName || 'Komunitas 1'}
            {leader === 'A' && <Trophy className="inline w-3.5 h-3.5 text-lime-400 ml-1 -mt-0.5" />}
          </span>
          <span className="font-score text-2xl text-white shrink-0">
            {recordA.won} <span className="text-slate-500">:</span> {recordB.won}
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-violet-300 truncate max-w-[9rem] sm:max-w-[14rem]">
            {leader === 'B' && <Trophy className="inline w-3.5 h-3.5 text-lime-400 mr-1 -mt-0.5" />}
            {sparring.communityBName || 'Komunitas 2'}
          </span>
        </div>

        <span className="shrink-0 text-[10px] font-bold text-slate-400 hidden sm:block">
          {ongoingNo ? `MATCH ${ongoingNo} BERLANGSUNG` : 'TANPA MATCH LIVE'}
        </span>
      </div>
    </div>
  );
}
