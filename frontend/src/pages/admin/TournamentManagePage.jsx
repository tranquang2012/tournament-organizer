import React from 'react';
import AdminTournamentSection from '../../components/tournament_admin/AdminTournamentSection';

// Mock images 
import imgFootball from '../../assets/sportImages/football.jpg';
import imgBasketball from '../../assets/sportImages/basketball.png';
import imgCS from '../../assets/sportImages/cs.png';
import imgDota from '../../assets/sportImages/dota.png';
import imgBowling from '../../assets/sportImages/bowling.png';

const mockTournaments = [
  // Ongoing Tournaments
  {
    id: 1,
    title: 'Netcompany Football Championship',
    image: imgFootball,
    format: 'Single Elimination',
    startDate: '05/05/2026',
    endDate: '18/05/2026',
    completedMatches: 2,
    totalMatches: 7,
    matchesLabel: 'matches',
    teamsCount: 8,
    participantsLabel: 'teams',
    liveCount: 1,
    status: 'Ongoing'
  },
  {
    id: 2,
    title: 'Netcompany Badminton Championship',
    image: imgBasketball, 
    format: 'Round Robin',
    startDate: '05/05/2026',
    endDate: '18/05/2026',
    completedMatches: 3,
    totalMatches: 6,
    matchesLabel: 'matches',
    teamsCount: 4,
    participantsLabel: 'teams',
    liveCount: 1,
    status: 'Ongoing'
  },
  {
    id: 3,
    title: 'Netcompany CS Cup',
    image: imgCS,
    format: 'Round Scoring',
    startDate: '05/05/2026',
    endDate: '18/05/2026',
    completedMatches: 2,
    totalMatches: 3,
    matchesLabel: 'rounds',
    teamsCount: 8,
    participantsLabel: 'participants',
    liveCount: 1,
    status: 'Ongoing'
  },
  {
    id: 4,
    title: 'Netcompany Bowling Tournament',
    image: imgBowling,
    format: 'High Score',
    startDate: '06/05/2026',
    endDate: '10/05/2026',
    completedMatches: 1,
    totalMatches: 10,
    matchesLabel: 'matches',
    teamsCount: 16,
    participantsLabel: 'participants',
    liveCount: 0,
    status: 'Ongoing'
  },

  // Upcoming Tournaments
  {
    id: 5,
    title: 'Netcompany Football Championship',
    image: imgFootball,
    format: 'Single Elimination',
    startDate: '05/05/2026',
    endDate: '18/05/2026',
    completedMatches: 0,
    totalMatches: 7,
    matchesLabel: 'matches',
    teamsCount: 8,
    participantsLabel: 'teams',
    liveCount: 1,
    status: 'Upcoming'
  },
  {
    id: 6,
    title: 'Netcompany Badminton Championship',
    image: imgBasketball,
    format: 'Round Robin',
    startDate: '05/05/2026',
    endDate: '18/05/2026',
    completedMatches: 0,
    totalMatches: 6,
    matchesLabel: 'matches',
    teamsCount: 4,
    participantsLabel: 'teams',
    liveCount: 1,
    status: 'Upcoming'
  },
  {
    id: 7,
    title: 'Netcompany CS Cup',
    image: imgCS,
    format: 'Round Scoring',
    startDate: '05/05/2026',
    endDate: '18/05/2026',
    completedMatches: 0,
    totalMatches: 2,
    matchesLabel: 'rounds',
    teamsCount: 8,
    participantsLabel: 'participants',
    liveCount: 1,
    status: 'Upcoming'
  },

  // Completed Tournaments
  {
    id: 8,
    title: 'Netcompany Football Championship',
    image: imgFootball,
    format: 'Single Elimination',
    startDate: '05/05/2026',
    endDate: '18/05/2026',
    completedMatches: 7,
    totalMatches: 7,
    matchesLabel: 'matches',
    teamsCount: 8,
    participantsLabel: 'teams',
    liveCount: 0,
    status: 'Completed'
  },
  {
    id: 9,
    title: 'Netcompany Badminton Championship',
    image: imgBasketball,
    format: 'Round Robin',
    startDate: '05/05/2026',
    endDate: '18/05/2026',
    completedMatches: 6,
    totalMatches: 6,
    matchesLabel: 'matches',
    teamsCount: 4,
    participantsLabel: 'teams',
    liveCount: 0,
    status: 'Completed'
  },
  {
    id: 10,
    title: 'Netcompany CS Cup',
    image: imgCS,
    format: 'Round Scoring',
    startDate: '05/05/2026',
    endDate: '18/05/2026',
    completedMatches: 2,
    totalMatches: 2,
    matchesLabel: 'rounds',
    teamsCount: 8,
    participantsLabel: 'participants',
    liveCount: 0,
    status: 'Completed'
  },
  {
    id: 11,
    title: 'Netcompany Dota 2 Invitational',
    image: imgDota,
    format: 'Double Elimination',
    startDate: '01/04/2026',
    endDate: '15/04/2026',
    completedMatches: 14,
    totalMatches: 14,
    matchesLabel: 'matches',
    teamsCount: 8,
    participantsLabel: 'teams',
    liveCount: 0,
    status: 'Completed'
  }
];

const TournamentManagePage = () => {
  const ongoingTournaments = mockTournaments.filter(t => t.status === 'Ongoing');
  const upcomingTournaments = mockTournaments.filter(t => t.status === 'Upcoming');
  const completedTournaments = mockTournaments.filter(t => t.status === 'Completed');

  return (
    <div className="flex flex-col font-['Inter',_'Segoe_UI',_system-ui,_sans-serif] pb-10">
      <div className="px-6 py-6 md:px-10 md:py-8">
        <h1 className="text-2xl md:text-[28px] font-bold text-slate-800 mb-1">Tournament Management</h1>
        <p className="text-[14px] font-medium text-slate-500 mb-10">
          Select a tournament to manage its matches, scores, and participants.
        </p>

        <div className="flex flex-col max-w-[1200px]">
          <AdminTournamentSection 
            title="Ongoing Tournaments" 
            pillColorClass="bg-[#22c55e]" 
            tournaments={ongoingTournaments} 
          />
          
          <AdminTournamentSection 
            title="Upcoming Tournaments" 
            pillColorClass="bg-[#94a3b8]" 
            tournaments={upcomingTournaments} 
          />

          <AdminTournamentSection 
            title="Completed Tournaments" 
            pillColorClass="bg-[#3b82f6]" 
            tournaments={completedTournaments} 
          />
        </div>
      </div>
    </div>
  );
};

export default TournamentManagePage;
