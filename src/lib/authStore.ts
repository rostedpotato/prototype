'use client';

import { useState, useEffect } from 'react';

const ADMIN_AUTH_KEY = 'racket_admin_authenticated';
export const DEFAULT_ADMIN_PIN = 'admin123';

export const AuthService = {
  isAdmin(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  },

  login(pin: string): boolean {
    if (pin === DEFAULT_ADMIN_PIN || pin === 'admin') {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
      window.dispatchEvent(new Event('auth_changed'));
      return true;
    }
    return false;
  },

  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ADMIN_AUTH_KEY);
    window.dispatchEvent(new Event('auth_changed'));
  },
};

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsAdmin(AuthService.isAdmin());
    setIsReady(true);

    const handleAuth = () => {
      setIsAdmin(AuthService.isAdmin());
    };

    window.addEventListener('auth_changed', handleAuth);
    window.addEventListener('storage', handleAuth);
    return () => {
      window.removeEventListener('auth_changed', handleAuth);
      window.removeEventListener('storage', handleAuth);
    };
  }, []);

  return { isAdmin, isReady, login: AuthService.login, logout: AuthService.logout };
}
