'use client';

import { useState, useEffect } from 'react';

const ADMIN_AUTH_KEY = 'racket_admin_authenticated';


export const AuthService = {
  isAdmin(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  },

  login(username: string, pin: string): boolean {
    if (username === 'admin' && pin === 'password123') {
      try {
        localStorage.setItem(ADMIN_AUTH_KEY, 'true');
        window.dispatchEvent(new Event('auth_changed'));
      } catch {
        // localStorage unavailable — session will not persist across tabs
      }
      return true;
    }
    return false;
  },

  logout(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(ADMIN_AUTH_KEY);
      window.dispatchEvent(new Event('auth_changed'));
    } catch {
      // localStorage unavailable
    }
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
