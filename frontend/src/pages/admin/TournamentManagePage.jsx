import React, { useState, useEffect } from 'react';
import AdminTournamentSection from '../../components/tournament_admin/AdminTournamentSection';
import TournamentActionModal from '../../components/tournament_admin/TournamentActionModal';
import { getTournaments } from '../../services/TournamentService';

// Mock/Default images 
import imgFootball from '../../assets/sportImages/football.jpg';
import imgBasketball from '../../assets/sportImages/basketball.png';
import imgCS from '../../assets/sportImages/cs.png';
import imgDota from '../../assets/sportImages/dota.png';
import imgBowling from '../../assets/sportImages/bowling.png';

const TournamentManagePage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const data = await getTournaments();
        
        // Map backend tournaments to components schema
        const mapped = data.map((t) => {
          // Prioritize tournament banner, then sport banner, then default images
          let image = t.tour_banner || t.sport_banner;
          if (!image) {
            const nameLower = (t.sport_name || '').toLowerCase();
            if (nameLower.includes('football') || nameLower.includes('soccer')) {
              image = imgFootball;
            } else if (nameLower.includes('basketball')) {
              image = imgBasketball;
            } else if (nameLower.includes('cs') || nameLower.includes('counter-strike')) {
              image = imgCS;
            } else if (nameLower.includes('dota')) {
              image = imgDota;
            } else if (nameLower.includes('bowling')) {
              image = imgBowling;
            } else {
              image = imgFootball;
            }
          }

          // Format dates
          const formatDate = (dateStr) => {
            if (!dateStr) return 'TBD';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'TBD';
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          };

          // Classify status: Active, Upcoming, Completed
          let status = 'Upcoming';
          const tourStatus = (t.tour_status || '').toLowerCase();
          if (tourStatus === 'ongoing' || tourStatus === 'active') {
            status = 'Active';
          } else if (tourStatus === 'completed') {
            status = 'Completed';
          } else if (tourStatus === 'draft' || tourStatus === 'ready') {
            status = 'Upcoming';
          } else {
            // Infer status from dates if not explicit
            const now = new Date();
            const start = t.tour_startdate ? new Date(t.tour_startdate) : null;
            const end = t.tour_enddate ? new Date(t.tour_enddate) : null;
            if (start && start > now) {
              status = 'Upcoming';
            } else if (end && end < now) {
              status = 'Completed';
            } else if (start && (!end || end >= now)) {
              status = 'Active';
            }
          }

          // Format name label
          const formatMapping = {
            'single_elim': 'Single Elimination',
            'double_elim': 'Double Elimination',
            'round_robin': 'Round Robin',
            'hybrid': 'Hybrid',
          };
          const formatName = formatMapping[t.tour_format] || t.tour_format || 'TBD';

          return {
            id: t.tour_id,
            title: t.tour_name,
            image,
            format: formatName,
            startDate: formatDate(t.tour_startdate),
            endDate: formatDate(t.tour_enddate),
            completedMatches: 0,
            totalMatches: 0,
            matchesLabel: 'matches',
            teamsCount: t.competitor_count || 0,
            participantsLabel: (Number(t.team_size) === 1 || Number(t.tour_team_size) === 1) ? 'participants' : 'teams',
            liveCount: tourStatus === 'ongoing' ? 1 : 0,
            status
          };
        });

        setTournaments(mapped);
      } catch (err) {
        console.error('Failed to load tournaments:', err);
        setError('Could not load tournaments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const activeTournaments = tournaments.filter(t => t.status === 'Active');
  const upcomingTournaments = tournaments.filter(t => t.status === 'Upcoming');
  const completedTournaments = tournaments.filter(t => t.status === 'Completed');

  return (
    <>
      <div className="flex flex-col font-['Inter',_'Segoe_UI',_system-ui,_sans-serif] pb-10">
        <div className="px-6 py-6 md:px-10 md:py-8">
          <div className="max-w-[1200px] mx-auto w-full">
            <h1 className="text-2xl md:text-[28px] font-bold text-slate-800 mb-1">Tournament Management</h1>
            <p className="text-[14px] font-medium text-slate-500 mb-10">
              Select a tournament to manage its matches, scores, and participants.
            </p>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-[#3b82f6] rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg w-full" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200 w-full mx-auto">
                <p className="text-slate-500 font-medium mb-2">No tournaments found.</p>
                <p className="text-slate-400 text-sm">Create a tournament using the setup wizard to get started.</p>
              </div>
            ) : (
              <div className="flex flex-col w-full">
              {activeTournaments.length > 0 && (
                <AdminTournamentSection
                  title="Active Tournaments"
                  pillColorClass="bg-[#22c55e]"
                  tournaments={activeTournaments}
                  onCardClick={setSelectedTournament}
                />
              )}

              {upcomingTournaments.length > 0 && (
                <AdminTournamentSection
                  title="Upcoming Tournaments"
                  pillColorClass="bg-[#94a3b8]"
                  tournaments={upcomingTournaments}
                  onCardClick={setSelectedTournament}
                />
              )}

              {completedTournaments.length > 0 && (
                <AdminTournamentSection
                  title="Completed Tournaments"
                  pillColorClass="bg-[#3b82f6]"
                  tournaments={completedTournaments}
                  onCardClick={setSelectedTournament}
                />
              )}

              {activeTournaments.length === 0 && upcomingTournaments.length === 0 && completedTournaments.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  No active, upcoming, or completed tournaments found.
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      <TournamentActionModal
        tournament={selectedTournament}
        onClose={() => setSelectedTournament(null)}
        onDeleted={(id) => {
          setTournaments(prev => prev.filter(t => t.id !== id));
          setFilteredTournaments(prev => prev.filter(t => t.id !== id));
        }}
      />
    </>
  );
};

export default TournamentManagePage;
