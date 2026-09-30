'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { TOURNAMENT_SYNC_ERROR_EVENT } from '@/lib/tournamentStore';

// Menampilkan peringatan ketika perubahan data admin gagal tersinkron ke
// Supabase (sinkronisasi berjalan di latar setelah UI diperbarui).
export default function SyncErrorToaster() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === 'string' && detail) {
        setMessage(detail);
      }
    };

    window.addEventListener(TOURNAMENT_SYNC_ERROR_EVENT, handleError);
    return () => window.removeEventListener(TOURNAMENT_SYNC_ERROR_EVENT, handleError);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 8000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-2xl border border-red-500/40 bg-slate-900/95 shadow-2xl shadow-red-500/10 p-4 flex gap-3 items-start">
      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs font-black text-red-300">Gagal sinkron ke database</p>
        <p className="mt-1 text-[11px] font-medium text-slate-300 break-words">
          {message} — perubahan hanya tersimpan di perangkat ini. Periksa koneksi lalu coba simpan lagi.
        </p>
      </div>
      <button
        onClick={() => setMessage(null)}
        className="shrink-0 rounded-lg p-1 text-slate-500 hover:text-white transition-colors"
        title="Tutup"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
