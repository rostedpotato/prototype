'use client';

import Link from 'next/link';
import { Trophy, Shield, Activity, RotateCcw, LogOut } from 'lucide-react';
import { useAdminAuth } from '@/lib/authStore';
import { TournamentService } from '@/lib/tournamentStore';

export default function Navbar() {
  const { isAdmin, logout } = useAdminAuth();

  const handleReset = () => {
    if (confirm('Kembalikan data turnamen ke data demo awal?')) {
      TournamentService.resetDefaults();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c121e]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lime-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-lime-500/20 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  RACKET<span className="text-lime-400">ARENA</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Live Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Badminton & Padel Tournament Center
              </p>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-lime-400" />
              Match Center
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
            <button
              onClick={handleReset}
              title="Reset data demo"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

            {isAdmin ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-semibold hover:bg-amber-500/30 transition-colors flex items-center gap-1.5"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Admin Mode</span>
                </Link>
                <button
                  onClick={logout}
                  title="Logout Admin"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Admin Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
