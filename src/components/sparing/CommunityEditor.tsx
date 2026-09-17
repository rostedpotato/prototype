'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { CommunitySlot, SparringPlayer } from '@/types/sparing';

export default function CommunityEditor({
  community,
  name,
  players,
  onNameChange,
  onAddPlayer,
  onUpdatePlayer,
  onRemovePlayer,
}: {
  community: CommunitySlot;
  name: string;
  players: SparringPlayer[];
  onNameChange: (name: string) => void;
  onAddPlayer: () => void;
  onUpdatePlayer: (playerId: string, patch: Partial<SparringPlayer>) => void;
  onRemovePlayer: (playerId: string) => void;
}) {
  const accentClasses =
    community === 'A'
      ? 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300'
      : 'border-violet-500/30 bg-violet-500/5 text-violet-300';

  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${accentClasses}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-xs font-black tracking-wide">KOMUNITAS {community === 'A' ? '1' : '2'}</span>
        <span className="text-[11px] font-bold opacity-80">{players.length} pemain</span>
      </div>

      <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Nama komunitas</label>
      <input
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder={`Nama Komunitas ${community === 'A' ? '1' : '2'}`}
        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-lime-400"
      />

      <div className="mt-5 space-y-3">
        {players.map((player, index) => (
          <div key={player.id} className="rounded-xl border border-slate-700/80 bg-slate-950/55 p-3">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <span className="text-[11px] font-bold text-slate-400">PEMAIN {index + 1}</span>
              <button
                type="button"
                onClick={() => onRemovePlayer(player.id)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/15 hover:text-red-400 transition-colors"
                title="Hapus pemain"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={player.name}
                onChange={(event) => onUpdatePlayer(player.id, { name: event.target.value })}
                placeholder="Nama pemain"
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-white outline-none focus:border-lime-400"
              />
              <input
                value={player.level}
                onChange={(event) => onUpdatePlayer(player.id, { level: event.target.value })}
                placeholder="Level, contoh: Intermediate"
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-white outline-none focus:border-lime-400"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddPlayer}
        className="mt-3 w-full rounded-xl border border-dashed border-slate-600 px-3 py-2.5 text-xs font-bold text-slate-300 hover:border-lime-400 hover:text-lime-300 transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Tambah pemain
      </button>
    </section>
  );
}
