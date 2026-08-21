'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTournaments } from '@/lib/tournamentStore';
import { useAdminAuth } from '@/lib/authStore';
import {
  Shield,
  Plus,
  Trophy,
  Calendar,
  MapPin,
  Users,
  SlidersHorizontal,
  Trash2,
  ExternalLink,
  Lock,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin, isReady } = useAdminAuth();
  const { tournaments, service } = useTournaments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isReady && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, isReady, router]);

  if (!isReady || !isAdmin) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Lock className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
          <p className="text-xs text-slate-400 font-bold">Memeriksa hak akses admin...</p>
        </div>
      </div>
    );
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus turnamen "${name}"?`)) {
      service.delete(id);
    }
  };

  const handleExportJSON = () => {
    try {
      const jsonStr = service.exportData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      a.href = url;
      a.download = `racket_arena_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotice({ type: 'success', message: 'File backup JSON berhasil diunduh!' });
      setTimeout(() => setNotice(null), 4000);
    } catch {
      setNotice({ type: 'error', message: 'Gagal mengekspor data backup.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      if (confirm('Import file ini akan menimpa/memperbarui data turnamen lokal Anda. Lanjutkan?')) {
        const result = service.importData(content);
        if (result.success) {
          setNotice({
            type: 'success',
            message: `Berhasil memulihkan ${result.count} turnamen dari file backup!`,
          });
        } else {
          setNotice({
            type: 'error',
            message: `Gagal memulihkan data: ${result.error}`,
          });
        }
        setTimeout(() => setNotice(null), 5000);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Admin Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
            <Shield className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">Admin Dashboard</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PRO PANEL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Kelola turnamen, atur bagan pertandingan, dan update skor secara langsung.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Export JSON Button */}
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Download file backup semua turnamen (format .json)"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Backup Data JSON</span>
          </button>

          {/* Import JSON Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Pulihkan data turnamen dari file backup .json"
          >
            <Upload className="w-4 h-4 text-lime-400" />
            <span>Restore / Import JSON</span>
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <Link
            href="/admin/tournament/new"
            className="px-4 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-black shadow-lg shadow-lime-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Buat Turnamen Baru</span>
          </Link>
        </div>
      </div>

      {/* Notice Alert if any */}
      {notice && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Tournaments Management List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Daftar Turnamen Aktif ({tournaments.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {tournaments.map((t) => {
            const liveMatches = t.matches.filter((m) => m.status === 'LIVE').length;
            const finishedMatches = t.matches.filter((m) => m.status === 'FINISHED').length;

            return (
              <div
                key={t.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                {/* Left Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded-lg text-[11px] ${
                        t.sport === 'BADMINTON'
                          ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      {t.sport === 'BADMINTON' ? '🏸 Badminton' : '🎾 Padel'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {t.categoryLabel}
                    </span>
                    {liveMatches > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-extrabold text-red-400 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-live-dot" />
                        {liveMatches} LIVE
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-white truncate">{t.name}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {t.venue}, {t.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {t.startDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {t.participants.length} Peserta • {finishedMatches}/{t.matches.length} Match Selesai
                    </span>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <Link
                    href={`/tournament/${t.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5"
                    title="Lihat Tampilan Publik"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Tampilan Publik</span>
                  </Link>

                  <Link
                    href={`/admin/tournament/${t.id}`}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Kelola & Live Score</span>
                  </Link>

                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                    title="Hapus Turnamen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
