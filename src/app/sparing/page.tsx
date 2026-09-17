'use client';

import { Shield } from 'lucide-react';
import { useAdminAuth } from '@/lib/authStore';
import PublicSparingView from '@/components/sparing/PublicSparingView';
import SparingManager from './SparingManager';

// Halaman sparing: publik melihat live score-nya, admin mendapat panel kelola.
export default function SparringPage() {
  const { isAdmin, isReady } = useAdminAuth();

  if (!isReady) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Shield className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
          <p className="text-xs font-bold text-slate-400">Memuat sparing...</p>
        </div>
      </div>
    );
  }

  return isAdmin ? <SparingManager /> : <PublicSparingView />;
}
