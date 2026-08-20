'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTournaments } from '@/lib/tournamentStore';
import { useAdminAuth } from '@/lib/authStore';
import {
  Shield,
  Plus,
  Trophy,
  Activity,
  Calendar,
  MapPin,
  Users,
  SlidersHorizontal,
  Trash2,
  ExternalLink,
  Lock,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin, isReady, logout } = useAdminAuth();
  const { tournaments, service } = useTournaments();

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

  return (
    <div className="space-y-8 pb-20">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
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

        <div className="flex items-center gap-3">
          <Link
            href="/admin/tournament/new"
            className="px-4 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-black shadow-lg shadow-lime-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Buat Turnamen Baru</span>
          </Link>
        </div>
      </div>

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
