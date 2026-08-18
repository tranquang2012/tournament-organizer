import React, { useState, useMemo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableCells, faSitemap, faFilter, faTrophy, faCalendarDays, faBolt, faClock, faCheck } from '@fortawesome/free-solid-svg-icons';
import MatchCard from './MatchCard';
import BracketViewPlaceholder from './BracketViewPlaceholder';
import { getTournamentBracket } from '../../services/TournamentService';

// Mock images if tournament data is incomplete
import imgFootball from '../../assets/sportImages/football.jpg';

const TABS = [
  { id: 'dashboard', label: 'Match Dashboard', icon: faTableCells },
  { id: 'bracket', label: 'Bracket View', icon: faSitemap },
];

const EliminationMatchTemplate = ({ tournament }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [roundFilter, setRoundFilter] = useState('All Rounds');
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const data = await getTournamentBracket(tournament.tour_id);
        
        const mapped = (data || []).map(m => {
          let status = 'Upcoming';
          if (m.status === 'completed' || m.status === 'resolved' || m.status === 'bye') status = 'Completed';
          else if (m.status === 'running') status = 'Live';

          const comp1 = m.competitors?.find(c => c.comp_id === m.competitor1_id);
          const comp2 = m.competitors?.find(c => c.comp_id === m.competitor2_id);
          const result1 = m.results?.find(r => r.comp_id === m.competitor1_id);
          const result2 = m.results?.find(r => r.comp_id === m.competitor2_id);

          let startTime = '';
          let endTime = '';
          let date = '';
          if (m.scheduled_start) {
            const sd = new Date(m.scheduled_start);
            const year = sd.getFullYear();
            const month = String(sd.getMonth() + 1).padStart(2, '0');
            const day = String(sd.getDate()).padStart(2, '0');
            date = `${year}-${month}-${day}`;
            startTime = `${String(sd.getHours()).padStart(2, '0')}:${String(sd.getMinutes()).padStart(2, '0')}`;
          }
          if (m.scheduled_end) {
            const ed = new Date(m.scheduled_end);
            endTime = `${String(ed.getHours()).padStart(2, '0')}:${String(ed.getMinutes()).padStart(2, '0')}`;
          }

          return {
            id: m.match_id,
            status,
            round: m.group_name && m.group_name !== 'Group' ? `${m.group_name} - R${m.round}` : `Round ${m.round}`,
            team1: { id: m.competitor1_id, name: comp1?.comp_name || (m.status === 'bye' ? 'BYE' : 'TBD'), logo: comp1?.comp_logo, score: result1?.score || 0, winner: m.winning_competitor_id === m.competitor1_id },
            team2: { id: m.competitor2_id, name: comp2?.comp_name || (m.status === 'bye' ? 'BYE' : 'TBD'), logo: comp2?.comp_logo, score: result2?.score || 0, winner: m.winning_competitor_id === m.competitor2_id },
            startTime,
            endTime,
            date
          };
        });
        setMatches(mapped);
      } catch (err) {
        console.error('Failed to fetch matches:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (tournament?.tour_id) fetchMatches();
  }, [tournament, refreshTrigger]);

  const handleMatchUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Mock stats
  const totalMatches = matches.length;
  const liveCount = matches.filter(m => m.status === 'Live').length;
  const upcomingCount = matches.filter(m => m.status === 'Upcoming').length;
  const completedCount = matches.filter(m => m.status === 'Completed').length;

  const percentage = totalMatches > 0 ? Math.round((completedCount / totalMatches) * 100) : 0;

  let progressBarColor = 'bg-[#ef4444]';
  if (percentage >= 80) progressBarColor = 'bg-[#3b82f6]';
  else if (percentage >= 60) progressBarColor = 'bg-[#22c55e]';
  else if (percentage >= 40) progressBarColor = 'bg-[#eab308]';
  else if (percentage >= 20) progressBarColor = 'bg-[#f97316]';

  // Filter matches based on selected filters
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const matchStatus = statusFilter === 'All Status' || m.status === statusFilter;
      const matchRound = roundFilter === 'All Rounds' || m.round === roundFilter;
      return matchStatus && matchRound;
    });
  }, [matches, statusFilter, roundFilter]);

  // Unique rounds for dropdown
  const uniqueRounds = ['All Rounds', ...new Set(matches.map(m => m.round))];
  
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

  const startDate = formatDate(tournament.tour_startdate);
  const endDate = formatDate(tournament.tour_enddate);
  const bannerImage = tournament.tour_banner || tournament.sport_banner || imgFootball;

  const formatMapping = {
    'single_elimination': 'Single Elimination',
    'double_elimination': 'Double Elimination',
    'round_robin': 'Round Robin',
    'hybrid': 'Hybrid',
  };
  const formatName = formatMapping[tournament.tour_format] || tournament.tour_format || 'TBD';
  const sportName = tournament.sport_name || 'Sport';

  // Determine active status badge
  let statusBadge = 'Active';
  let badgeColor = 'bg-emerald-100 text-emerald-700';
  let badgeDotColor = 'bg-emerald-500';
  const tourStatus = (tournament.tour_status || '').toLowerCase();
  
  if (tourStatus === 'completed') {
    statusBadge = 'Completed';
    badgeColor = 'bg-blue-100 text-blue-800';
    badgeDotColor = 'bg-blue-500';
  } else if (tourStatus === 'draft' || tourStatus === 'ready') {
    statusBadge = 'Upcoming';
    badgeColor = 'bg-slate-100 text-slate-600';
    badgeDotColor = 'bg-slate-400';
  }

  return (
    <div className="flex flex-col font-['Inter',_'Segoe_UI',_system-ui,_sans-serif] w-full">
      
      {/* 1. Tournament Banner Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="h-32 md:h-40 w-full relative">
          <img src={bannerImage} alt={tournament.tour_name} className="w-full h-full object-cover" />
        </div>
        
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
                {tournament.tour_name}
              </h1>
              <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${badgeColor}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${badgeDotColor}`}></div>
                 {statusBadge}
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faTrophy} className="text-slate-400" />
                {sportName} - {formatName}
              </span>
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarDays} className="text-slate-400" />
                {startDate} - {endDate}
              </span>
            </div>
          </div>
        </div>
        
        {/* Match Stats & Progress Bar */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">
              <FontAwesomeIcon icon={faBolt} className="text-orange-500 text-lg" />
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-none">{liveCount}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Live</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
              <FontAwesomeIcon icon={faClock} className="text-slate-500 text-lg" />
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-none">{upcomingCount}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Upcoming</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
              <FontAwesomeIcon icon={faCheck} className="text-slate-400 text-lg" />
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-none">{completedCount}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Done</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 max-w-md w-full">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1.5">
              <span>Progress</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`} style={{ width: `${percentage}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tab Bar */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 self-start w-fit shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
              border-none cursor-pointer transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-[#123836] text-white shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }
            `}
          >
            <FontAwesomeIcon icon={tab.icon} className="text-xs" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="animate-[fadeIn_0.2s_ease-out]">
          
          {/* 3. Filter Bar */}
          <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-3 mb-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm px-2">
                <FontAwesomeIcon icon={faFilter} />
                Filter
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg focus:ring-[#123836] focus:border-[#123836] block px-3 py-2 cursor-pointer outline-none hover:bg-slate-100 transition-colors"
              >
                <option value="All Status">All Status</option>
                <option value="Live">Live</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
              </select>
              
              <select
                value={roundFilter}
                onChange={(e) => setRoundFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg focus:ring-[#123836] focus:border-[#123836] block px-3 py-2 cursor-pointer outline-none hover:bg-slate-100 transition-colors"
              >
                {uniqueRounds.map(round => (
                  <option key={round} value={round}>{round}</option>
                ))}
              </select>
            </div>
            
            <div className="text-sm font-bold text-slate-400 px-2">
              {filteredMatches.length} matches
            </div>
          </div>

          {/* 4. Match Cards */}
          <div className="flex flex-col gap-2">
            {isLoading ? (
               <div className="flex justify-center items-center min-h-[20vh]">
                 <div className="w-8 h-8 border-4 border-slate-200 border-t-[#123836] rounded-full animate-spin" />
               </div>
            ) : filteredMatches.length > 0 ? (
              filteredMatches.map(match => (
                <MatchCard key={match.id} match={match} onUpdate={handleMatchUpdate} />
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 font-medium bg-white rounded-xl border border-dashed border-slate-300">
                No matches found for the selected filters.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bracket' && (
        <div className="animate-[fadeIn_0.2s_ease-out]">
          <BracketViewPlaceholder />
        </div>
      )}

    </div>
  );
};

export default EliminationMatchTemplate;
