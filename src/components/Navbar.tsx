'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Activity, LogOut, Menu, Shield, Trophy, Users, X } from 'lucide-react';
import { useAdminAuth } from '@/lib/authStore';

export default function Navbar() {
  const { isAdmin, logout } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const mobileItemClass =
    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800/70 transition-colors';

  return (
    <header className="sticky top-0 z-40 bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group min-w-0" onClick={closeMenu}>
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-lime-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-lime-500/20 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  RACKET<span className="text-lime-400">ARENA</span>
                </span>
                <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Live Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Badminton & Padel Tournament Center
              </p>
            </div>
          </Link>

          {/* Center Links (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-lime-400" />
              Match Center
            </Link>
            <Link
              href="/sparing"
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-cyan-200 hover:text-white hover:bg-cyan-500/10 transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              Sparing
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/30 transition-colors flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                Admin Dashboard
              </Link>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Desktop actions */}
            {isAdmin ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-semibold hover:bg-amber-500/30 transition-colors flex items-center gap-1.5"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span className="hidden lg:inline">Admin Mode</span>
                  <span className="lg:hidden">Admin</span>
                </Link>
                <button
                  onClick={() => void logout()}
                  title="Logout Admin"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="hidden md:flex px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition-colors items-center gap-1.5"
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Admin Login</span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
              title={menuOpen ? 'Tutup menu' : 'Buka menu'}
              className="md:hidden p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-slate-800 bg-[#0c121e] px-3 py-3 space-y-1 shadow-xl">
          <Link href="/" onClick={closeMenu} className={mobileItemClass}>
            <Activity className="w-5 h-5 text-lime-400" />
            Match Center
          </Link>
          <Link href="/sparing" onClick={closeMenu} className={mobileItemClass}>
            <Users className="w-5 h-5 text-cyan-400" />
            Sparing
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={closeMenu} className={mobileItemClass}>
              <Shield className="w-5 h-5 text-amber-400" />
              Admin Dashboard
            </Link>
          )}
          {isAdmin ? (
            <button
              onClick={() => {
                closeMenu();
                void logout();
              }}
              className={`${mobileItemClass} w-full text-left text-red-300 hover:bg-red-500/10`}
            >
              <LogOut className="w-5 h-5" />
              Logout Admin
            </button>
          ) : (
            <Link href="/admin/login" onClick={closeMenu} className={mobileItemClass}>
              <Shield className="w-5 h-5 text-slate-400" />
              Admin Login
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
