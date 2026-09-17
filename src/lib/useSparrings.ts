'use client';

import { useEffect, useState } from 'react';
import {
  loadSparringsFromSupabase,
  subscribeToSparingChanges,
} from '@/lib/supabase/sparingRepository';
import type { Sparring } from '@/types/sparing';

// Hook untuk halaman publik: memuat daftar sparing dan menjaganya tetap segar
// lewat realtime Supabase. Kegagalan dimuat diam-diam karena tampilan publik
// tidak boleh pecah hanya karena data sparing tidak tersedia.
export function useSparrings() {
  const [sparrings, setSparrings] = useState<Sparring[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const loaded = await loadSparringsFromSupabase();
        if (active) setSparrings(loaded);
      } catch (error) {
        console.error('Gagal memuat data sparing:', error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    const unsubscribe = subscribeToSparingChanges(() => void load());

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { sparrings, isLoading };
}
