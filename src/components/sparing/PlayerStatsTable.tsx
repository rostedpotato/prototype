'use client';

import { BarChart3 } from 'lucide-react';
import type { CommunitySlot, Sparring } from '@/types/sparing';
import { getPlayerStatRows, sortMatches } from '@/lib/sparingUtils';

function CommunityStatsTable({ sparring, community }: { sparring: Sparring; community: CommunitySlot }) {
  const matches = sortMatches(sparring.matches);
  const rows = getPlayerStatRows(sparring, community);
  const communityName =
    community === 'A' ? sparring.communityAName : sparring.communityBName;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 sm:p-4 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3
          className={`text-sm font-black truncate ${
            community === 'A' ? 'text-cyan-300' : 'text-violet-300'
          }`}
        >
          {communityName || `Komunitas ${community === 'A' ? '1' : '2'}`}
        </h3>
        <span className="shrink-0 text-[10px] font-bold text-slate-500">{rows.length} pemain</span>
      </div>

      {rows.length === 0 ? (
        <p className="py-4 text-center text-xs font-bold text-slate-500">Belum ada pemain terdaftar.</p>
      ) : matches.length === 0 ? (
        <p className="py-4 text-center text-xs font-bold text-slate-500">Belum ada match yang dibuat.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80">
                <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500 whitespace-nowrap">
                  Nama Pemain
                </th>
                {matches.map((match, index) => (
                  <th
                    key={match.id}
                    className="px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500 text-center whitespace-nowrap"
                  >
                    {match.status === 'ONGOING' && (
                      <span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-live-dot align-middle" />
                    )}
                    Match {index + 1}
                  </th>
                ))}
                <th className="sticky right-0 bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-emerald-400/80 text-center whitespace-nowrap border-l border-slate-800">
                  Menang
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.player.id} className="border-t border-slate-800">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-xs font-extrabold text-white">{row.player.name}</span>
                    {row.player.level && (
                      <span className="ml-1.5 text-[9px] font-bold uppercase text-slate-500">
                        {row.player.level}
                      </span>
                    )}
                  </td>
                  {row.cells.map((cell) => (
                    <td key={cell.match.id} className="px-3 py-2 text-center">
                      {!cell.inMatch ? (
                        <span className="text-xs text-slate-600">—</span>
                      ) : cell.match.status !== 'DONE' ? (
                        <span className="text-xs text-slate-500">·</span>
                      ) : (
                        <span
                          className={`font-score text-sm ${
                            cell.won ? 'font-black text-lime-300' : 'text-slate-300'
                          }`}
                        >
                          {cell.score}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="sticky right-0 bg-slate-950 px-3 py-2 text-center border-l border-slate-800">
                    <span className="font-score text-sm font-black text-emerald-300">{row.wins}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PlayerStatsTable({ sparring }: { sparring: Sparring }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="font-black text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-lime-400" /> Statistik Pemain
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Skor tiap match per pemain (sisi komunitasnya) dan jumlah kemenangan. Tabel dipisah per komunitas.
        </p>
      </div>
      <div className="grid xl:grid-cols-2 gap-4">
        <CommunityStatsTable sparring={sparring} community="A" />
        <CommunityStatsTable sparring={sparring} community="B" />
      </div>
    </section>
  );
}
