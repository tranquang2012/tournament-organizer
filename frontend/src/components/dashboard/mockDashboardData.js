/**
 * Mock data for the Admin Dashboard.
 * Replace with real API calls once backend endpoints are available.
 */

export const mockDashboardStats = {
  totalTournaments: 24,
  activeTournaments: 5,
  upcomingTournaments: 8,
  completedTournaments: 11,
  totalParticipants: 312,
  totalUsers: 187,
  adminUsers: 4,
  regularUsers: 183,
  matchesPlayed: 146,
  matchesInProgress: 12,
};

export const mockTournamentsBySport = [
  { label: 'Football', value: 6, color: '#22c55e' },
  { label: 'Basketball', value: 4, color: '#f97316' },
  { label: 'Badminton', value: 3, color: '#06b6d4' },
  { label: 'Counter Strike 2', value: 3, color: '#eab308' },
  { label: 'Dota 2', value: 3, color: '#ef4444' },
  { label: 'Valorant', value: 2, color: '#ec4899' },
  { label: 'Bowling', value: 2, color: '#8b5cf6' },
  { label: 'Ping Pong', value: 1, color: '#14b8a6' },
];

export const mockTournamentsByFormat = [
  { label: 'Single Elimination', value: 8, color: '#f59e0b' },
  { label: 'Double Elimination', value: 5, color: '#3b82f6' },
  { label: 'Round Robin', value: 5, color: '#22c55e' },
  { label: 'Round Scoring', value: 3, color: '#8b5cf6' },
  { label: 'Hybrid', value: 3, color: '#ec4899' },
];

export const mockRecentTournaments = [
  {
    id: 1,
    name: 'Summer Football Cup 2026',
    sport: 'Football',
    format: 'Single Elimination',
    status: 'Active',
    date: '2026-08-01',
  },
  {
    id: 2,
    name: 'CS2 Pro League Season 4',
    sport: 'Counter Strike 2',
    format: 'Double Elimination',
    status: 'Active',
    date: '2026-07-28',
  },
  {
    id: 3,
    name: 'Badminton Open Championship',
    sport: 'Badminton',
    format: 'Round Robin',
    status: 'Upcoming',
    date: '2026-08-10',
  },
  {
    id: 4,
    name: 'Dota 2 Community Cup',
    sport: 'Dota 2',
    format: 'Hybrid',
    status: 'Upcoming',
    date: '2026-08-15',
  },
  {
    id: 5,
    name: 'Basketball 3v3 Showdown',
    sport: 'Basketball',
    format: 'Single Elimination',
    status: 'Completed',
    date: '2026-07-20',
  },
];
