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
import { getPublicTournaments } from '../../services/TournamentService'
import { getPublicMatchesBySport } from '../../services/MatchService'

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
    score1: r1?.score ?? 0,
    score2: r2?.score ?? 0,
    status: mapCardStatus(match.status),
    startTime: match.scheduled_start,
    isRoundScoring: false,
  };
};

const mapRoundScoringMatch = (match) => ({
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
  participants: (match.round_scores || []).map((row) => ({
    name: row.comp_name || 'Unknown',
    score: row.score ?? 0,
  })),
});

const SportsPage = () => {
  const { id } = useParams()

  const [sportInfo, setSportInfo] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isOpenOngoing, setIsOpenOngoing] = useState(true);
  const [isOpenUpcoming, setIsOpenUpcoming] = useState(true);
  const [isOpenCompleted, setIsOpenCompleted] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        const mapped = (res.data || res || []).map((t) => {
          const formatDate = (dateStr) => {
            if (!dateStr) return 'TBD';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'TBD';
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          };

          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const start = t.tour_startdate ? new Date(t.tour_startdate) : null;
          if (start) start.setHours(0, 0, 0, 0);
          const end = t.tour_enddate ? new Date(t.tour_enddate) : null;
          if (end) end.setHours(23, 59, 59, 999);

          let status = 'Upcoming';
          if (t.tour_status === 'completed') {
            status = 'Ended';
          } else if (start && start > now) {
            status = 'Upcoming';
          } else if (end && end < now) {
            status = 'Ended';
          } else if (start && (!end || end >= now)) {
            status = 'Ongoing';
          }

          return {
            id: t.tour_id,
            name: t.tour_name,
            startDate: formatDate(t.tour_startdate),
            endDate: formatDate(t.tour_enddate),
            status,
            image: t.tour_banner || t.sport_banner,
            location: t.tour_locat,
            description: t.tour_descrip
          };
        });
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
      <div className='h-[80px] md:h-full w-full overflow-hidden'>
        <img
          src={sportInfo?.data?.banner}
          alt={id}
          className='h-full w-full object-cover object-center'
          onLoad={() => setImageLoaded(true)}
        />
      </div>
      <div className='flex items-center bg-[#d9d9d9]/50 h-[70px] px-[5%] md:px-[10%] text-[#123836] text-[20px] md:text-[30px] font-semibold w-full'>
        <div className='w-[60%]'>Recent Matches</div>
        <div className='w-[40%] ml-5'>Tournament List</div>
      </div>
      <div className='flex flex-col md:flex-row px-[5%] md:px-[10%] py-5'>
        <div className='flex flex-col gap-10 w-full md:pr-5 md:w-[60%] md:border-r border-[#d9d9d9]'>
          {matches.length > 0 ? (
            matches.map((match) => (
              match.isRoundScoring ? (
                <MatchLeaderBoardCard key={match.matchId} match={match} />
              ) : (
                <MatchScoreCard key={match.matchId} match={match} />
              )
            ))
          ) : (
            <span className='text-[14px] text-gray-400'>No recent matches.</span>
          )}
        </div>
        <div className='flex flex-col w-full md:w-[40%] md:ml-5 gap-3'>
          <input
            type='text'
            placeholder='Search tournament...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full border border-[#d9d9d9] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#123836] transition-colors duration-200 mt-5 md:mt-0'
          />
          <div className='flex items-center gap-3'>
            <div className='w-[50%]'>
              <InputField
                label='From:'
                type='date'
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className='w-[50%]'>
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
              {filteredOngoing.length > 0 ? filteredOngoing.map((tournament, index) => (
                <TournamentCard key={index} tournament={tournament} />
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
              {filteredUpcoming.length > 0 ? filteredUpcoming.map((tournament, index) => (
                <TournamentCard key={index} tournament={tournament} />
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
              {filteredCompleted.length > 0 ? filteredCompleted.map((tournament, index) => (
                <TournamentCard key={index} tournament={tournament} />
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
