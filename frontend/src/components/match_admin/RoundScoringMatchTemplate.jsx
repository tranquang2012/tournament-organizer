import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartColumn, faTableCells, faTrophy, faCalendarDays, faBolt, faClock, faCheck, faChartBar } from '@fortawesome/free-solid-svg-icons';
import GlobalLeaderboard from './GlobalLeaderboard';
import RoundEntryTable from './RoundEntryTable';
import MatchStatModal from './MatchStatModal';
import { getParticipants, getTournamentStages, submitRoundScores } from '../../services/TournamentService';
import imgFootball from '../../assets/sportImages/football.jpg';

const TABS = [
  { id: 'dashboard', label: 'Match Dashboard', icon: faChartColumn },
  { id: 'roundEntry', label: 'Round Entry', icon: faTableCells },
  { id: 'stats', label: 'Match Stats', icon: faChartBar },
];

const mapRoundStatus = (status) => {
  if (status === 'completed') return 'Completed';
  if (status === 'ready' || status === 'running') return 'In Progress';
  return 'Upcoming';
};

const extractStandingsPayload = (payload) => {
  if (!payload || Array.isArray(payload) || !Array.isArray(payload.rounds)) return null;
  return payload;
};

const RoundScoringMatchTemplate = ({ tournament }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [participants, setParticipants] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statsRound, setStatsRound] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!tournament?.tour_id) return;

      try {
        setIsLoading(true);
        setError(null);

        const [participantData, stagesPayload] = await Promise.all([
          getParticipants(tournament.tour_id),
          getTournamentStages(tournament.tour_id).catch((err) => {
            const status = err.response?.status;
            if (status === 404) return null;
            throw err;
          }),
        ]);

        const standings = extractStandingsPayload(stagesPayload);
        const mappedRounds = (standings?.rounds || []).map((round) => ({
          id: String(round.match_id),
          matchId: round.match_id,
          label: `Round ${round.round}`,
          status: mapRoundStatus(round.status),
          rawStatus: round.status,
          roundNumber: round.round,
          roundScores: round.round_scores || [],
        }));

        const scoreLookup = {};
        const latestCompleted = [...mappedRounds]
          .filter((round) => round.rawStatus === 'completed')
          .sort((a, b) => a.roundNumber - b.roundNumber)
          .slice(-1)[0];

        mappedRounds.forEach((round) => {
          (round.roundScores || []).forEach((entry) => {
            if (!entry?.comp_id) return;
            if (!scoreLookup[entry.comp_id]) scoreLookup[entry.comp_id] = {};
            scoreLookup[entry.comp_id][round.id] = entry.score;
          });
        });

        const latestStatusByComp = {};
        (latestCompleted?.roundScores || []).forEach((entry) => {
          latestStatusByComp[entry.comp_id] = entry.eliminated ? 'Eliminated' : 'Active';
        });

        const mappedParticipants = (participantData || []).map((participant, index) => {
          const roundScores = {};
          mappedRounds.forEach((round) => {
            const score = scoreLookup[participant.id]?.[round.id];
            roundScores[round.id] = score != null ? score : null;
          });

          const numericScores = Object.values(roundScores).filter((score) => score != null);
          const status = latestCompleted
            ? (latestStatusByComp[participant.id] || 'Eliminated')
            : 'Active';

          return {
            id: participant.id,
            rank: index + 1,
            name: participant.name,
            logo: participant.logo,
            status,
            rounds: roundScores,
            best: numericScores.length ? Math.max(...numericScores) : 0,
            total: numericScores.reduce((sum, score) => sum + Number(score), 0),
          };
        });

        mappedParticipants.sort((a, b) => {
          if (a.status !== b.status) return a.status === 'Active' ? -1 : 1;
          return b.total - a.total || a.name.localeCompare(b.name);
        });
        mappedParticipants.forEach((participant, index) => {
          participant.rank = index + 1;
        });

        setRounds(mappedRounds);
        setParticipants(mappedParticipants);
      } catch (err) {
        console.error('Failed to fetch round scoring data:', err);
        setError(err.response?.data?.error?.message || err.message || 'Failed to load round scoring data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tournament, refreshTrigger]);

  const handleSubmitScores = async (round, scores) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await submitRoundScores(tournament.tour_id, round.matchId, scores);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to submit scores';
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'TBD';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const liveCount = rounds.filter((round) => round.status === 'In Progress').length;
  const upcomingCount = rounds.filter((round) => round.status === 'Upcoming').length;
  const completedCount = rounds.filter((round) => round.status === 'Completed').length;
  const percentage = rounds.length > 0 ? Math.round((completedCount / rounds.length) * 100) : 0;

  let progressBarColor = 'bg-[#ef4444]';
  if (percentage >= 80) progressBarColor = 'bg-[#3b82f6]';
  else if (percentage >= 60) progressBarColor = 'bg-[#22c55e]';
  else if (percentage >= 40) progressBarColor = 'bg-[#eab308]';
  else if (percentage >= 20) progressBarColor = 'bg-[#f97316]';

  const startDate = formatDate(tournament.tour_startdate);
  const endDate = formatDate(tournament.tour_enddate);
  const bannerImage = tournament.tour_banner || tournament.sport_banner || imgFootball;
  const sportName = tournament.sport_name || 'Sport';

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

  const emptyState = useMemo(() => (
    <div className="py-12 text-center text-slate-400 font-medium bg-white rounded-xl border border-dashed border-slate-300">
      No rounds found. Generate matches to start round scoring.
    </div>
  ), []);

  return (
    <div className="flex flex-col font-['Inter',_'Segoe_UI',_system-ui,_sans-serif] w-full">

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
                {sportName} - Round Scoring
              </span>
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarDays} className="text-slate-400" />
                {startDate} - {endDate}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">
              <FontAwesomeIcon icon={faBolt} className="text-orange-500 text-lg" />
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-none">{liveCount}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Open</span>
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

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[20vh]">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#123836] rounded-full animate-spin" />
        </div>
      ) : rounds.length === 0 ? (
        emptyState
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <div className="animate-[fadeIn_0.2s_ease-out]">
              <GlobalLeaderboard participants={participants} rounds={rounds} />
            </div>
          )}

          {activeTab === 'roundEntry' && (
            <div className="animate-[fadeIn_0.2s_ease-out]">
              <RoundEntryTable
                participants={participants}
                rounds={rounds}
                onSubmit={handleSubmitScores}
                isSubmitting={isSubmitting}
                onOpenStats={setStatsRound}
              />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="animate-[fadeIn_0.2s_ease-out]">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800">Match Stats</h2>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    Track round-level and participant stats for each scoring round
                  </p>
                </div>
                <div className="divide-y divide-slate-100">
                  {rounds.map((round) => {
                    let badgeColor = 'bg-slate-50 text-slate-500 border border-slate-200';
                    let dotColor = 'bg-slate-400';
                    if (round.status === 'In Progress') {
                      badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                      dotColor = 'bg-emerald-500';
                    } else if (round.status === 'Completed') {
                      badgeColor = 'bg-blue-50 text-blue-700 border border-blue-100';
                      dotColor = 'bg-blue-500';
                    }

                    return (
                      <div key={round.id} className="px-5 py-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-slate-800 m-0">{round.label}</p>
                          <span className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                            {round.status}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStatsRound(round)}
                          className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer flex items-center gap-2"
                        >
                          <FontAwesomeIcon icon={faChartBar} />
                          Stats
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {statsRound && (
        <MatchStatModal
          matchId={statsRound.matchId}
          participants={participants}
          subtitle={statsRound.label}
          onClose={() => setStatsRound(null)}
        />
      )}

    </div>
  );
};

export default RoundScoringMatchTemplate;
