import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'Racket Arena | Badminton & Padel Tournament Live Center',
  description:
    'Sistem manajemen dan live score turnamen Bulutangkis (Badminton) dan Padel dengan bagan sistem gugur interaktif dan live scoring wasit.',
  metadataBase: new URL('https://racket-arena.vercel.app'),
  openGraph: {
    title: 'Racket Arena | Badminton & Padel Tournament',
    description: 'Live score turnamen Badminton & Padel — bagan, jadwal, dan skor langsung.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#0a0e17] text-slate-100 font-sans selection:bg-lime-500 selection:text-slate-950">
        <Navbar />
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 Racket Arena • Badminton & Padel Tournament Engine</p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Siap di-deploy ke Vercel Free Tier
            </p>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
