import { Tournament } from '@/types/tournament';
import { generateBracketMatches } from './bracketGenerator';

const badmintonParticipants = [
  { id: 'p_b1', name: 'Fajar Alfian / M. Rian Ardianto', player1: 'Fajar Alfian', player2: 'M. Rian Ardianto', seed: 1, club: 'PB Tangkas' },
  { id: 'p_b2', name: 'Bagas Maulana / M. Shohibul Fikri', player1: 'Bagas Maulana', player2: 'M. Shohibul Fikri', seed: 8, club: 'PB Djarum' },
  { id: 'p_b3', name: 'Leo Rolly Carnando / Daniel Marthin', player1: 'Leo Rolly Carnando', player2: 'Daniel Marthin', seed: 4, club: 'PB Exist' },
  { id: 'p_b4', name: 'Sabar Karyaman / M. Reza Pahlevi', player1: 'Sabar Karyaman', player2: 'M. Reza Pahlevi', seed: 5, club: 'PB Tangkas' },
  { id: 'p_b5', name: 'Pramudya Kusumawardana / Yeremia Rambitan', player1: 'Pramudya K.', player2: 'Yeremia R.', seed: 6, club: 'PB Jaya Raya' },
  { id: 'p_b6', name: 'Mohammad Ahsan / Hendra Setiawan', player1: 'Mohammad Ahsan', player2: 'Hendra Setiawan', seed: 3, club: 'PB Jaya Raya' },
  { id: 'p_b7', name: 'Rayhan Nur Fadillah / Rahmat Hidayat', player1: 'Rayhan N. F.', player2: 'Rahmat Hidayat', seed: 7, club: 'PB Djarum' },
  { id: 'p_b8', name: 'Kevin Sanjaya / Marcus Gideon', player1: 'Kevin Sanjaya', player2: 'Marcus Gideon', seed: 2, club: 'PB Djarum' },
];

const padelParticipants = [
  { id: 'p_p1', name: 'Arturo Coello / Agustín Tapia', player1: 'Arturo Coello', player2: 'Agustín Tapia', seed: 1, club: 'Bali Padel Club' },
  { id: 'p_p2', name: 'Alex Ruiz / Momo González', player1: 'Alex Ruiz', player2: 'Momo González', seed: 8, club: 'Jakarta Smash' },
  { id: 'p_p3', name: 'Franco Stupaczuk / Martin Di Nenno', player1: 'Franco Stupaczuk', player2: 'Martin Di Nenno', seed: 4, club: 'Canggu Arena' },
  { id: 'p_p4', name: 'Fede Chingotto / Javi Garrido', player1: 'Fede Chingotto', player2: 'Javi Garrido', seed: 5, club: 'Sanur Sports' },
  { id: 'p_p5', name: 'Paquito Navarro / Juan Lebrón', player1: 'Paquito Navarro', player2: 'Juan Lebrón', seed: 3, club: 'Seminyak Padel' },
  { id: 'p_p6', name: 'Maxi Sánchez / Lucho Capra', player1: 'Maxi Sánchez', player2: 'Lucho Capra', seed: 6, club: 'Uluwatu Padel' },
  { id: 'p_p7', name: 'Coki Nieto / Jon Sanz', player1: 'Coki Nieto', player2: 'Jon Sanz', seed: 7, club: 'Bali Padel Club' },
  { id: 'p_p8', name: 'Ale Galán / Mike Yanguas', player1: 'Ale Galán', player2: 'Mike Yanguas', seed: 2, club: 'Jakarta Smash' },
];

// Generate matches with initial scores
const badmintonMatches = generateBracketMatches('t_badminton_1', badmintonParticipants, ['Court 1', 'Court 2', 'Court 3']);

// Simulate live and finished matches for realistic initial experience
// Match 1: Finished (Fajar/Rian won vs Bagas/Fikri)
badmintonMatches[0].status = 'FINISHED';
badmintonMatches[0].scores = [
  { setNumber: 1, score1: 21, score2: 17 },
  { setNumber: 2, score1: 21, score2: 19 },
  { setNumber: 3, score1: 0, score2: 0 },
];
badmintonMatches[0].winnerId = 'p_b1';

// Match 2: LIVE right now!
badmintonMatches[1].status = 'LIVE';
badmintonMatches[1].scores = [
  { setNumber: 1, score1: 19, score2: 21 },
  { setNumber: 2, score1: 18, score2: 16 },
  { setNumber: 3, score1: 0, score2: 0 },
];
badmintonMatches[1].currentSet = 2;
badmintonMatches[1].servingSide = 1;

// Match 3: Finished (Ahsan/Hendra won)
badmintonMatches[2].status = 'FINISHED';
badmintonMatches[2].scores = [
  { setNumber: 1, score1: 18, score2: 21 },
  { setNumber: 2, score1: 21, score2: 15 },
  { setNumber: 3, score1: 21, score2: 18 },
];
badmintonMatches[2].winnerId = 'p_b6';

// Match 4: LIVE right now!
badmintonMatches[3].status = 'LIVE';
badmintonMatches[3].scores = [
  { setNumber: 1, score1: 21, score2: 14 },
  { setNumber: 2, score1: 15, score2: 12 },
  { setNumber: 3, score1: 0, score2: 0 },
];
badmintonMatches[3].currentSet = 2;
badmintonMatches[3].servingSide = 2;

// Update Semifinal with advance winners
// SF 1: Fajar/Rian vs TBD
const sf1 = badmintonMatches.find(m => m.round === 2 && m.matchOrder === 5);
if (sf1) {
  sf1.participant1 = badmintonParticipants[0]; // Fajar/Rian
}
// SF 2: Ahsan/Hendra vs TBD
const sf2 = badmintonMatches.find(m => m.round === 2 && m.matchOrder === 6);
if (sf2) {
  sf2.participant2 = badmintonParticipants[5]; // Ahsan/Hendra
}

// Generate Padel matches
const padelMatches = generateBracketMatches('t_padel_1', padelParticipants, ['Centre Court Padel', 'Court 2 Padel']);
padelMatches[0].status = 'FINISHED';
padelMatches[0].scores = [
  { setNumber: 1, score1: 6, score2: 4 },
  { setNumber: 2, score1: 6, score2: 2 },
  { setNumber: 3, score1: 0, score2: 0 },
];
padelMatches[0].winnerId = 'p_p1';

padelMatches[1].status = 'LIVE';
padelMatches[1].scores = [
  { setNumber: 1, score1: 6, score2: 7 },
  { setNumber: 2, score1: 5, score2: 4 },
  { setNumber: 3, score1: 0, score2: 0 },
];
padelMatches[1].currentSet = 2;
padelMatches[1].servingSide = 1;

export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 't_badminton_1',
    name: 'Jakarta Badminton Open Championship 2026',
    sport: 'BADMINTON',
    category: 'MEN_DOUBLES',
    categoryLabel: 'Ganda Putra (Men Doubles)',
    venue: 'Istora Senayan Gelora Bung Karno',
    city: 'Jakarta Pusat',
    startDate: '2026-08-20',
    endDate: '2026-08-23',
    status: 'LIVE',
    description: 'Turnamen bergengsi ganda putra mempertemukan atlet klub nasional terbaik dengan sistem gugur (knockout).',
    courts: ['Court 1', 'Court 2', 'Court 3'],
    participants: badmintonParticipants,
    matches: badmintonMatches,
    rules: {
      pointsPerSet: 21,
      maxSets: 3,
      deuceMargin: 2,
      maxPointCap: 30,
    },
    createdAt: '2026-08-10T10:00:00Z',
  },
  {
    id: 't_padel_1',
    name: 'Bali International Padel Masters 2026',
    sport: 'PADEL',
    category: 'OPEN_DOUBLES',
    categoryLabel: 'Ganda Open (Padel)',
    venue: 'Island Padel & Racket Club Canggu',
    city: 'Badung, Bali',
    startDate: '2026-08-28',
    endDate: '2026-08-30',
    status: 'LIVE',
    description: 'Kejuaraan padel terbuka di Bali dengan standar World Padel Tour set format (6 games per set).',
    courts: ['Centre Court Padel', 'Court 2 Padel'],
    participants: padelParticipants,
    matches: padelMatches,
    rules: {
      pointsPerSet: 6,
      maxSets: 3,
      deuceMargin: 2,
    },
    createdAt: '2026-08-12T14:00:00Z',
  },
];
