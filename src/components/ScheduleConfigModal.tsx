'use client';

import { useState } from 'react';
import { Tournament, GroupScheduleScheme } from '@/types/tournament';
import { calculateSlotTime } from '@/lib/bracketGenerator';
import {
  Calendar,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  AlertCircle,
  Shield,
  RotateCcw,
} from 'lucide-react';

interface ScheduleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  mode: 'GENERATE' | 'RESCHEDULE';
  onConfirm: (config: {
    scheme: GroupScheduleScheme;
    startTime: string;
    slotDurationMinutes: number;
  }) => void;
}

export default function ScheduleConfigModal({
  isOpen,
  onClose,
  tournament,
  mode,
  onConfirm,
}: ScheduleConfigModalProps) {
  const [selectedScheme, setSelectedScheme] = useState<GroupScheduleScheme>(
    tournament.groupScheduleScheme || 'SPLIT_WAVE'
  );
  const [startTime, setStartTime] = useState<string>('08:00 WIB');
  const [duration, setDuration] = useState<number>(45);

  if (!isOpen) return null;

  const courts = tournament.courts && tournament.courts.length > 0
    ? tournament.courts
    : ['Court 1', 'Court 2', 'Court 3'];
  const courtCount = courts.length;
  const totalMatches = 24;
  const totalSlots = Math.ceil(totalMatches / courtCount);

  const timeOptions = [
    '07:00 WIB', '07:30 WIB', '08:00 WIB', '08:30 WIB',
    '09:00 WIB', '09:30 WIB', '10:00 WIB', '10:30 WIB',
    '11:00 WIB', '11:30 WIB', '12:00 WIB', '13:00 WIB',
    '14:00 WIB', '15:00 WIB', '16:00 WIB', '17:00 WIB'
  ];

  const durationOptions = [
    { label: '30 Menit', value: 30 },
    { label: '40 Menit', value: 40 },
    { label: '45 Menit (Standar)', value: 45 },
    { label: '50 Menit', value: 50 },
    { label: '60 Menit (1 Jam)', value: 60 },
  ];

  // Quick simulation preview for first 4 slots
  const previewSlots = Array.from({ length: Math.min(totalSlots, 4) }, (_, i) => ({
    slotNum: i + 1,
    time: calculateSlotTime(startTime, i, duration),
    description:
      selectedScheme === 'SPLIT_WAVE'
        ? i < 4
          ? `Gelombang 1 (Grup 1 & 2) • Sesi ${i + 1}`
          : `Gelombang 2 (Grup 3 & 4) • Sesi ${i + 1}`
        : `Putaran Bergulir • Sesi ${i + 1} (${courtCount} match serentak)`,
  }));

  const estimatedEndTime = calculateSlotTime(startTime, totalSlots, duration);

  const handleApply = () => {
    onConfirm({
      scheme: selectedScheme,
      startTime,
      slotDurationMinutes: duration,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-lime-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                {mode === 'GENERATE' ? 'Pilih Skema Jadwal & Pengacakan Grup' : 'Sesuaikan Jadwal & Lapangan Pertandingan'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'GENERATE'
                  ? 'Tentukan alur pertandingan fase grup sebelum 16 tim diundi.'
                  : 'Atur ulang alur pertandingan jika terjadi perubahan mendadak di venue.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {mode === 'RESCHEDULE' && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Info Penyesuaian:</strong> Tindakan ini hanya mengatur ulang urutan main, pembagian lapangan ({courtCount} lapangan), dan jam main. <strong>Skor dan hasil pertandingan yang sudah selesai TIDAK AKAN HILANG.</strong>
              </span>
            </div>
          )}

          {/* Scheme Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              1. Pilih Model / Skema Penjadwalan
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Option 1: Split Wave */}
              <div
                onClick={() => setSelectedScheme('SPLIT_WAVE')}
                className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedScheme === 'SPLIT_WAVE'
                    ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-extrabold border border-blue-500/40">
                    <Sparkles className="w-3 h-3" />
                    Opsi 1: 2 Gelombang (Split Wave)
                  </span>
                  {selectedScheme === 'SPLIT_WAVE' && (
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <h4 className="text-sm font-black text-white mb-1">Grup 1 & 2 Duluan, Lalu Grup 3 & 4</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pertandingan dibagi 2 sesi (Pagi & Siang). Pemain Grup 3 & 4 tidak perlu datang dari pagi, sangat ideal untuk mengontrol kerumunan di venue.
                </p>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-blue-300/80 font-semibold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Sesi 1: Grup 1 & 2 (12 match) ➔ Sesi 2: Grup 3 & 4 (12 match)</span>
                </div>
              </div>

              {/* Option 2: Rolling Round */}
              <div
                onClick={() => setSelectedScheme('ROLLING_ROUND')}
                className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedScheme === 'ROLLING_ROUND'
                    ? 'bg-lime-950/40 border-lime-500 ring-2 ring-lime-500/30 shadow-lg shadow-lime-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-lime-500/20 text-lime-300 text-[11px] font-extrabold border border-lime-500/40">
                    <Layers className="w-3 h-3" />
                    Opsi 2: Putaran Bergulir (Rolling)
                  </span>
                  {selectedScheme === 'ROLLING_ROUND' && (
                    <CheckCircle2 className="w-5 h-5 text-lime-400" />
                  )}
                </div>
                <h4 className="text-sm font-black text-white mb-1">Ronde 1 ➔ Ronde 2 ➔ Ronde 3 Serentak</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Semua 4 grup bertanding secara paralel ronde demi ronde. Memberikan jeda istirahat yang lebih panjang (~45-90 menit) antar-pertandingan tiap tim.
                </p>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-lime-300/80 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Semua grup selesai bersamaan sebelum fase knockout</span>
                </div>
              </div>
            </div>
          </div>

          {/* Time & Duration Configurations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                2. Jam Mulai Pertandingan
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-lime-400"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                3. Estimasi Durasi per Match (Slot)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-lime-400"
              >
                {durationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Timeline Simulation */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/70 pb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-lime-400" />
                Simulasi Alur Jadwal ({courtCount} Lapangan)
              </span>
              <span className="text-[11px] text-slate-400">
                Total {totalMatches} Match • Selesai Est: <strong>{estimatedEndTime}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {previewSlots.map((slot) => (
                <div
                  key={slot.slotNum}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-300">
                      {slot.slotNum}
                    </span>
                    <span className="font-bold text-white">{slot.time}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 truncate max-w-[170px]">
                    {slot.description}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Lapangan Digunakan: <strong>{courts.join(', ')}</strong> ({courtCount} Lapangan)
              </span>
              <span>
                Wasit Otomatis: <strong>{courtCount} Wasit</strong> (Wasit 1 s/d Wasit {courtCount})
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>

          <button
            onClick={handleApply}
            className={`px-5 py-2.5 rounded-xl text-xs font-black text-slate-950 shadow-lg transition-all flex items-center gap-2 ${
              selectedScheme === 'SPLIT_WAVE'
                ? 'bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-300 hover:to-indigo-300 shadow-blue-500/20'
                : 'bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 shadow-lime-500/20'
            }`}
          >
            {mode === 'GENERATE' ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Acak 16 Tim & Terapkan Jadwal</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Terapkan Penyesuaian Jadwal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
