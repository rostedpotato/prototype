'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Swords,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import {
  deleteSparringFromSupabase,
  loadSparringsFromSupabase,
  saveSparringToSupabase,
  subscribeToSparingChanges,
} from '@/lib/supabase/sparingRepository';
import {
  communityRecord,
  getDisplayStatus,
  normalizeMatchStatus,
  statusLabel,
  statusStyle,
} from '@/lib/sparingUtils';
import CommunityEditor from '@/components/sparing/CommunityEditor';
import MatchControlPanel, { type LiveSaveState } from '@/components/sparing/MatchControlPanel';
import PlayerStatsTable from '@/components/sparing/PlayerStatsTable';
import SparringScoreboard from '@/components/sparing/SparringScoreboard';
import StickyScoreBar from '@/components/sparing/StickyScoreBar';
import type { CommunitySlot, Sparring, SparringMatch, SparringPlayer } from '@/types/sparing';

type Notice = { type: 'success' | 'error'; message: string } | null;
type EditorView = 'live' | 'stats' | 'form';

const AUTO_SAVE_DELAY_MS = 1000;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function newPlayer(sparringId: string, community: CommunitySlot): SparringPlayer {
  return {
    id: crypto.randomUUID(),
    sparringId,
    community,
    name: '',
    level: '',
  };
}

function newMatch(sparringId: string, position: number): SparringMatch {
  return {
    id: crypto.randomUUID(),
    sparringId,
    position,
    status: 'PENDING',
    playerA1Id: null,
    playerA2Id: null,
    playerB1Id: null,
    playerB2Id: null,
    scoreA: null,
    scoreB: null,
    createdAt: new Date().toISOString(),
  };
}

function newSparring(): Sparring {
  const id = crypto.randomUUID();
  return {
    id,
    name: '',
    date: today(),
    status: 'DRAFT',
    communityAName: 'Komunitas 1',
    communityBName: 'Komunitas 2',
    players: [newPlayer(id, 'A'), newPlayer(id, 'B')],
    matches: [],
    createdAt: new Date().toISOString(),
  };
}

function validate(sparring: Sparring): string | null {
  if (!sparring.name.trim()) return 'Nama sparing wajib diisi.';
  if (!sparring.communityAName.trim() || !sparring.communityBName.trim()) {
    return 'Nama kedua komunitas wajib diisi.';
  }
  for (const community of ['A', 'B'] as const) {
    const players = sparring.players.filter(
      (player) => player.community === community && player.name.trim()
    );
    if (players.length === 0) {
      return `Komunitas ${community === 'A' ? '1' : '2'} perlu memiliki minimal satu pemain.`;
    }
    const normalizedNames = players.map((player) => player.name.trim().toLowerCase());
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      return `Nama pemain di Komunitas ${community === 'A' ? '1' : '2'} tidak boleh duplikat.`;
    }
  }
  for (const match of sparring.matches) {
    if (match.status === 'PENDING') continue;
    const slotIds = [match.playerA1Id, match.playerA2Id, match.playerB1Id, match.playerB2Id];
    if (slotIds.some((id) => !id)) {
      return 'Match yang sedang/ sudah berjalan perlu empat pemain yang dipilih.';
    }
    if (new Set(slotIds).size !== slotIds.length) {
      return 'Satu pemain tidak boleh dipilih dua kali dalam match yang sama.';
    }
    if (match.status === 'DONE' && (match.scoreA === null || match.scoreB === null)) {
      return 'Match selesai wajib memiliki skor kedua komunitas.';
    }
  }
  return null;
}

export default function SparingManager() {
  const [sparrings, setSparrings] = useState<Sparring[]>([]);
  const [activeSparring, setActiveSparring] = useState<Sparring | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [editorView, setEditorView] = useState<EditorView>('live');
  const hasInitialSelection = useRef(false);
  const isDirtyRef = useRef(false);
  // Ref berikut menjaga auto-save tetap membaca data terbaru tanpa terjebak
  // closure lama, dan mencatat apakah ada edit yang masuk saat penyimpanan berjalan.
  const activeSparringRef = useRef<Sparring | null>(null);
  const revisionRef = useRef(0);
  const isSavingRef = useRef(false);
  const autoSaveTimer = useRef<number | null>(null);

  const refreshSparrings = useCallback(async () => {
    const loaded = await loadSparringsFromSupabase();
    setSparrings(loaded);
    return loaded;
  }, []);

  useEffect(() => {
    activeSparringRef.current = activeSparring;
  }, [activeSparring]);

  // Pilih sparing lain selalu membuka Papan Skor terlebih dahulu.
  useEffect(() => {
    setEditorView('live');
  }, [activeSparring?.id]);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      try {
        const loaded = await refreshSparrings();
        if (active && !hasInitialSelection.current && loaded.length > 0) {
          hasInitialSelection.current = true;
          setActiveSparring(loaded[0]);
        }
      } catch (error) {
        if (active) {
          setNotice({
            type: 'error',
            message: error instanceof Error ? error.message : 'Gagal memuat sparing.',
          });
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void hydrate();
    const unsubscribe = subscribeToSparingChanges(() => {
      void refreshSparrings().then((loaded) => {
        if (isDirtyRef.current) return;
        setActiveSparring((current) => {
          if (!current) return loaded[0] || null;
          return loaded.find((sparring) => sparring.id === current.id) || null;
        });
      });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [refreshSparrings]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current !== null) window.clearTimeout(autoSaveTimer.current);
    };
  }, []);

  const touch = () => {
    revisionRef.current += 1;
    isDirtyRef.current = true;
    setIsDirty(true);
  };

  const saveActive = async (options?: { auto?: boolean }) => {
    const current = activeSparringRef.current;
    if (!current) return;
    const validationError = validate(current);
    if (validationError) {
      if (!options?.auto) setNotice({ type: 'error', message: validationError });
      return;
    }

    const revision = revisionRef.current;
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      await saveSparringToSupabase(current);
      // Hanya bersihkan status "belum disimpan" bila tidak ada edit baru yang
      // masuk selama proses simpan berjalan, agar edit tersebut tidak hilang.
      if (revisionRef.current === revision) {
        isDirtyRef.current = false;
        setIsDirty(false);
      }
      await refreshSparrings();
      if (!options?.auto) {
        setNotice({ type: 'success', message: 'Data sparing tersimpan.' });
      }
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Gagal menyimpan sparing.',
      });
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const scheduleAutoSave = () => {
    if (autoSaveTimer.current !== null) window.clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = window.setTimeout(() => {
      autoSaveTimer.current = null;
      const current = activeSparringRef.current;
      if (!current || getDisplayStatus(current) === 'DRAFT') return;
      if (isSavingRef.current) {
        scheduleAutoSave();
        return;
      }
      void saveActive({ auto: true });
    }, AUTO_SAVE_DELAY_MS);
  };

  const updateActive = (patch: Partial<Sparring>) => {
    touch();
    setActiveSparring((current) => (current ? { ...current, ...patch } : current));
    scheduleAutoSave();
  };

  const updatePlayer = (playerId: string, patch: Partial<SparringPlayer>) => {
    touch();
    setActiveSparring((current) =>
      current
        ? {
            ...current,
            players: current.players.map((player) =>
              player.id === playerId ? { ...player, ...patch } : player
            ),
          }
        : current
    );
    scheduleAutoSave();
  };

  const addPlayer = (community: CommunitySlot) => {
    touch();
    setActiveSparring((current) =>
      current ? { ...current, players: [...current.players, newPlayer(current.id, community)] } : current
    );
  };

  const removePlayer = (playerId: string) => {
    touch();
    setActiveSparring((current) => {
      if (!current) return current;
      return {
        ...current,
        players: current.players.filter((player) => player.id !== playerId),
        matches: current.matches.map((match) =>
          normalizeMatchStatus({
            ...match,
            playerA1Id: match.playerA1Id === playerId ? null : match.playerA1Id,
            playerA2Id: match.playerA2Id === playerId ? null : match.playerA2Id,
            playerB1Id: match.playerB1Id === playerId ? null : match.playerB1Id,
            playerB2Id: match.playerB2Id === playerId ? null : match.playerB2Id,
          })
        ),
      };
    });
    scheduleAutoSave();
  };

  const updateMatch = (matchId: string, patch: Partial<SparringMatch>) => {
    touch();
    setActiveSparring((current) =>
      current
        ? {
            ...current,
            matches: current.matches.map((match) =>
              match.id === matchId ? normalizeMatchStatus({ ...match, ...patch }) : match
            ),
          }
        : current
    );
    scheduleAutoSave();
  };

  const addMatch = () => {
    touch();
    setActiveSparring((current) => {
      if (!current) return current;
      const nextPosition =
        current.matches.reduce((max, match) => Math.max(max, match.position), 0) + 1;
      return { ...current, matches: [...current.matches, newMatch(current.id, nextPosition)] };
    });
    scheduleAutoSave();
  };

  const removeMatch = (matchId: string) => {
    if (!confirm('Hapus match ini?')) return;
    touch();
    setActiveSparring((current) =>
      current ? { ...current, matches: current.matches.filter((match) => match.id !== matchId) } : current
    );
    scheduleAutoSave();
  };

  const deleteActive = async () => {
    if (!activeSparring || !confirm(`Hapus sparing "${activeSparring.name || 'baru'}"?`)) return;
    setIsSaving(true);
    try {
      await deleteSparringFromSupabase(activeSparring.id);
      const loaded = await refreshSparrings();
      setActiveSparring(loaded[0] || null);
      isDirtyRef.current = false;
      setIsDirty(false);
      setNotice({ type: 'success', message: 'Sparing berhasil dihapus.' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Gagal menghapus sparing.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const derivedStatus = activeSparring ? getDisplayStatus(activeSparring) : 'DRAFT';
  const liveSaveState: LiveSaveState = isSaving ? 'saving' : isDirty ? 'pending' : 'synced';

  return (
    <div className="space-y-6 pb-20">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Users className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-bold text-cyan-300 tracking-wide">SPARING MANAGER</p>
              <h1 className="mt-1 text-2xl font-black text-white">Sparing Antar Komunitas</h1>
              <p className="mt-1 text-sm text-slate-400">
                Daftarkan pemain dua komunitas, buat match double, dan catat skornya.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveSparring(newSparring());
              isDirtyRef.current = true;
              setIsDirty(true);
              setNotice(null);
            }}
            className="rounded-xl bg-lime-500 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-lime-500/20 hover:bg-lime-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Buat Sparing Baru
          </button>
        </div>
      </section>

      {notice && (
        <div className={`rounded-2xl border p-4 text-sm font-bold flex gap-3 items-start ${notice.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
          {notice.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{notice.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[20rem_minmax(0,1fr)] gap-6">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 h-fit">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-black text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Daftar Sparing</h2>
            <button type="button" onClick={() => void refreshSparrings()} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white" title="Muat ulang">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {isLoading ? (
            <p className="py-8 text-center text-xs font-bold text-slate-500">Memuat data sparing...</p>
          ) : sparrings.length === 0 ? (
            <p className="py-8 text-center text-xs leading-relaxed text-slate-500">Belum ada sparing. Buat sparing pertama Anda.</p>
          ) : (
            <div className="space-y-2">
              {sparrings.map((sparring) => {
                const recordA = communityRecord(sparring, 'A');
                const recordB = communityRecord(sparring, 'B');
                const status = getDisplayStatus(sparring);
                const selected = activeSparring?.id === sparring.id;
                return (
                  <button
                    key={sparring.id}
                    type="button"
                    onClick={() => {
                      isDirtyRef.current = false;
                      setIsDirty(false);
                      setActiveSparring(sparring);
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${selected ? 'border-lime-400/60 bg-lime-500/10' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'}`}
                  >
                    <div className="flex justify-between gap-2 items-start">
                      <span className="font-extrabold text-sm text-white">{sparring.name || 'Sparing baru'}</span>
                      <span className={`shrink-0 text-[9px] font-black border px-1.5 py-0.5 rounded ${statusStyle(status)}`}>{statusLabel(status)}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {sparring.communityAName || 'Komunitas 1'} {recordA.won} — {recordB.won} {sparring.communityBName || 'Komunitas 2'}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">{sparring.date}</p>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {activeSparring ? (
          <div className="space-y-6">
            <section className={`rounded-2xl border bg-slate-900/70 p-5 sm:p-6 ${derivedStatus === 'LIVE' ? 'border-red-500/40' : 'border-slate-800'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500">DETAIL SPARING</p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-white">{activeSparring.name || 'Sparing Baru'}</h2>
                    {isDirty && (
                      <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        BELUM DISIMPAN
                      </span>
                    )}
                  </div>
                </div>
                <span className={`w-fit text-[10px] font-black border px-2.5 py-1 rounded-full ${statusStyle(derivedStatus)}`}>
                  {statusLabel(derivedStatus)}
                </span>
              </div>
              <div className="mt-5 grid sm:grid-cols-[minmax(0,1fr)_12rem] gap-3">
                <label className="text-xs font-bold text-slate-300">Nama sparing
                  <input value={activeSparring.name} onChange={(event) => updateActive({ name: event.target.value })} placeholder="Contoh: Sparing Mingguan September" className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400" />
                </label>
                <label className="text-xs font-bold text-slate-300">Tanggal
                  <input type="date" value={activeSparring.date} onChange={(event) => updateActive({ date: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400" />
                </label>
              </div>
              <p className="mt-3 text-[11px] font-bold text-slate-500">
                Status sesi mengikuti match: berlangsung saat ada match ONGOING, selesai setelah match dituntaskan.
              </p>
            </section>

            {derivedStatus === 'LIVE' && (
              <div className="sticky top-20 z-30">
                <StickyScoreBar sparring={activeSparring} />
              </div>
            )}

            <div className="flex gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/70 p-1.5">
              {([
                ['live', 'Papan Skor & Match', Swords],
                ['stats', 'Statistik Pemain', BarChart3],
                ['form', 'Edit Lengkap', Pencil],
              ] as const).map(([view, label, Icon]) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setEditorView(view)}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${editorView === view ? 'bg-lime-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {editorView === 'live' && (
              <>
                <SparringScoreboard sparring={activeSparring} />
                <MatchControlPanel
                  sparring={activeSparring}
                  saveState={liveSaveState}
                  onUpdateMatch={updateMatch}
                  onAddMatch={addMatch}
                  onRemoveMatch={removeMatch}
                />
              </>
            )}

            {editorView === 'stats' && <PlayerStatsTable sparring={activeSparring} />}

            {editorView === 'form' && (
              <div className="grid lg:grid-cols-2 gap-5">
                <CommunityEditor
                  community="A"
                  name={activeSparring.communityAName}
                  players={activeSparring.players.filter((player) => player.community === 'A')}
                  onNameChange={(communityAName) => updateActive({ communityAName })}
                  onAddPlayer={() => addPlayer('A')}
                  onUpdatePlayer={updatePlayer}
                  onRemovePlayer={removePlayer}
                />
                <CommunityEditor
                  community="B"
                  name={activeSparring.communityBName}
                  players={activeSparring.players.filter((player) => player.community === 'B')}
                  onNameChange={(communityBName) => updateActive({ communityBName })}
                  onAddPlayer={() => addPlayer('B')}
                  onUpdatePlayer={updatePlayer}
                  onRemovePlayer={removePlayer}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 border-t border-slate-800 pt-2">
              <button type="button" onClick={() => void deleteActive()} disabled={isSaving} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Hapus Sparing</button>
              <button type="button" onClick={() => void saveActive()} disabled={isSaving} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 min-h-72 flex items-center justify-center p-8 text-center">
            <div><Users className="w-9 h-9 text-slate-600 mx-auto" /><p className="mt-3 font-bold text-slate-400">Pilih atau buat sparing untuk mulai mengelola data.</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
