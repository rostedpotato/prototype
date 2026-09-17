'use client';

import { Trophy, Users } from 'lucide-react';
import { useSparrings } from '@/lib/useSparrings';
import { hasOngoingMatch } from '@/lib/sparingUtils';
import SparringScoreboard from '@/components/sparing/SparringScoreboard';
import type { Sparring } from '@/types/sparing';

function ScoreboardGrid({ sparrings }: { sparrings: Sparring[] }) {
  return (
    <div className={sparrings.length > 1 ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start' : 'grid grid-cols-1 gap-6'}>
      {sparrings.map((sparring) => (
        <SparringScoreboard key={sparring.id} sparring={sparring} />
      ))}
    </div>
  );
}

export default function PublicSparingView() {
  const { sparrings, isLoading } = useSparrings();

  const live = sparrings.filter(hasOngoingMatch);
  const finished = sparrings.filter(
    (sparring) => !hasOngoingMatch(sparring) && sparring.matches.some((match) => match.status === 'DONE')
  );

  return (
    <div className="space-y-10 pb-16">
      <section className="relative overflow-hidden rounded-3xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-slate-300">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Live Score Sparing
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Sparing <span className="text-cyan-400">Antar Komunitas</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-2xl leading-relaxed">
            Pantau live score match double antar komunitas secara real-time — pemain, pasangan, dan skor tiap match.
          </p>
        </div>
      </section>

      {isLoading ? (
        <p className="py-16 text-center text-sm font-bold text-slate-500">Memuat data sparing...</p>
      ) : live.length === 0 && finished.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-bold text-sm">Belum ada sparing yang berlangsung.</p>
          <p className="text-xs text-slate-500">Live score akan tampil di sini saat sparing dimulai.</p>
        </div>
      ) : (
        <>
          {live.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-live-dot" />
                <h2 className="text-xl font-black text-white tracking-tight">Sedang Berlangsung</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  {live.length} Sparing
                </span>
              </div>
              <ScoreboardGrid sparrings={live} />
            </section>
          )}

          {finished.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-black text-white tracking-tight">Hasil Sparing</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {finished.length} Sparing
                </span>
              </div>
              <ScoreboardGrid sparrings={finished} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
