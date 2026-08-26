import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'

//import component
import MatchScoreCard from '../../components/match_public/MatchScoreCard'
import MatchLeaderBoardCard from '../../components/match_public/MatchLeaderBoardCard'
import TournamentCard from '../../components/tournament_public/TournamentCard'
import TopLoadingBar from '../../components/common/TopLoadingBar'
import InputField from '../../components/common/InputField'

//import endpoints
import { getSportInformation } from '../../services/SportService'
import { getPublicTournaments, getSportRules } from '../../services/TournamentService'
import { getPublicMatchesBySport } from '../../services/MatchService'
import { listFavorites } from '../../services/FavoriteService'
import { useAuth } from '../../hooks/useAuth'
import { mapPublicTournamentToCard } from '../../utils/tournamentCardMapper'

import logo1 from '../../assets/defaultTeamLogos/logo1.jpg'
import logo2 from '../../assets/defaultTeamLogos/logo2.jpg'
import playerLogo from '../../assets/playerLogo.png'

const isIndividualMatch = (match) => (
  match.participant_type === 'individual'
  || match.competitors?.some((c) => c.comp_size === 1)
);

const resolveCompetitorLogo = (competitor, isIndividual, teamDefault) => (
  competitor?.comp_logo
  || ((isIndividual || competitor?.comp_size === 1) ? playerLogo : teamDefault)
);

const formatScheduledDate = (isoStr) => {
  if (!isoStr) return 'TBD';
  const d = new Date(isoStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const formatScheduledTime = (isoStr) => {
  if (!isoStr) return 'TBD';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const isRoundScoringMatch = (match) => (
  match.tour_format === 'round_scoring'
  || match.stage === 'round_scoring'
  || (match.stage === 'stage_1' && match.first_stage_format === 'round_scoring')
  || (match.stage === 'stage_2' && match.second_stage_format === 'round_scoring')
);

const mapCardStatus = (status) => {
  if (status === 'running') return 'ongoing';
  if (status === 'resolved') return 'completed';
  return status;
};

const mapVersusMatch = (match) => {
  const c1 = match.competitors?.[0];
  const c2 = match.competitors?.[1];
  const r1 = match.results?.[0];
  const r2 = match.results?.[1];
  const isIndividual = isIndividualMatch(match);

  return {
    matchId: match.match_id,
    tourId: match.tour_id,
    tournamentName: match.tour_name || '',
    matchNumber: match.round,
    matchLabel: match.match_label || null,
    round: match.group_name || match.stage || '',
    date: formatScheduledDate(match.scheduled_start),
    time: formatScheduledTime(match.scheduled_start),
    team1: c1?.comp_name || 'TBD',
    team2: c2?.comp_name || 'TBD',
    team1Logo: resolveCompetitorLogo(c1, isIndividual, logo1),
    team2Logo: resolveCompetitorLogo(c2, isIndividual, logo2),
    team1IsPlayer: isIndividual || c1?.comp_size === 1,
    team2IsPlayer: isIndividual || c2?.comp_size === 1,
    score1: r1?.score ?? 0,
    score2: r2?.score ?? 0,
    status: mapCardStatus(match.status),
    startTime: match.scheduled_start,
    isRoundScoring: false,
  };
};

const mapRoundScoringMatch = (match) => {
  const isIndividual = isIndividualMatch(match);

  return {
    matchId: match.match_id,
    tourId: match.tour_id,
    tournamentName: match.tour_name || '',
    matchNumber: match.round,
    matchLabel: match.match_label || null,
    round: match.group_name || match.stage || '',
    date: formatScheduledDate(match.scheduled_start),
    time: formatScheduledTime(match.scheduled_start),
    status: mapCardStatus(match.status),
    startTime: match.scheduled_start,
    isRoundScoring: true,
    isIndividual,
    participants: (match.round_scores || []).map((row) => ({
      name: row.comp_name || 'Unknown',
      score: row.score ?? 0,
      logo: row.comp_logo || (isIndividual ? playerLogo : logo1),
    })),
  };
};

const SportsPage = () => {
  const { id } = useParams()
  const { isLogin } = useAuth()

  const [sportInfo, setSportInfo] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isOpenOngoing, setIsOpenOngoing] = useState(true);
  const [isOpenUpcoming, setIsOpenUpcoming] = useState(true);
  const [isOpenCompleted, setIsOpenCompleted] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scoreMode, setScoreMode] = useState('points');

  const filterTournaments = (items) => {
    let result = items;

    if (searchQuery.trim()) {
      result = result.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(t => {
        const [day, month, year] = t.startDate.split('/');
        return new Date(`${year}-${month}-${day}`) >= from;
      })
    }

    if (dateTo) {
      const to = new Date(dateTo);
      result = result.filter(t => {
        const [day, month, year] = t.endDate.split('/');
        return new Date(`${year}-${month}-${day}`) <= to;
      })
    }

    return result;
  };

  const ongoingTournaments = tournaments.filter(t => t.status === 'Ongoing');
  const upcomingTournaments = tournaments.filter(t => t.status === 'Upcoming');
  const completedTournaments = tournaments.filter(t => t.status === 'Ended');

  const filteredOngoing = filterTournaments(ongoingTournaments);
  const filteredUpcoming = filterTournaments(upcomingTournaments);
  const filteredCompleted = filterTournaments(completedTournaments);

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsOpenOngoing(true);
      setIsOpenUpcoming(true);
      setIsOpenCompleted(true);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim() || dateFrom || dateTo) {
      setIsOpenOngoing(true);
      setIsOpenUpcoming(true);
      setIsOpenCompleted(true);
    }
  }, [searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    const loadScoreMode = async () => {
      const rules = await getSportRules();
      const sportId = parseInt(id, 10);
      setScoreMode(rules?.[sportId]?.score_mode || 'points');
    };
    if (id) loadScoreMode();
  }, [id]);

  useEffect(() => {
    const fetchSportInfo = async () => {
      setIsLoading(true);
      setImageLoaded(false);
      const info = await getSportInformation(id);
      setSportInfo(info);
    };
    fetchSportInfo();
  }, [id]);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await getPublicTournaments(id);
        const mapped = (res.data || res || []).map(mapPublicTournamentToCard);
        setTournaments(mapped);
      } catch (err) {
        console.error('Failed to fetch public tournaments:', err);
      }
    };
    if (id) {
      fetchTournaments();
    }
  }, [id]);

  useEffect(() => {
    if (!isLogin || !id) {
      setFavoriteIds(new Set());
      return;
    }

    const fetchFavorites = async () => {
      try {
        const favorites = await listFavorites();
        const ids = new Set(
          favorites.map((favorite) => favorite.tournament?.tour_id).filter(Boolean),
        );
        setFavoriteIds(ids);
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
      }
    };

    fetchFavorites();
  }, [isLogin, id]);

  const handleFavoriteChange = (tournamentId, isFavorite) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) {
        next.add(tournamentId);
      } else {
        next.delete(tournamentId);
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await getPublicMatchesBySport(id);
        const rows = res.data || res || [];
        const mapped = rows.map((match) => (
          isRoundScoringMatch(match) ? mapRoundScoringMatch(match) : mapVersusMatch(match)
        ));
        setMatches(mapped);
      } catch (err) {
        console.error('Failed to fetch recent matches:', err);
        setMatches([]);
      }
    };
    if (id) {
      fetchMatches();
    }
  }, [id]);

  useEffect(() => {
    if (imageLoaded) setIsLoading(false);
  }, [imageLoaded]);

  return (
    <div>
      <TopLoadingBar isLoading={isLoading} />
      <div className='h-40 md:h-[280px] w-full overflow-hidden'>
        <img
          src={sportInfo?.data?.banner}
          alt={id}
          className='h-full w-full object-cover object-center'
          onLoad={() => setImageLoaded(true)}
        />
      </div>
      <div className='hidden md:flex items-center bg-[#d9d9d9]/50 h-[70px] px-[5%] md:px-[10%] text-[#123836] text-[20px] md:text-[30px] font-semibold w-full'>
        <div className='w-[60%]'>Recent Matches</div>
        <div className='w-[40%] ml-5'>Tournament List</div>
      </div>
      <div className='flex flex-col md:flex-row px-[5%] md:px-[10%] py-5'>
        <div className='flex flex-col gap-10 w-full md:pr-5 md:w-[60%] md:border-r border-[#d9d9d9]'>
          <span className='md:hidden text-[#123836] text-[20px] font-semibold'>Recent Matches</span>
          {matches.length > 0 ? (
            matches.map((match) => (
              match.isRoundScoring ? (
                <MatchLeaderBoardCard key={match.matchId} match={match} scoreMode={scoreMode} />
              ) : (
                <MatchScoreCard key={match.matchId} match={match} />
              )
            ))
          ) : (
            <span className='text-[14px] text-gray-400'>No recent matches.</span>
          )}
        </div>
        <div className='flex flex-col w-full md:w-[40%] md:ml-5 gap-3'>
          <span className='md:hidden text-[#123836] text-[20px] font-semibold mt-6'>Tournament List</span>
          <input
            type='text'
            placeholder='Search tournament...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full border border-[#d9d9d9] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#123836] transition-colors duration-200 mt-5 md:mt-0'
          />
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
            <div className='w-full sm:w-[50%]'>
              <InputField
                label='From:'
                type='date'
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className='w-full sm:w-[50%]'>
              <InputField
                label='To:'
                type='date'
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className='flex items-center justify-between cursor-pointer' onClick={() => setIsOpenOngoing(!isOpenOngoing)}>
            <span className='text-[18px] md:text-[25px] font-semibold text-[#123836]'>Ongoing Tournaments</span>
            <FontAwesomeIcon icon={faChevronDown} className={`text-[20px] transition-transform duration-300 ${isOpenOngoing ? 'rotate-180' : ''}`} />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpenOngoing ? 'max-h-[600px] mb-3' : 'max-h-0'}`}>
            <div className='flex flex-col gap-5 max-h-[510px] overflow-y-auto pr-1'>
              {filteredOngoing.length > 0 ? filteredOngoing.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  isFavorite={favoriteIds.has(tournament.id)}
                  onFavoriteChange={handleFavoriteChange}
                />
              )) : (
                <span className='text-[14px] text-gray-400'>No tournaments found</span>
              )}
            </div>
          </div>
          <div className='flex items-center justify-between cursor-pointer' onClick={() => setIsOpenUpcoming(!isOpenUpcoming)}>
            <span className='text-[18px] md:text-[25px] font-semibold text-[#123836]'>Upcoming Tournaments</span>
            <FontAwesomeIcon icon={faChevronDown} className={`text-[20px] transition-transform duration-300 ${isOpenUpcoming ? 'rotate-180' : ''}`} />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpenUpcoming ? 'max-h-[600px] mb-3' : 'max-h-0'}`}>
            <div className='flex flex-col gap-5 max-h-[510px] overflow-y-auto pr-1'>
              {filteredUpcoming.length > 0 ? filteredUpcoming.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  isFavorite={favoriteIds.has(tournament.id)}
                  onFavoriteChange={handleFavoriteChange}
                />
              )) : (
                <span className='text-[14px] text-gray-400'>No tournaments found</span>
              )}
            </div>
          </div>
          <div className='flex items-center justify-between cursor-pointer' onClick={() => setIsOpenCompleted(!isOpenCompleted)}>
            <span className='text-[18px] md:text-[25px] font-semibold text-[#123836]'>Past Tournaments</span>
            <FontAwesomeIcon icon={faChevronDown} className={`text-[20px] transition-transform duration-300 ${isOpenCompleted ? 'rotate-180' : ''}`} />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpenCompleted ? 'max-h-[600px] mb-3' : 'max-h-0'}`}>
            <div className='flex flex-col gap-5 max-h-[510px] overflow-y-auto pr-1'>
              {filteredCompleted.length > 0 ? filteredCompleted.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  isFavorite={favoriteIds.has(tournament.id)}
                  onFavoriteChange={handleFavoriteChange}
                />
              )) : (
                <span className='text-[14px] text-gray-400'>No tournaments found</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SportsPage
