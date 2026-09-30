'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Database,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Trophy,
} from 'lucide-react';
import {
  deleteTemplateFromSupabase,
  loadTemplatesFromSupabase,
  saveTemplateToSupabase,
} from '@/lib/supabase/tournamentTemplateRepository';
import { getCategoryLabel } from '@/lib/bracketGenerator';
import { useAdminAuth } from '@/lib/authStore';
import type {
  SportType,
  TournamentCategory,
  TournamentFormat,
  TournamentRules,
  TournamentTemplate,
} from '@/types/tournament';

const FORMAT_LABEL: Record<TournamentFormat, string> = {
  KNOCKOUT: 'Bagan Gugur Langsung',
  TWO_STAGE: 'Two Stage — 4 Grup + 2 Bagan',
  TWO_STAGE_PADEL_CUSTOM: 'Two Stage Padel Custom',
};

const CATEGORY_LABEL: Record<TournamentCategory, string> = {
  MEN_SINGLES: 'Tunggal Putra',
  WOMEN_SINGLES: 'Tunggal Putri',
  MEN_DOUBLES: 'Ganda Putra',
  WOMEN_DOUBLES: 'Ganda Putri',
  MIXED_DOUBLES: 'Ganda Campuran',
  OPEN_DOUBLES: 'Ganda Open',
};

function emptyRules(sport: SportType): TournamentRules {
  return sport === 'PADEL'
    ? { pointsPerSet: 6, maxSets: 3, deuceMargin: 2 }
    : { pointsPerSet: 21, maxSets: 3, deuceMargin: 2, maxPointCap: 30 };
}

function rulesSummary(rules: TournamentRules, format: TournamentFormat): string {
  if (format === 'TWO_STAGE_PADEL_CUSTOM') {
    return `Custom padel: Grup/QF first to 3 set · SF 4 · Final 6 (set ${rules.pointsPerSet} game)`;
  }
  const bestOf = rules.maxSets;
  const setsToWin = Math.ceil(bestOf / 2);
  return `${rules.pointsPerSet} poin/set · Best of ${bestOf} (first to ${setsToWin})${
    rules.maxPointCap ? ` · cap ${rules.maxPointCap}` : ''
  }`;
}

interface FormState {
  id: string | null;
  name: string;
  description: string;
  sport: SportType;
  format: TournamentFormat;
  category: TournamentCategory;
  rules: TournamentRules;
  participantCount: string;
  courtsText: string;
  groupScheduleScheme: '' | 'SPLIT_WAVE' | 'ROLLING_ROUND';
  scheduleStartTime: string;
  slotDurationMinutes: string;
  isBuiltin: boolean;
}

function stateFromTemplate(template: TournamentTemplate): FormState {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    sport: template.sport,
    format: template.format,
    category: template.category,
    rules: { ...template.rules },
    participantCount: template.participantCount ? String(template.participantCount) : '',
    courtsText: template.courts.join(', '),
    groupScheduleScheme: template.groupScheduleScheme || '',
    scheduleStartTime: template.scheduleStartTime,
    slotDurationMinutes: String(template.slotDurationMinutes),
    isBuiltin: template.isBuiltin,
  };
}

function blankForm(): FormState {
  return {
    id: null,
    name: '',
    description: '',
    sport: 'BADMINTON',
    format: 'KNOCKOUT',
    category: 'MEN_DOUBLES',
    rules: emptyRules('BADMINTON'),
    participantCount: '',
    courtsText: 'Court 1, Court 2, Court 3',
    groupScheduleScheme: '',
    scheduleStartTime: '08:00 WIB',
    slotDurationMinutes: '45',
    isBuiltin: false,
  };
}

function TemplateForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: FormState;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (updates: Partial<FormState>) => setForm((current) => ({ ...current, ...updates }));
  const patchRules = (updates: Partial<TournamentRules>) =>
    setForm((current) => ({ ...current, rules: { ...current.rules, ...updates } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Nama template wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const courts = form.courtsText
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      await saveTemplateToSupabase({
        id: form.id || crypto.randomUUID(),
        name: form.name,
        description: form.description,
        sport: form.sport,
        format: form.format,
        category: form.category,
        rules: {
          ...form.rules,
          // Format padel custom selalu memakai skoring per-fase.
          customPadelScoring: form.format === 'TWO_STAGE_PADEL_CUSTOM' ? true : undefined,
          maxPointCap: form.sport === 'BADMINTON' ? form.rules.maxPointCap : undefined,
        },
        participantCount: form.participantCount ? Number.parseInt(form.participantCount, 10) : null,
        courts: courts.length > 0 ? courts : ['Court 1', 'Court 2'],
        groupScheduleScheme:
          form.format !== 'KNOCKOUT' && form.groupScheduleScheme
            ? (form.groupScheduleScheme as 'SPLIT_WAVE' | 'ROLLING_ROUND')
            : null,
        scheduleStartTime: form.scheduleStartTime,
        slotDurationMinutes: Number.parseInt(form.slotDurationMinutes, 10) || 45,
        isBuiltin: form.isBuiltin,
        createdAt: new Date().toISOString(),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan template.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-300 block mb-1">Nama Template *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Contoh: Liga Padel Sabtu Malam — Best of 3"
            className={inputClass}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-300 block mb-1">Deskripsi</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="Aturan singkat template ini..."
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Cabang Olahraga</label>
          <select
            value={form.sport}
            onChange={(e) => {
              const sport = e.target.value as SportType;
              patch({ sport, rules: { ...emptyRules(sport), maxSets: form.rules.maxSets, deuceMargin: form.rules.deuceMargin } });
            }}
            className={inputClass}
          >
            <option value="BADMINTON">🏸 Bulutangkis / Badminton</option>
            <option value="PADEL">🎾 Padel Tennis</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Format Turnamen</label>
          <select
            value={form.format}
            onChange={(e) => patch({ format: e.target.value as TournamentFormat })}
            className={inputClass}
          >
            <option value="KNOCKOUT">Bagan Gugur Langsung</option>
            <option value="TWO_STAGE">Two Stage — 4 Grup + 2 Bagan</option>
            <option value="TWO_STAGE_PADEL_CUSTOM">Two Stage Padel Custom</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Kategori</label>
          <select
            value={form.category}
            onChange={(e) => patch({ category: e.target.value as TournamentCategory })}
            className={inputClass}
          >
            <option value="MEN_DOUBLES">Ganda Putra</option>
            <option value="WOMEN_DOUBLES">Ganda Putri</option>
            <option value="MIXED_DOUBLES">Ganda Campuran</option>
            <option value="OPEN_DOUBLES">Ganda Open</option>
            <option value="MEN_SINGLES">Tunggal Putra</option>
            <option value="WOMEN_SINGLES">Tunggal Putri</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">
            Target Jumlah Peserta (opsional)
          </label>
          <input
            type="number"
            min="2"
            value={form.participantCount}
            onChange={(e) => patch({ participantCount: e.target.value })}
            placeholder="Contoh: 16"
            className={inputClass}
          />
        </div>
      </div>

      {/* Aturan skoring */}
      <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> Aturan Skoring
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="text-[10px] font-bold text-slate-400">
            Poin / Set
            <input
              type="number"
              min="1"
              value={form.rules.pointsPerSet}
              onChange={(e) => patchRules({ pointsPerSet: Number.parseInt(e.target.value, 10) || 1 })}
              className={inputClass}
            />
          </label>
          <label className="text-[10px] font-bold text-slate-400">
            Max Set (Best of N)
            <select
              value={form.rules.maxSets}
              onChange={(e) => patchRules({ maxSets: Number.parseInt(e.target.value, 10) || 3 })}
              className={inputClass}
            >
              <option value="1">1 (First to 1)</option>
              <option value="3">3 (Best of 3)</option>
              <option value="5">5 (Best of 5)</option>
              <option value="7">7 (Best of 7)</option>
            </select>
          </label>
          <label className="text-[10px] font-bold text-slate-400">
            Margin Deuce
            <input
              type="number"
              min="0"
              value={form.rules.deuceMargin}
              onChange={(e) => patchRules({ deuceMargin: Number.parseInt(e.target.value, 10) || 0 })}
              className={inputClass}
            />
          </label>
          {form.sport === 'BADMINTON' && (
            <label className="text-[10px] font-bold text-slate-400">
              Cap Poin Maks
              <input
                type="number"
                min="0"
                value={form.rules.maxPointCap ?? ''}
                onChange={(e) =>
                  patchRules({
                    maxPointCap: e.target.value ? Number.parseInt(e.target.value, 10) : undefined,
                  })
                }
                className={inputClass}
              />
            </label>
          )}
        </div>
        {form.format === 'TWO_STAGE_PADEL_CUSTOM' && (
          <p className="text-[11px] font-bold text-purple-300">
            Skoring padel custom aktif: Grup/QF first to 3 set · Semifinal first to 4 · Final first to 6
            (set {form.rules.pointsPerSet} game, margin deuce {form.rules.deuceMargin}).
          </p>
        )}
      </div>

      {/* Lapangan & jadwal */}
      <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" /> Lapangan & Jadwal Slot
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-[10px] font-bold text-slate-400 sm:col-span-2">
            Daftar Lapangan (pisahkan dengan koma)
            <input
              type="text"
              value={form.courtsText}
              onChange={(e) => patch({ courtsText: e.target.value })}
              placeholder="Court 1, Court 2, Court 3, Court 4"
              className={inputClass}
            />
          </label>
          {form.format !== 'KNOCKOUT' && (
            <label className="text-[10px] font-bold text-slate-400">
              Skema Jadwal Grup
              <select
                value={form.groupScheduleScheme}
                onChange={(e) => patch({ groupScheduleScheme: e.target.value as FormState['groupScheduleScheme'] })}
                className={inputClass}
              >
                <option value="">Ikut default aplikasi (SPLIT_WAVE)</option>
                <option value="SPLIT_WAVE">2 Gelombang (SPLIT_WAVE)</option>
                <option value="ROLLING_ROUND">Putaran Bergulir (ROLLING_ROUND)</option>
              </select>
            </label>
          )}
          <label className="text-[10px] font-bold text-slate-400">
            Jam Mulai Slot Pertama
            <input
              type="text"
              value={form.scheduleStartTime}
              onChange={(e) => patch({ scheduleStartTime: e.target.value })}
              placeholder="08:00 WIB"
              className={inputClass}
            />
          </label>
          <label className="text-[10px] font-bold text-slate-400">
            Durasi Slot (menit)
            <input
              type="number"
              min="5"
              value={form.slotDurationMinutes}
              onChange={(e) => patch({ slotDurationMinutes: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-black shadow-lg shadow-lime-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
          Simpan Template
        </button>
      </div>
    </form>
  );
}

export default function TournamentTemplatesPage() {
  const router = useRouter();
  const { isAdmin, isReady } = useAdminAuth();
  const [templates, setTemplates] = useState<TournamentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const loaded = await loadTemplatesFromSupabase();
      setTemplates(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat template.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isReady && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, isReady, router]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const hydrate = async () => {
      try {
        const loaded = await loadTemplatesFromSupabase();
        if (active) setTemplates(loaded);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Gagal memuat template.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const handleDelete = async (template: TournamentTemplate) => {
    if (!confirm(`Hapus template "${template.name}"?`)) return;
    try {
      await deleteTemplateFromSupabase(template.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus template.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard Admin
        </Link>
        {!editing && (
          <button
            onClick={() => setEditing(blankForm())}
            className="rounded-xl bg-lime-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-lime-400 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Buat Template
          </button>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {editing ? (
          <>
            <div className="space-y-1 border-b border-slate-800 pb-5">
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-lime-400" />
                {editing.id ? 'Edit Template' : 'Template Baru'}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Aturan di sini akan menjadi pengaturan awal setiap turnamen yang memakai template ini.
              </p>
            </div>
            <TemplateForm
              initial={editing}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                void refresh();
              }}
            />
          </>
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-lime-400" />
                Template Turnamen
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Kelola aturan baku (format, skoring, peserta, lapangan) yang dipakai saat membuat turnamen baru.
              </p>
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-300">
                {error}
              </p>
            )}

            {isLoading ? (
              <p className="py-10 text-center text-sm font-bold text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat template...
              </p>
            ) : templates.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Belum ada template. Jalankan migration 0008 untuk template bawaan, atau buat template baru.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-sm font-black text-white leading-snug">{template.name}</h2>
                      {template.isBuiltin && (
                        <span className="shrink-0 flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          <Shield className="w-3 h-3" /> Bawaan
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                        {template.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {template.sport === 'PADEL' ? '🎾 Padel' : '🏸 Badminton'}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {FORMAT_LABEL[template.format]}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {CATEGORY_LABEL[template.category] || getCategoryLabel(template.category)}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-lime-300">{rulesSummary(template.rules, template.format)}</p>
                    <p className="text-[10px] text-slate-500">
                      {template.participantCount ? `${template.participantCount} pasangan · ` : ''}
                      {template.courts.length} lapangan · slot {template.slotDurationMinutes} menit ({template.scheduleStartTime})
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setEditing(stateFromTemplate(template))}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      {!template.isBuiltin && (
                        <button
                          onClick={() => void handleDelete(template)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
