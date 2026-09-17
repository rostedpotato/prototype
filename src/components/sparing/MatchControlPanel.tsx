'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Pencil, Plus, Swords, Trash2, X } from 'lucide-react';
import type { CommunitySlot, Sparring, SparringMatch, SparringPlayer } from '@/types/sparing';
import { matchStatusLabel, matchWinnerSlot, sortMatches } from '@/lib/sparingUtils';

export type LiveSaveState = 'saving' | 'pending' | 'synced';

function SaveStateChip({ state }: { state: LiveSaveState }) {
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-300">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
      </span>
    );
  }
  if (state === 'pending') {
    return <span className="text-[10px] font-bold text-amber-300">Perubahan menunggu auto-save</span>;
  }
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300">
      <CheckCircle2 className="w-3.5 h-3.5" /> Data tersinkron
    </span>
  );
}

const SLOT_DEFS = [
  { key: 'playerA1Id', community: 'A' as CommunitySlot, label: 'Pemain 1' },
  { key: 'playerA2Id', community: 'A' as CommunitySlot, label: 'Pemain 2' },
  { key: 'playerB1Id', community: 'B' as CommunitySlot, label: 'Pemain 1' },
  { key: 'playerB2Id', community: 'B' as CommunitySlot, label: 'Pemain 2' },
] as const;

type SlotKey = (typeof SLOT_DEFS)[number]['key'];

function MatchStatusChip({ status }: { status: SparringMatch['status'] }) {
  if (status === 'ONGOING') {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/40 px-2 py-0.5 text-[10px] font-black text-red-300">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-live-dot" />
        {matchStatusLabel(status)}
      </span>
    );
  }
  if (status === 'DONE') {
    return (
      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-300">
        {matchStatusLabel(status)}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-400">
      {matchStatusLabel(status)}
    </span>
  );
}

function PlayerSelect({
  value,
  roster,
  excludedId,
  disabled,
  accent,
  onChange,
}: {
  value: string | null;
  roster: SparringPlayer[];
  excludedId: string | null;
  disabled: boolean;
  accent: string;
  onChange: (playerId: string | null) => void;
}) {
  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value || null)}
      className={`w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs font-bold text-white outline-none focus:border-lime-400 disabled:opacity-50 ${accent}`}
    >
      <option value="">{roster.length === 0 ? 'Belum ada pemain' : '— Pilih pemain —'}</option>
      {roster
        .filter((player) => player.id !== excludedId)
        .map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
            {player.level ? ` · ${player.level}` : ''}
          </option>
        ))}
    </select>
  );
}

function MatchCard({
  match,
  matchNo,
  sparring,
  onUpdate,
  onRemove,
}: {
  match: SparringMatch;
  matchNo: number;
  sparring: Sparring;
  onUpdate: (matchId: string, patch: Partial<SparringMatch>) => void;
  onRemove: (matchId: string) => void;
}) {
  const [scoreDraft, setScoreDraft] = useState({ a: '', b: '' });
  const [isEditingScore, setIsEditingScore] = useState(false);

  const roster = (community: CommunitySlot) =>
    sparring.players.filter((player) => player.community === community && player.name.trim());
  const communityName = (community: CommunitySlot) =>
    community === 'A' ? sparring.communityAName : sparring.communityBName;

  const parseScore = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };

  const draftA = parseScore(scoreDraft.a);
  const draftB = parseScore(scoreDraft.b);
  const canFinish = match.status === 'ONGOING' && draftA !== null && draftB !== null;
  const winner = matchWinnerSlot(match);
  const winnerName =
    winner === 'A' ? sparring.communityAName : winner === 'B' ? sparring.communityBName : null;

  const startEditScore = () => {
    setScoreDraft({
      a: match.scoreA === null ? '' : String(match.scoreA),
      b: match.scoreB === null ? '' : String(match.scoreB),
    });
    setIsEditingScore(true);
  };

  const commitScore = () => {
    if (draftA === null || draftB === null) return;
    onUpdate(match.id, { scoreA: draftA, scoreB: draftB });
    setIsEditingScore(false);
  };

  const finishMatch = () => {
    if (draftA === null || draftB === null) return;
    onUpdate(match.id, { status: 'DONE', scoreA: draftA, scoreB: draftB });
    setScoreDraft({ a: '', b: '' });
  };

  const selectAccent = (community: CommunitySlot) =>
    community === 'A' ? 'text-cyan-300' : 'text-violet-300';

  return (
    <div
      className={`rounded-xl border p-3 sm:p-4 ${
        match.status === 'ONGOING'
          ? 'border-red-500/40 bg-red-500/5'
          : 'border-slate-800 bg-slate-950/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-white">MATCH {matchNo}</span>
          <MatchStatusChip status={match.status} />
        </div>
        <button
          type="button"
          onClick={() => onRemove(match.id)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/15 hover:text-red-400 transition-colors"
          title="Hapus match"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {(['A', 'B'] as const).map((community) => (
          <div key={community}>
            <p className={`text-[10px] font-black tracking-wide mb-1.5 truncate ${selectAccent(community)}`}>
              {communityName(community) || `KOMUNITAS ${community === 'A' ? '1' : '2'}`}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SLOT_DEFS.filter((slot) => slot.community === community).map((slot) => (
                <label key={slot.key} className="text-[9px] font-bold text-slate-500">
                  {slot.label}
                  <PlayerSelect
                    value={match[slot.key]}
                    roster={roster(community)}
                    excludedId={
                      slot.key === 'playerA1Id'
                        ? match.playerA2Id
                        : slot.key === 'playerA2Id'
                        ? match.playerA1Id
                        : slot.key === 'playerB1Id'
                        ? match.playerB2Id
                        : match.playerB1Id
                    }
                    disabled={match.status === 'DONE'}
                    accent=""
                    onChange={(playerId) => onUpdate(match.id, { [slot.key]: playerId })}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {match.status === 'PENDING' && (
        <p className="mt-3 text-[11px] font-bold text-slate-500">
          Pilih 4 pemain (2 dari tiap komunitas) — match otomatis berlangsung setelah lengkap.
        </p>
      )}

      {match.status === 'ONGOING' && (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-2">
              <label className="text-[9px] font-bold text-slate-500">
                SKOR {sparring.communityAName || 'A'}
                <input
                  type="number"
                  min="0"
                  value={scoreDraft.a}
                  onChange={(event) => setScoreDraft((current) => ({ ...current, a: event.target.value }))}
                  className="mt-1 w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 font-score text-lg text-white outline-none focus:border-lime-400"
                />
              </label>
              <span className="pb-2.5 font-black text-slate-500">:</span>
              <label className="text-[9px] font-bold text-slate-500">
                SKOR {sparring.communityBName || 'B'}
                <input
                  type="number"
                  min="0"
                  value={scoreDraft.b}
                  onChange={(event) => setScoreDraft((current) => ({ ...current, b: event.target.value }))}
                  className="mt-1 w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 font-score text-lg text-white outline-none focus:border-lime-400"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={finishMatch}
              disabled={!canFinish}
              className="rounded-xl bg-lime-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-lime-400 disabled:opacity-40 transition-colors flex items-center gap-1.5"
              title={canFinish ? 'Selesaikan match' : 'Isi kedua skor terlebih dahulu'}
            >
              <CheckCircle2 className="w-4 h-4" /> Selesaikan Match
            </button>
          </div>
          {!canFinish && (
            <p className="mt-2 text-[10px] font-bold text-slate-500">
              Match selesai wajib memiliki skor kedua komunitas.
            </p>
          )}
        </div>
      )}

      {match.status === 'DONE' && !isEditingScore && (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-score text-2xl text-white">
              <span className={winner === 'A' ? 'text-lime-300' : ''}>{match.scoreA}</span>
              <span className="mx-1.5 text-slate-500">:</span>
              <span className={winner === 'B' ? 'text-lime-300' : ''}>{match.scoreB}</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {winnerName ? `Dipenangkan ${winnerName}` : 'Skor imbang'}
            </span>
          </div>
          <button
            type="button"
            onClick={startEditScore}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Skor
          </button>
        </div>
      )}

      {match.status === 'DONE' && isEditingScore && (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-2">
              <label className="text-[9px] font-bold text-slate-500">
                SKOR {sparring.communityAName || 'A'}
                <input
                  type="number"
                  min="0"
                  value={scoreDraft.a}
                  onChange={(event) => setScoreDraft((current) => ({ ...current, a: event.target.value }))}
                  className="mt-1 w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 font-score text-lg text-white outline-none focus:border-lime-400"
                />
              </label>
              <span className="pb-2.5 font-black text-slate-500">:</span>
              <label className="text-[9px] font-bold text-slate-500">
                SKOR {sparring.communityBName || 'B'}
                <input
                  type="number"
                  min="0"
                  value={scoreDraft.b}
                  onChange={(event) => setScoreDraft((current) => ({ ...current, b: event.target.value }))}
                  className="mt-1 w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 font-score text-lg text-white outline-none focus:border-lime-400"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditingScore(false)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Batal
              </button>
              <button
                type="button"
                onClick={commitScore}
                disabled={draftA === null || draftB === null}
                className="rounded-xl bg-lime-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-lime-400 disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Simpan Skor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchControlPanel({
  sparring,
  saveState,
  onUpdateMatch,
  onAddMatch,
  onRemoveMatch,
}: {
  sparring: Sparring;
  saveState: LiveSaveState;
  onUpdateMatch: (matchId: string, patch: Partial<SparringMatch>) => void;
  onAddMatch: () => void;
  onRemoveMatch: (matchId: string) => void;
}) {
  const matches = sortMatches(sparring.matches);
  const canFieldPair = (community: CommunitySlot) =>
    sparring.players.filter((player) => player.community === community && player.name.trim()).length >= 2;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-black text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-lime-400" /> Papan Skor & Match
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Pilih 2 pemain dari tiap komunitas untuk membuat match double. Skor diisi saat match selesai.
          </p>
        </div>
        <SaveStateChip state={saveState} />
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
          <p className="text-xs font-bold text-slate-400">Belum ada match.</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Tambahkan match, lalu pilih 2 pemain dari tiap komunitas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match, index) => (
            <MatchCard
              key={match.id}
              match={match}
              matchNo={index + 1}
              sparring={sparring}
              onUpdate={onUpdateMatch}
              onRemove={onRemoveMatch}
            />
          ))}
        </div>
      )}

      {(!canFieldPair('A') || !canFieldPair('B')) && (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] font-bold text-amber-300">
          Tiap komunitas perlu minimal 2 pemain terdaftar untuk membuat match double. Tambahkan lewat tab
          Edit Lengkap.
        </p>
      )}

      <button
        type="button"
        onClick={onAddMatch}
        className="mt-4 w-full rounded-xl border border-dashed border-slate-600 px-3 py-3 text-xs font-bold text-slate-300 hover:border-lime-400 hover:text-lime-300 transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Tambah Match
      </button>
    </section>
  );
}
