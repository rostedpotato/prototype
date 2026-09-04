'use client';

import { useState, useEffect } from 'react';
import { Match, SetScore, MatchStatus, SportType, Participant } from '@/types/tournament';
import { TournamentService, useTournament } from '@/lib/tournamentStore';
import { useAdminAuth } from '@/lib/authStore';
import {
  checkSetStatus,
  calculateMatchWinner,
  getSetsToWinForRound,
  getMaxSetsForRound,
  getTargetGamesForMatch,
} from '@/lib/scoreRules';
import {
  X,
  Plus,
  Minus,
  Trophy,
  CheckCircle2,
  CircleDot,
  Users,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Flag,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TeamScoreBoxProps {
  participant?: Participant | null;
  fallbackLabel: string;
  servingSide: 1 | 2;
  teamNumber: 1 | 2;
  score: number;
  onSetServing: (team: 1 | 2) => void;
  onScoreChange: (team: 1 | 2, delta: number) => void;
  onDirectScoreSet: (team: 1 | 2, val: number) => void;
}

function TeamScoreBox({
  participant,
  fallbackLabel,
  servingSide,
  teamNumber,
  score,
  onSetServing,
  onScoreChange,
  onDirectScoreSet,
}: TeamScoreBoxProps) {
  const isServing = servingSide === teamNumber;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col items-center text-center">
      <div className="w-full mb-1.5">
        <span className="text-xs font-black text-slate-100 line-clamp-1">
          {participant?.name || fallbackLabel}
        </span>
        <button
          type="button"
          onClick={() => onSetServing(teamNumber)}
          className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 mx-auto transition-colors ${
            isServing
              ? 'bg-lime-500 text-slate-950 shadow-sm shadow-lime-500/50'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <CircleDot className="w-2.5 h-2.5" />
          {isServing ? 'Servis' : 'Set Servis'}
        </button>
      </div>

      <div className="flex items-center gap-2 my-1">
        <button
          type="button"
          onClick={() => onScoreChange(teamNumber, -1)}
          disabled={score === 0}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 disabled:opacity-30 border border-slate-700 flex items-center justify-center active:scale-95 transition-all text-lg font-bold"
        >
          <Minus className="w-4 h-4" />
        </button>

        <input
          type="number"
          min="0"
          value={score}
          onChange={(e) => onDirectScoreSet(teamNumber, parseInt(e.target.value) || 0)}
          className="w-16 h-14 rounded-2xl bg-slate-950 border-2 border-slate-700 text-center text-3xl font-black font-score text-white focus:outline-none focus:border-lime-400 shadow-inner"
        />

        <button
          type="button"
          onClick={() => onScoreChange(teamNumber, 1)}
          className="w-9 h-9 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-md shadow-lime-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}

interface AdminScoringModalProps {
  tournamentId: string;
  match: Match | null;
  sport: SportType;
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
  const { isAdmin } = useAdminAuth();

  const setsToWin = getSetsToWinForRound(sport, tournament?.rules?.customPadelScoring, match?.roundName || '');
  const maxSets = getMaxSetsForRound(sport, tournament?.rules?.customPadelScoring, match?.roundName || '');
  const targetGames = getTargetGamesForMatch(sport, tournament?.rules?.customPadelScoring, match?.roundName || '');

  const [activeSet, setActiveSet] = useState<number>(1);
  const [scores, setScores] = useState<SetScore[]>([]);
  const [status, setStatus] = useState<MatchStatus>('LIVE');
  const [servingSide, setServingSide] = useState<1 | 2>(1);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [court, setCourt] = useState<string>('');
  const [referee, setReferee] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  // Manual participant selector state
  const [p1Id, setP1Id] = useState<string>('');
  const [p2Id, setP2Id] = useState<string>('');

  useEffect(() => {
    if (match) {
      setActiveSet(match.currentSet || 1);
      const loadedScores: SetScore[] = match.scores && match.scores.length > 0 
        ? match.scores.map(s => ({ ...s })) 
        : Array.from({ length: maxSets }, (_, i) => ({ setNumber: i + 1, score1: 0, score2: 0 }));
      
      while (loadedScores.length < maxSets) {
        loadedScores.push({ setNumber: loadedScores.length + 1, score1: 0, score2: 0 });
      }
      setScores(loadedScores);
      setStatus(match.status);
      setServingSide(match.servingSide || 1);
      setWinnerId(match.winnerId || null);
      setCourt(match.court || 'Court 1');
      setReferee(match.referee || '');
      setScheduledTime(match.scheduledTime || '09:00 WIB');
      setP1Id(match.participant1?.id || '');
      setP2Id(match.participant2?.id || '');
    }
  }, [match, maxSets]);

  if (!isOpen || !match || !tournament || !isAdmin) return null;

  const modalCourtOptions = tournament.courts && tournament.courts.length > 0 ? tournament.courts : ['Court 1', 'Court 2', 'Court 3', 'Court 4'];
  const modalRefereeOptions = modalCourtOptions.map((_, idx) => `Wasit ${idx + 1}`);

  const currentSetScore = scores[activeSet - 1] || { setNumber: activeSet, score1: 0, score2: 0 };
  const currentSetStatus = checkSetStatus(sport, currentSetScore.score1, currentSetScore.score2, targetGames);
  const matchWinnerStatus = calculateMatchWinner(sport, scores, setsToWin, targetGames);

  const p1 = tournament.participants.find((p) => p.id === p1Id) || match.participant1;
  const p2 = tournament.participants.find((p) => p.id === p2Id) || match.participant2;

  const handleScoreChange = (team: 1 | 2, delta: number) => {
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
    const winCheck = calculateMatchWinner(sport, newScores, setsToWin, targetGames);
    if (winCheck.isMatchOver && winCheck.winnerSide) {
      const winningParticipant = winCheck.winnerSide === 1 ? p1 : p2;
      if (winningParticipant) {
        setWinnerId(winningParticipant.id);
        setStatus('FINISHED');
      }
    }
  };

  const handleDirectScoreSet = (score1Val: number, score2Val: number) => {
    const newScores = scores.map((s) => {
      if (s.setNumber === activeSet) {
        return {
          ...s,
          score1: Math.max(0, score1Val),
          score2: Math.max(0, score2Val),
        };
      }
      return s;
    });

    setScores(newScores);

    const winCheck = calculateMatchWinner(sport, newScores, setsToWin, targetGames);
    if (winCheck.isMatchOver && winCheck.winnerSide) {
      const winningParticipant = winCheck.winnerSide === 1 ? p1 : p2;
      if (winningParticipant) {
        setWinnerId(winningParticipant.id);
        setStatus('FINISHED');
      }
    }
  };

  const handleDeclareWalkover = (losingSide: 1 | 2) => {
    const winningParticipant = losingSide === 1 ? p2 : p1;
    const losingParticipant = losingSide === 1 ? p1 : p2;
    if (!winningParticipant || !losingParticipant) return;

    if (
      confirm(
        `Nyatakan Walkover (WO) / Cedera?\n\n${losingParticipant.name} dinyatakan kalah WO.\n${winningParticipant.name} dinyatakan sebagai PEMENANG.`
      )
    ) {
      setWinnerId(winningParticipant.id);
      setStatus('WALKOVER');

      // Populate winning sets for target games so record is clean
      const setsNeeded = setsToWin || 3;
      const target = targetGames || 6;
      const woScores = scores.map((s, idx) => {
        if (idx < setsNeeded) {
          return {
            ...s,
            score1: losingSide === 2 ? target : 0,
            score2: losingSide === 1 ? target : 0,
          };
        }
        return { ...s, score1: 0, score2: 0 };
      });
      setScores(woScores);
    }
  };

  const handleCancelWalkover = () => {
    setStatus('LIVE');
    setWinnerId(null);
  };

  const handleSave = () => {
    const isOver = status === 'FINISHED' || status === 'WALKOVER';
    let finalWinnerId = winnerId;
    if (isOver && !finalWinnerId) {
      if (matchWinnerStatus.winnerSide === 1 && p1) finalWinnerId = p1.id;
      else if (matchWinnerStatus.winnerSide === 2 && p2) finalWinnerId = p2.id;
    }

    // Filter to active sets (or at least preserve sets played)
    TournamentService.updateMatch(tournamentId, match.id, {
      scores,
      currentSet: activeSet,
      servingSide,
      status,
      winnerId: isOver ? finalWinnerId : null,
      court,
      referee,
      scheduledTime,
      participant1: p1 || null,
      participant2: p2 || null,
    });

    if (isOver && finalWinnerId) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.error('Confetti error', e);
      }
    }

    onClose();
  };

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
          {/* Live Sets & Points Summary Banner */}
          <div className="p-4 bg-gradient-to-br from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-800/50 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center text-xs font-black">
                  🎾
                </span>
                <div>
                  <span className="text-xs font-black text-white">
                    {match.roundName}
                  </span>
                  <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Target: Menang {setsToWin} Set
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 flex-wrap">
                <span>Wasit: <strong className="text-amber-300">{referee || 'Belum dipilih'}</strong></span>
                <span>•</span>
                <span>Jadwal: <strong className="text-cyan-300">{scheduledTime || 'Belum diatur'}</strong></span>
              </div>
            </div>

            {/* Scoreboard Tally */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div className={`p-3 rounded-xl border text-center transition-all ${
                matchWinnerStatus.setsWon1 > matchWinnerStatus.setsWon2
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}>
                <p className="text-xs font-black truncate">{p1?.name || 'Peserta 1'}</p>
                <div className="text-2xl font-black font-score text-white mt-0.5">
                  {matchWinnerStatus.setsWon1} <span className="text-xs font-medium text-slate-400">Set</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  Total Poin: <strong className="text-lime-400">{matchWinnerStatus.pointsWon1}</strong>
                </p>
              </div>

              <div className={`p-3 rounded-xl border text-center transition-all ${
                matchWinnerStatus.setsWon2 > matchWinnerStatus.setsWon1
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}>
                <p className="text-xs font-black truncate">{p2?.name || 'Peserta 2'}</p>
                <div className="text-2xl font-black font-score text-white mt-0.5">
                  {matchWinnerStatus.setsWon2} <span className="text-xs font-medium text-slate-400">Set</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  Total Poin: <strong className="text-lime-400">{matchWinnerStatus.pointsWon2}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Status Alert Banner if match finished */}
          {matchWinnerStatus.isMatchOver && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500/20 to-lime-500/20 border border-amber-400/40 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-white">
                    PERTANDINGAN MEMENUHI SYARAT KEMENANGAN ({setsToWin} SET MENANG)
                  </p>
                  <p className="text-xs text-amber-300 font-bold">
                    Pemenang:{' '}
                    {matchWinnerStatus.winnerSide === 1 ? p1?.name || 'Peserta 1' : p2?.name || 'Peserta 2'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-lime-500 text-slate-950">
                Selesai
              </span>
            </div>
          )}

          {/* Participant Override / Assignment */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-lime-400" />
                Peserta Pertandingan:
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

          {/* Status, Court, Referee & Scheduled Time Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800">
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
              <select
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-lime-500"
              >
                {modalCourtOptions.map((c) => (
                  <option key={c} value={c}>
                    🏟️ {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Wasit (Referee)
              </label>
              <select
                value={referee}
                onChange={(e) => setReferee(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">- Tanpa Wasit -</option>
                {modalRefereeOptions.map((r) => (
                  <option key={r} value={r}>
                    🧑‍⚖️ {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Waktu / Jam Tanding
              </label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="misal: 09:00 WIB"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Set Selector Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Pilih Set untuk Diinput / Diedit:
              </label>
              <span className="text-[11px] font-bold text-lime-400">
                {currentSetStatus.statusLabel}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {Array.from({ length: maxSets }, (_, i) => i + 1).map((setNum) => {
                const s = scores[setNum - 1] || { setNumber: setNum, score1: 0, score2: 0 };
                const isActive = activeSet === setNum;
                const isSetWon1 = s.score1 > s.score2 && (s.score1 > 0 || s.score2 > 0);
                const isSetWon2 = s.score2 > s.score1 && (s.score1 > 0 || s.score2 > 0);

                return (
                  <button
                    key={setNum}
                    type="button"
                    onClick={() => setActiveSet(setNum)}
                    className={`flex-1 min-w-[72px] py-2 px-2.5 rounded-2xl border text-center font-bold transition-all relative ${
                      isActive
                        ? 'bg-lime-500/20 border-lime-400 text-lime-300 shadow-md ring-1 ring-lime-400/40'
                        : isSetWon1 || isSetWon2
                        ? 'bg-slate-900 border-slate-700 text-slate-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] flex items-center justify-center gap-1">
                      <span>SET {setNum}</span>
                      {(isSetWon1 || isSetWon2) && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                      )}
                    </div>
                    <div className="text-sm font-score font-extrabold mt-0.5">
                      {s.score1} - {s.score2}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Touch Scorepad for Active Set */}
          <div className="bg-slate-950/60 p-4 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Input Skor Set {activeSet}
              </span>
              <span className="text-[11px] text-slate-400">
                Poin/Game yang didapat di Set {activeSet}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <TeamScoreBox
                participant={p1}
                fallbackLabel="Peserta 1"
                servingSide={servingSide}
                teamNumber={1}
                score={currentSetScore.score1}
                onSetServing={setServingSide}
                onScoreChange={handleScoreChange}
                onDirectScoreSet={(team, val) =>
                  handleDirectScoreSet(val, currentSetScore.score2)
                }
              />
              <TeamScoreBox
                participant={p2}
                fallbackLabel="Peserta 2"
                servingSide={servingSide}
                teamNumber={2}
                score={currentSetScore.score2}
                onSetServing={setServingSide}
                onScoreChange={handleScoreChange}
                onDirectScoreSet={(team, val) =>
                  handleDirectScoreSet(currentSetScore.score1, val)
                }
              />
            </div>

            {/* Quick Set Presets for Wasit/Admin */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                ⚡ Tombol Cepat Skor Set {activeSet}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [7, 5], [7, 6],
                  [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 7], [6, 7],
                ].map(([s1, s2]) => (
                  <button
                    key={`${s1}-${s2}`}
                    type="button"
                    onClick={() => handleDirectScoreSet(s1, s2)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-200 active:scale-95 transition-all"
                  >
                    {s1} - {s2}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Set-by-Set Overview Matrix Breakdown */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                📋 Ringkasan Per Set (Menentukan Klasemen Grup)
              </span>
              <span className="text-[10px] text-slate-400">
                Poin per set dihitung untuk tiebreaker
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                    <th className="py-2 px-3">SET</th>
                    <th className="py-2 px-3">{p1?.name || 'Peserta 1'}</th>
                    <th className="py-2 px-3">{p2?.name || 'Peserta 2'}</th>
                    <th className="py-2 px-3 text-right">HASIL SET</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {scores.slice(0, maxSets).map((s) => {
                    const hasScore = s.score1 > 0 || s.score2 > 0;
                    const isWon1 = s.score1 > s.score2 && hasScore;
                    const isWon2 = s.score2 > s.score1 && hasScore;

                    return (
                      <tr key={s.setNumber} className={activeSet === s.setNumber ? 'bg-blue-500/10' : ''}>
                        <td className="py-2 px-3 font-bold text-slate-300">Set {s.setNumber}</td>
                        <td className="py-2 px-3 font-bold text-white font-score">{s.score1}</td>
                        <td className="py-2 px-3 font-bold text-white font-score">{s.score2}</td>
                        <td className="py-2 px-3 text-right">
                          {isWon1 ? (
                            <span className="text-blue-400 font-bold">✅ Menang {p1?.name?.slice(0, 10) || 'P1'}</span>
                          ) : isWon2 ? (
                            <span className="text-emerald-400 font-bold">✅ Menang {p2?.name?.slice(0, 10) || 'P2'}</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-900 font-black text-lime-400 border-t border-slate-700">
                    <td className="py-2 px-3">TOTAL</td>
                    <td className="py-2 px-3 font-score text-sm">{matchWinnerStatus.pointsWon1} Poin ({matchWinnerStatus.setsWon1} Set)</td>
                    <td className="py-2 px-3 font-score text-sm">{matchWinnerStatus.pointsWon2} Poin ({matchWinnerStatus.setsWon2} Set)</td>
                    <td className="py-2 px-3 text-right text-xs">
                      Selisih: {matchWinnerStatus.pointsWon1 - matchWinnerStatus.pointsWon2 > 0 ? `+${matchWinnerStatus.pointsWon1 - matchWinnerStatus.pointsWon2}` : matchWinnerStatus.pointsWon1 - matchWinnerStatus.pointsWon2} Poin
                    </td>
                  </tr>
                </tbody>
              </table>
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

          {/* Walkover / Cedera Declaration Box */}
          <div className="p-3.5 bg-rose-950/30 border border-rose-800/40 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                <Flag className="w-4 h-4 text-rose-400" />
                <span>Deklarasi Walkover (WO) / Menyerah (Cedera):</span>
              </div>
              {status === 'WALKOVER' && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black animate-pulse">
                  STATUS: WALKOVER
                </span>
              )}
            </div>

            {status === 'WALKOVER' ? (
              <div className="flex items-center justify-between p-2.5 bg-rose-900/20 border border-rose-800/50 rounded-xl gap-2">
                <div className="text-xs text-rose-200">
                  ⚠️ Pertandingan dinyatakan <strong>WALKOVER</strong>. Pemenang: <strong>{tournament.participants.find(p => p.id === winnerId)?.name || 'Pemenang WO'}</strong>.
                </div>
                <button
                  type="button"
                  onClick={handleCancelWalkover}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Batalkan WO</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDeclareWalkover(1)}
                  disabled={!p1 || !p2}
                  className="p-2 rounded-xl border border-rose-800/50 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold text-left transition-all flex items-center justify-between disabled:opacity-50"
                >
                  <span className="truncate">{p1?.name || 'Tim 1'} WO / Cedera</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200 whitespace-nowrap ml-1">
                    ➔ {p2?.name?.slice(0, 8) || 'Tim 2'} Menang
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeclareWalkover(2)}
                  disabled={!p1 || !p2}
                  className="p-2 rounded-xl border border-rose-800/50 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold text-left transition-all flex items-center justify-between disabled:opacity-50"
                >
                  <span className="truncate">{p2?.name || 'Tim 2'} WO / Cedera</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200 whitespace-nowrap ml-1">
                    ➔ {p1?.name?.slice(0, 8) || 'Tim 1'} Menang
                  </span>
                </button>
              </div>
            )}
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
