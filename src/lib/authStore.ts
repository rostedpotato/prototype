'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

async function getAdminStatus(user: User | null): Promise<boolean> {
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return !error && data?.role === 'ADMIN';
}

export const AuthService = {
  async isAdmin(user?: User | null): Promise<boolean> {
    if (user === undefined) {
      const { data, error } = await supabase.auth.getUser();
      if (error) return false;
      return getAdminStatus(data.user);
    }

    return getAdminStatus(user);
  },

  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: error?.message || 'Login gagal.',
      };
    }

    const admin = await getAdminStatus(data.user);
    if (!admin) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Akun ini belum memiliki akses admin.',
      };
    }

    return { success: true };
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },
};

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const refreshAuth = async (user?: User | null) => {
      const admin = await AuthService.isAdmin(user);
      if (!mounted) return;

      setIsAdmin(admin);
      setIsReady(true);
    };

    void refreshAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void refreshAuth(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    isAdmin,
    isReady,
    login: AuthService.login,
    logout: AuthService.logout,
  };
}
