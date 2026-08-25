'use client';

import { useTournaments } from '@/lib/tournamentStore';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function GlobalRegisterPage() {
  const { tournaments, isClient, service } = useTournaments();
  const router = useRouter();

  const [formData, setFormData] = useState({
    tournamentId: '',
    teamName: '',
    player1Name: '',
    player2Name: '',
    reclubId1: '',
    reclubId2: '',
    whatsapp: '',
    termsAccepted: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Filter only upcoming tournaments or active padel tournaments
  const availableTournaments = useMemo(() => {
    return tournaments.filter(t => t.status !== 'COMPLETED');
  }, [tournaments]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      setError('Anda harus menyetujui Syarat & Ketentuan');
      return;
    }

    if (!formData.tournamentId || !formData.teamName || !formData.player1Name || !formData.whatsapp) {
      setError('Mohon lengkapi data yang wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const selectedTournament = tournaments.find(t => t.id === formData.tournamentId);
      if (!selectedTournament) {
         setError('Turnamen tidak valid.');
         return;
      }

      const success = service.submitRegistration(formData.tournamentId, {
        sector: selectedTournament.categoryLabel, // We store the category label as sector
        teamName: formData.teamName,
        player1Name: formData.player1Name,
        player2Name: formData.player2Name,
        reclubId1: formData.reclubId1,
        reclubId2: formData.reclubId2,
        whatsapp: formData.whatsapp
      });

      if (success) {
        setIsSuccess(true);
      } else {
        setError('Gagal mengirim pendaftaran. Silakan coba lagi.');
      }
    } catch (err) {
      setError('Terjadi kesalahan yang tidak terduga.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient) return null;
  
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-neutral-600 mb-6">
            Data pendaftaran Anda untuk tim <strong>{formData.teamName}</strong> telah kami terima dan sedang menunggu verifikasi dari Admin.
          </p>
          <Link
            href={`/`}
            className="w-full inline-flex justify-center items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link 
            href={`/`}
            className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali ke Beranda
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="px-6 py-8 border-b border-neutral-200">
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">Daftar Turnamen</h1>
            <p className="text-neutral-500">Silakan isi data tim Anda untuk berpartisipasi.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="tournamentId" className="block text-sm font-medium text-neutral-700 mb-1">
                  Pilih Sektor / Turnamen <span className="text-red-500">*</span>
                </label>
                <select
                  id="tournamentId"
                  name="tournamentId"
                  value={formData.tournamentId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Pilih Sektor...</option>
                  {availableTournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name} - {t.categoryLabel}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-neutral-700 mb-1">
                  Nama Tim <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="teamName"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  required
                  placeholder="Mis. The Smashers"
                  className="w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="player1Name" className="block text-sm font-medium text-neutral-700 mb-1">
                    Nama Pemain 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="player1Name"
                    name="player1Name"
                    value={formData.player1Name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="reclubId1" className="block text-sm font-medium text-neutral-700 mb-1">
                    Reclub ID Pemain 1
                  </label>
                  <input
                    type="text"
                    id="reclubId1"
                    name="reclubId1"
                    value={formData.reclubId1}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="player2Name" className="block text-sm font-medium text-neutral-700 mb-1">
                    Nama Pemain 2
                  </label>
                  <input
                    type="text"
                    id="player2Name"
                    name="player2Name"
                    value={formData.player2Name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="reclubId2" className="block text-sm font-medium text-neutral-700 mb-1">
                    Reclub ID Pemain 2
                  </label>
                  <input
                    type="text"
                    id="reclubId2"
                    name="reclubId2"
                    value={formData.reclubId2}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-neutral-700 mb-1">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  required
                  placeholder="081234567890"
                  className="w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-neutral-200">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-neutral-300 rounded"
                  />
                  <span className="ml-2 text-sm text-neutral-600">
                    Saya menyetujui Syarat & Ketentuan yang berlaku untuk turnamen ini. Data yang diisi adalah benar dan dapat dipertanggungjawabkan.
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
