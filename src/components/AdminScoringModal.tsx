'use client';

import { useState, useEffect } from 'react';
import { Match, SetScore, MatchStatus, SportType } from '@/types/tournament';
import { TournamentService, useTournament } from '@/lib/tournamentStore';
import {
  checkSetStatus,
  canIncrementScore,
  calculateMatchWinner,
} from '@/lib/scoreRules';
import {
  X,
  Plus,
  Minus,
  Trophy,
  CheckCircle2,
  CircleDot,
  AlertTriangle,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminScoringModalProps {
  tournamentId: string;
  match: Match | null;
  sport: SportType;
  pointsPerSet: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminScoringModal({
  tournamentId,
  match,
  sport,
  isOpen,
  onClose,
}: AdminScoringModalProps) {
  const { tournament } = useTournament(tournamentId);

  const [activeSet, setActiveSet] = useState<number>(1);
  const [scores, setScores] = useState<SetScore[]>([
    { setNumber: 1, score1: 0, score2: 0 },
    { setNumber: 2, score1: 0, score2: 0 },
    { setNumber: 3, score1: 0, score2: 0 },
  ]);
  const [status, setStatus] = useState<MatchStatus>('LIVE');
  const [servingSide, setServingSide] = useState<1 | 2>(1);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [court, setCourt] = useState<string>('');
  const [ruleNotice, setRuleNotice] = useState<string | null>(null);

  // Manual participant selector state
  const [p1Id, setP1Id] = useState<string>('');
  const [p2Id, setP2Id] = useState<string>('');

  useEffect(() => {
    if (match) {
      setActiveSet(match.currentSet || 1);
      setScores(
        match.scores && match.scores.length === 3
          ? JSON.parse(JSON.stringify(match.scores))
          : [
              { setNumber: 1, score1: 0, score2: 0 },
              { setNumber: 2, score1: 0, score2: 0 },
              { setNumber: 3, score1: 0, score2: 0 },
            ]
      );
      setStatus(match.status);
      setServingSide(match.servingSide || 1);
      setWinnerId(match.winnerId || null);
      setCourt(match.court || 'Court 1');
      setP1Id(match.participant1?.id || '');
      setP2Id(match.participant2?.id || '');
      setRuleNotice(null);
    }
  }, [match]);

  if (!isOpen || !match || !tournament) return null;

  const currentSetScore = scores[activeSet - 1] || { setNumber: activeSet, score1: 0, score2: 0 };
  const currentSetStatus = checkSetStatus(sport, currentSetScore.score1, currentSetScore.score2);
  const matchWinnerStatus = calculateMatchWinner(sport, scores, 2);

  const p1 = tournament.participants.find((p) => p.id === p1Id) || match.participant1;
  const p2 = tournament.participants.find((p) => p.id === p2Id) || match.participant2;

  const handleScoreChange = (team: 1 | 2, delta: number) => {
    setRuleNotice(null);

    if (delta > 0) {
      const check = canIncrementScore(sport, currentSetScore.score1, currentSetScore.score2, team);
      if (!check.allowed) {
        setRuleNotice(check.reason || 'Poin tidak dapat ditambahkan.');
        return;
      }
    }

    const newScores = scores.map((s) => {
      if (s.setNumber === activeSet) {
        const currentVal = team === 1 ? s.score1 : s.score2;
        const updatedVal = Math.max(0, currentVal + delta);
        return {
          ...s,
          score1: team === 1 ? updatedVal : s.score1,
          score2: team === 2 ? updatedVal : s.score2,
        };
      }
      return s;
    });

    setScores(newScores);

    // Check if after this point change, the match is won!
    const winCheck = calculateMatchWinner(sport, newScores, 2);
    if (winCheck.isMatchOver && winCheck.winnerSide) {
      const winningParticipant = winCheck.winnerSide === 1 ? p1 : p2;
      if (winningParticipant) {
        setWinnerId(winningParticipant.id);
        setStatus('FINISHED');
      }
    } else {
      // Check if current set was just won, prompt to move to next set
      const updatedSetScore = newScores[activeSet - 1];
      const updatedSetStatus = checkSetStatus(sport, updatedSetScore.score1, updatedSetScore.score2);
      if (updatedSetStatus.isFinished && activeSet < 3) {
        setRuleNotice(`Set ${activeSet} selesai! Klik Set ${activeSet + 1} untuk melanjutkan.`);
      }
    }
  };

  const handleSave = () => {
    // Determine winner if finished
    let finalWinnerId = winnerId;
    if (status === 'FINISHED' && !finalWinnerId) {
      if (matchWinnerStatus.winnerSide === 1 && p1) finalWinnerId = p1.id;
      else if (matchWinnerStatus.winnerSide === 2 && p2) finalWinnerId = p2.id;
    }

    TournamentService.updateMatch(tournamentId, match.id, {
      scores,
      currentSet: activeSet,
      servingSide,
      status,
      winnerId: status === 'FINISHED' ? finalWinnerId : null,
      court,
      participant1: p1 || null,
      participant2: p2 || null,
    });

    if (status === 'FINISHED' && finalWinnerId) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }

    onClose();
  };

  const canIncTeam1 = canIncrementScore(sport, currentSetScore.score1, currentSetScore.score2, 1).allowed;
  const canIncTeam2 = canIncrementScore(sport, currentSetScore.score1, currentSetScore.score2, 2).allowed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/80 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                KONTROL WASIT RESMI
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {sport === 'BADMINTON' ? '🏸 Badminton 21 Poin' : '🎾 Padel 6 Games'} • {match.roundName}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-1">
              Live Score & Bagan Otomatis
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Alert Banner if match/set finished */}
          {matchWinnerStatus.isMatchOver && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500/20 to-lime-500/20 border border-amber-400/40 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-white">
                    PERTANDINGAN SELESAI (2 SET MENANG)
                  </p>
                  <p className="text-xs text-amber-300 font-bold">
                    Pemenang:{' '}
                    {matchWinnerStatus.winnerSide === 1 ? p1?.name || 'Peserta 1' : p2?.name || 'Peserta 2'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-lime-500 text-slate-950">
                Auto-Advancing
              </span>
            </div>
          )}

          {/* Rule Notice / Warning Banner */}
          {ruleNotice && (
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs font-semibold text-amber-200 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{ruleNotice}</span>
            </div>
          )}

          {/* Participant Override / Assignment (Essential if slot is waiting or needs manual fix) */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-lime-400" />
                Peserta di Pertandingan Ini (Bisa dipilih jika belum terisi dari bagan):
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Slot 1 (Atas)</span>
                <select
                  value={p1Id}
                  onChange={(e) => setP1Id(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-lime-500"
                >
                  <option value="">-- Menunggu Lawan (TBD) --</option>
                  {tournament.participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.seed ? `[#${p.seed}] ` : ''}{p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Slot 2 (Bawah)</span>
                <select
                  value={p2Id}
                  onChange={(e) => setP2Id(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-lime-500"
                >
                  <option value="">-- Menunggu Lawan (TBD) --</option>
                  {tournament.participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.seed ? `[#${p.seed}] ` : ''}{p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status & Court Selector */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Status Pertandingan
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as MatchStatus;
                  setStatus(newStatus);
                  if (newStatus !== 'FINISHED') {
                    setWinnerId(null);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-lime-500"
              >
                <option value="UPCOMING">🕒 Akan Datang (Upcoming)</option>
                <option value="LIVE">🔴 Sedang Tanding (LIVE)</option>
                <option value="FINISHED">✅ Selesai (Finished)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Lapangan (Court)
              </label>
              <input
                type="text"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                placeholder="e.g. Court 1"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-lime-500"
              />
            </div>
          </div>

          {/* Set Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300">
                Pilih Set:
              </label>
              <span className="text-[11px] font-bold text-lime-400">
                {currentSetStatus.statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((setNum) => {
                const s = scores[setNum - 1];
                const isActive = activeSet === setNum;
                const setSt = checkSetStatus(sport, s.score1, s.score2);

                return (
                  <button
                    key={setNum}
                    type="button"
                    onClick={() => setActiveSet(setNum)}
                    className={`py-2 px-3 rounded-2xl border text-center font-bold transition-all relative ${
                      isActive
                        ? 'bg-lime-500/20 border-lime-400 text-lime-300 shadow-md ring-1 ring-lime-400/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs flex items-center justify-center gap-1">
                      <span>SET {setNum}</span>
                      {setSt.isFinished && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                      )}
                    </div>
                    <div className="text-base font-score font-extrabold mt-0.5">
                      {s.score1} - {s.score2}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Touch Scorepad */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Team 1 Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4 flex flex-col items-center text-center">
              <div className="w-full mb-2">
                <span className="text-xs font-black text-slate-100 line-clamp-1">
                  {p1?.name || 'Peserta 1'}
                </span>
                <button
                  type="button"
                  onClick={() => setServingSide(1)}
                  className={`mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 mx-auto transition-colors ${
                    servingSide === 1
                      ? 'bg-lime-500 text-slate-950 shadow-sm shadow-lime-500/50'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <CircleDot className="w-2.5 h-2.5" />
                  {servingSide === 1 ? 'Servis' : 'Set Servis'}
                </button>
              </div>

              {/* Score Display */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 my-1 rounded-2xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-4xl sm:text-5xl font-black font-score text-white shadow-inner">
                {currentSetScore.score1}
              </div>

              {/* Steppers */}
              <div className="flex items-center gap-2 mt-2 w-full justify-center">
                <button
                  type="button"
                  onClick={() => handleScoreChange(1, -1)}
                  disabled={currentSetScore.score1 === 0}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 disabled:opacity-30 border border-slate-700 flex items-center justify-center active:scale-95 transition-all text-xl font-bold"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScoreChange(1, 1)}
                  disabled={!canIncTeam1}
                  className="flex-1 h-10 sm:h-12 rounded-xl bg-lime-500 hover:bg-lime-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-lime-500/20 active:scale-95 transition-all gap-1"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                  <span>+1</span>
                </button>
              </div>
            </div>

            {/* Team 2 Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4 flex flex-col items-center text-center">
              <div className="w-full mb-2">
                <span className="text-xs font-black text-slate-100 line-clamp-1">
                  {p2?.name || 'Peserta 2'}
                </span>
                <button
                  type="button"
                  onClick={() => setServingSide(2)}
                  className={`mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 mx-auto transition-colors ${
                    servingSide === 2
                      ? 'bg-lime-500 text-slate-950 shadow-sm shadow-lime-500/50'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <CircleDot className="w-2.5 h-2.5" />
                  {servingSide === 2 ? 'Servis' : 'Set Servis'}
                </button>
              </div>

              {/* Score Display */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 my-1 rounded-2xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-4xl sm:text-5xl font-black font-score text-white shadow-inner">
                {currentSetScore.score2}
              </div>

              {/* Steppers */}
              <div className="flex items-center gap-2 mt-2 w-full justify-center">
                <button
                  type="button"
                  onClick={() => handleScoreChange(2, -1)}
                  disabled={currentSetScore.score2 === 0}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 disabled:opacity-30 border border-slate-700 flex items-center justify-center active:scale-95 transition-all text-xl font-bold"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScoreChange(2, 1)}
                  disabled={!canIncTeam2}
                  className="flex-1 h-10 sm:h-12 rounded-xl bg-lime-500 hover:bg-lime-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-lime-500/20 active:scale-95 transition-all gap-1"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                  <span>+1</span>
                </button>
              </div>
            </div>
          </div>

          {/* Winner Confirmation Box */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>
                Pemenang Pertandingan (Pemenang akan <strong>otomatis lolos</strong> ke babak berikutnya di bagan):
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (p1) {
                    setWinnerId(p1.id);
                    setStatus('FINISHED');
                  }
                }}
                disabled={!p1}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                  winnerId === p1?.id
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                🏆 {p1?.name || 'Peserta 1 (Belum ditentukan)'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (p2) {
                    setWinnerId(p2.id);
                    setStatus('FINISHED');
                  }
                }}
                disabled={!p2}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                  winnerId === p2?.id
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                🏆 {p2?.name || 'Peserta 2 (Belum ditentukan)'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-black tracking-wide shadow-lg shadow-lime-500/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Simpan & Update Bagan Otomatis
          </button>
        </div>
      </div>
    </div>
  );
}
