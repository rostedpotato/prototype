'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/authStore';
import { Shield, KeyRound, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAdmin, isReady, login } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isReady && isAdmin) {
      router.push('/admin');
    }
  }, [isAdmin, isReady, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      router.push('/admin');
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Shield className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-white">Login Admin Turnamen</h1>
          <p className="text-xs text-slate-400 font-medium">
            Masuk untuk membuat turnamen, mengatur bagan, dan mengupdate live score wasit.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(false);
                }}
                placeholder="Masukkan Username Admin"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Masukkan Password Admin"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
                required
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
            {error && (
              <p className="text-xs text-red-400 font-semibold mt-1.5">
                Username atau Password salah.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Masuk Admin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Kembali ke Match Center Publik
          </Link>
        </div>
      </div>
    </div>
  );
}
