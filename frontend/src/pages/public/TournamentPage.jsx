import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDay, faCalendarCheck, faLocationPin } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'

//import component
import LeaderboardTable from '../../components/tournament_public/LeaderboardTable';
import TeamCard from '../../components/tournament_public/TeamCard';
import MatchCard from '../../components/tournament_public/MatchCard';
import ParticipantTable from '../../components/tournament_public/ParticipantTable';
import TournamentBracket from '../../components/tournament_public/TournamentBracket';

//import API
import {
  getParticipants,
  getPublicTournamentById,
  getTournamentBracket,
  getTournamentBrackets,
  getTournamentRankings
} from '../../services/TournamentService';

import logo1 from '../../assets/defaultTeamLogos/logo1.jpg'
import logo2 from '../../assets/defaultTeamLogos/logo2.jpg'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fcllhdeiknlthwqpafiy.supabase.co';
const PLAYER_DEFAULT_LOGO = `${supabaseUrl}/storage/v1/object/public/tournament-banners/default/playerLogo.png`;

const transformBackendMatchesToBracket = (backendMatches, format, isIndividual) => {
  if (!backendMatches || !Array.isArray(backendMatches)) return format === 'double_elimination' ? { upper: [], lower: [] } : [];

  // Sort matches by round, then match_id, to ensure consistent sequential numbering
  const sorted = [...backendMatches].sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return String(a.match_id).localeCompare(String(b.match_id));
  });

  let wbCount = 0;
  let lbCount = 0;
  let singleCount = 0;

  // Pre-calculate sequential names
  const matchNames = {};
  sorted.forEach(m => {
    const gName = m.group_name || '';
    let matchName = '';
    if (format === 'double_elimination') {
      if (gName === 'Grand Final') {
        matchName = 'Grand Final';
      } else if (gName === 'Lower Bracket') {
        lbCount++;
        matchName = `LB Match ${lbCount}`;
      } else {
        wbCount++;
        matchName = `WB Match ${wbCount}`;
      }
    } else if (format === 'single_elimination') {
      if (gName === 'Consolation Final') {
        matchName = 'Consolation Final';
      } else {
        singleCount++;
        matchName = `Match ${singleCount}`;
      }
    } else {
      singleCount++;
      matchName = `Match ${singleCount}`;
    }
    matchNames[m.match_id] = matchName;
  });

  const mapMatch = (m) => {
    let state = 'SCHEDULED';
    if (m.status === 'completed' || m.status === 'resolved' || m.status === 'bye') {
      state = 'DONE';
    } else if (m.status === 'running') {
      state = 'ONGOING';
    }

    const participants = [];
    
    // Competitors inside database match structure
    const comp1 = m.competitors?.find(c => c.comp_id === m.competitor1_id);
    const comp2 = m.competitors?.find(c => c.comp_id === m.competitor2_id);

    const result1 = m.results?.find(r => r.comp_id === m.competitor1_id);
    const result2 = m.results?.find(r => r.comp_id === m.competitor2_id);

    const isCompleted = m.status === 'completed' || m.status === 'resolved';

    if (m.competitor1_id) {
      participants.push({
        id: String(m.competitor1_id),
        name: comp1?.comp_name || 'TBD',
        logo: comp1?.comp_logo || (comp1?.comp_size === 1 || isIndividual ? PLAYER_DEFAULT_LOGO : logo1),
        isWinner: m.winning_competitor_id === m.competitor1_id,
        resultText: result1 ? String(result1.score) : '0',
        status: isCompleted ? 'PLAYED' : undefined
      });
    }

    if (m.competitor2_id) {
      participants.push({
        id: String(m.competitor2_id),
        name: comp2?.comp_name || 'TBD',
        logo: comp2?.comp_logo || (comp2?.comp_size === 1 || isIndividual ? PLAYER_DEFAULT_LOGO : logo2),
        isWinner: m.winning_competitor_id === m.competitor2_id,
        resultText: result2 ? String(result2.score) : '0',
        status: isCompleted ? 'PLAYED' : undefined
      });
    }

    while (participants.length < 2) {
      const idx = participants.length;
      participants.push({
        id: `tbd-${m.match_id}-${idx}`,
        name: m.status === 'bye' ? 'BYE' : 'TBD',
        logo: m.status === 'bye' ? null : (isIndividual ? PLAYER_DEFAULT_LOGO : (idx === 0 ? logo1 : logo2)),
        isWinner: false,
        resultText: '0',
        status: undefined
      });
    }

    const gName = m.group_name || '';
    let roundLabel = String(m.round);
    if (format === 'double_elimination') {
      if (gName === 'Grand Final') {
        roundLabel = 'Grand Final';
      } else if (gName === 'Lower Bracket') {
        roundLabel = `LB Round ${m.round}`;
      } else {
        roundLabel = `WB Round ${m.round}`;
      }
    }

    return {
      id: String(m.match_id),
      name: matchNames[m.match_id] || `Match ${m.match_id}`,
      nextMatchId: m.next_winner_match_id ? String(m.next_winner_match_id) : null,
      nextLooserMatchId: m.next_loser_match_id ? String(m.next_loser_match_id) : null,
      tournamentRoundText: roundLabel,
      startTime: m.scheduled_start ? new Date(m.scheduled_start).toLocaleDateString() : 'TBD',
      state,
      participants
    };
  };

  if (format === 'double_elimination') {
    const upper = [];
    const lower = [];

    backendMatches.forEach(m => {
      const mapped = mapMatch(m);
      const stageLower = (m.stage || '').toLowerCase();
      const groupLower = (m.group_name || '').toLowerCase();
      const isLoserBracket = stageLower.includes('lb') || 
                             stageLower.includes('loser') || 
                             groupLower.includes('loser') ||
                             groupLower.includes('lower');
      if (isLoserBracket) {
        lower.push(mapped);
      } else {
        upper.push(mapped);
      }
    });

    return { upper, lower };
  } else {
    return backendMatches.map(mapMatch);
  }
};

const computeGroupStandings = (matches, isIndividual) => {
  const groups = {};

  matches.forEach(m => {
    const groupName = m.group_name || 'Group A';
    if (!groups[groupName]) {
      groups[groupName] = {
        name: groupName,
        teamsMap: {}
      };
    }

    const g = groups[groupName];

    m.competitors?.forEach(c => {
      if (!c.comp_id || !c.comp_name || !c.comp_name.trim()) return;
      if (!g.teamsMap[c.comp_id]) {
        g.teamsMap[c.comp_id] = {
          comp_id: c.comp_id,
          name: c.comp_name,
          logo: c.comp_logo || (isIndividual ? PLAYER_DEFAULT_LOGO : logo1),
          win: 0,
          lose: 0,
          eliminated: false
        };
      }
    });

    if (m.status === 'completed' || m.status === 'resolved') {
      const winnerId = m.winning_competitor_id;
      if (winnerId) {
        if (g.teamsMap[winnerId]) {
          g.teamsMap[winnerId].win += 1;
        }
        m.competitors?.forEach(c => {
          if (c.comp_id && c.comp_id !== winnerId && g.teamsMap[c.comp_id]) {
            g.teamsMap[c.comp_id].lose += 1;
          }
        });
      }
    }
  });

  return Object.values(groups).map(g => {
    const teams = Object.values(g.teamsMap).sort((a, b) => {
      if (b.win !== a.win) return b.win - a.win;
      const aTotal = a.win + a.lose;
      const bTotal = b.win + b.lose;
      const aRate = aTotal > 0 ? a.win / aTotal : 0;
      const bRate = bTotal > 0 ? b.win / bTotal : 0;
      return bRate - aRate;
    });

    teams.forEach((t, index) => {
      t.rank = index + 1;
    });

    return {
      id: g.name,
      name: g.name,
      teams
    };
  });
};

const TournamentPage = () => {
  const { id } = useParams()
  const { state } = useLocation()

  const [tournament, setTournament] = useState(null)
  const [loadingTournament, setLoadingTournament] = useState(true)

  const [participants, setParticipants] = useState([])
  const [loadingParticipants, setLoadingParticipants] = useState(true)

  const [matches, setMatches] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(true)

  const [roundScoringData, setRoundScoringData] = useState(null)
  const [loadingRoundScoring, setLoadingRoundScoring] = useState(false)

  const [rankingsData, setRankingsData] = useState(null)
  const [loadingRankings, setLoadingRankings] = useState(false)

  const [selectedTab, setSelectedTab] = useState('standings') // 'standings' or 'matches'
  const [hybridMatchesTab, setHybridMatchesTab] = useState('group') // 'group' or 'elimination'

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoadingTournament(true);
        const t = await getPublicTournamentById(id);
        if (t) {
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

          setTournament({
            id: t.tour_id,
            name: t.tour_name,
            startDate: formatDate(t.tour_startdate),
            endDate: formatDate(t.tour_enddate),
            status,
            image: t.tour_banner || t.sport_banner,
            location: t.tour_locat,
            description: t.tour_descrip,
            format: t.tour_format,
            first_stage_format: t.first_stage_format,
            second_stage_format: t.second_stage_format,
            advance_per_group: t.advance_per_group
          });
          if (t.tour_format === 'hybrid') {
            setSelectedTab('group_stage');
          }
        }
      } catch (err) {
        console.error('Failed to fetch tournament details:', err);
      } finally {
        setLoadingTournament(false);
      }
    };

    if (id) {
      fetchTournament();
    }
  }, [id]);

  useEffect(() => {
    const fetchParticipantsData = async () => {
      try {
        setLoadingParticipants(true);
        const data = await getParticipants(id)
        setParticipants(data)
      } catch (err) {
        console.error('Failed to fetch participants:', err)
      } finally {
        setLoadingParticipants(false)
      }
    }
    if (id) fetchParticipantsData()
  }, [id])

  useEffect(() => {
    const fetchMatchesData = async () => {
      if (!tournament) return;
      try {
        setLoadingMatches(true);
        if (tournament.format === 'round_scoring') {
          setLoadingRoundScoring(true);
          const standings = await getTournamentBrackets(id);
          setRoundScoringData(standings);
          setLoadingRoundScoring(false);
        } else {
          const flatMatches = await getTournamentBracket(id);
          setMatches(flatMatches);
        }
        setLoadingRankings(true);
        const ranks = await getTournamentRankings(id);
        setRankingsData(ranks);
        setLoadingRankings(false);
      } catch (err) {
        console.error('Failed to fetch matches data:', err);
      } finally {
        setLoadingMatches(false);
      }
    };
    if (id && tournament) {
      fetchMatchesData();
    }
  }, [id, tournament]);

  const getMatchesForRecentSection = (flatMatches, formatOverride = null) => {
    if (!flatMatches || !Array.isArray(flatMatches)) return [];

    const activeFormat = formatOverride || tournament?.format;
    const isIndividual = participants.length > 0
      ? participants[0].type === 'individual'
      : matches.some(m => m.competitors?.some(c => c.comp_size === 1));

    // Sort matches by round, then match_id, to ensure consistent sequential numbering
    const sorted = [...flatMatches].sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return String(a.match_id).localeCompare(String(b.match_id));
    });

    let wbCount = 0;
    let lbCount = 0;
    let singleCount = 0;
    const matchNumberMap = {};

    sorted.forEach(m => {
      const gName = m.group_name || '';
      let numStr = '';
      if (activeFormat === 'double_elimination') {
        if (gName === 'Grand Final') {
          numStr = 'GRAND FINAL';
        } else if (gName === 'Lower Bracket') {
          lbCount++;
          numStr = `LB ${lbCount}`;
        } else {
          wbCount++;
          numStr = `WB ${wbCount}`;
        }
      } else if (activeFormat === 'single_elimination') {
        if (gName === 'Consolation Final') {
          numStr = 'CONSOLATION FINAL';
        } else {
          singleCount++;
          numStr = String(singleCount);
        }
      } else {
        singleCount++;
        numStr = String(singleCount);
      }
      matchNumberMap[m.match_id] = numStr;
    });

    return flatMatches
      .filter(m => m.competitor1_id || m.competitor2_id)
      .map(m => {
        const comp1 = m.competitors?.find(c => c.comp_id === m.competitor1_id);
        const comp2 = m.competitors?.find(c => c.comp_id === m.competitor2_id);

        const result1 = m.results?.find(r => r.comp_id === m.competitor1_id);
        const result2 = m.results?.find(r => r.comp_id === m.competitor2_id);

        let status = 'Upcoming';
        if (m.status === 'completed' || m.status === 'resolved' || m.status === 'bye') {
          status = 'Completed';
        } else if (m.status === 'running') {
          status = 'Ongoing';
        }

        return {
          id: m.match_id,
          matchNumber: matchNumberMap[m.match_id] || m.match_id,
          status,
          team1: {
            name: comp1?.comp_name || (m.status === 'bye' ? 'BYE' : 'TBD'),
            logo: comp1?.comp_logo || (isIndividual ? PLAYER_DEFAULT_LOGO : logo1),
            score: result1 ? result1.score : 0
          },
          team2: {
            name: comp2?.comp_name || (m.status === 'bye' ? 'BYE' : 'TBD'),
            logo: comp2?.comp_logo || (isIndividual ? PLAYER_DEFAULT_LOGO : logo2),
            score: result2 ? result2.score : 0
          }
        };
      });
  };


  if (loadingTournament) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#123836] rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl font-semibold text-slate-800 mb-2">Tournament Not Found</h1>
        <p className="text-base text-slate-400">The tournament details could not be found.</p>
      </div>
    );
  }

  const isIndividual = participants.length > 0
    ? participants[0].type === 'individual'
    : matches.some(m => m.competitors?.some(c => c.comp_size === 1));

  const mainMatches = tournament.format === 'single_elimination'
    ? matches.filter(m => m.group_name !== 'Consolation Final')
    : tournament.format === 'hybrid'
      ? matches.filter(m => m.stage === 'stage_2' && (tournament.second_stage_format !== 'single_elimination' || m.group_name !== 'Consolation Final'))
      : matches;

  const bracketData = transformBackendMatchesToBracket(
    mainMatches,
    tournament.format === 'hybrid' ? tournament.second_stage_format : tournament.format,
    isIndividual
  );
  const groups = rankingsData?.groups?.map(g => ({
    id: g.group_name,
    name: g.group_name,
    teams: g.rankings.map(r => ({
      ...r,
      name: r.comp_name,
      logo: r.comp_logo || (isIndividual ? PLAYER_DEFAULT_LOGO : logo1),
      win: r.wins,
      lose: r.losses
    }))
  })) || [];
  const groupRecentMatches = tournament.format === 'hybrid'
    ? getMatchesForRecentSection(matches.filter(m => !m.stage || m.stage === 'stage_1'), 'round_robin')
    : [];
  const eliminationRecentMatches = tournament.format === 'hybrid'
    ? getMatchesForRecentSection(matches.filter(m => m.stage === 'stage_2'), tournament.second_stage_format)
    : [];
  const recentMatchesList = tournament.format === 'hybrid'
    ? [...groupRecentMatches, ...eliminationRecentMatches]
    : getMatchesForRecentSection(matches);


  return (
    <div>
      <div className='h-[100px] md:h-[320px] w-full overflow-hidden bg-[#123836]/50'>
        <img
          src={tournament.image}
          alt="banner"
          className='h-full w-full object-contain object-center'
        />
      </div>
      <div className='flex flex-col bg-[#d9d9d9]/50 px-[5%] md:px-[10%] py-[1%] w-full gap-4 md:gap-7 '>
        <div className='text-[#123836] text-[25px] md:text-[36px] font-semibold'>{tournament.name}</div>
        <span className='text-[13px] md:text-[18px]'>{tournament.description}</span>
        <div className='flex gap-3 md:gap-20'>
          <div className='flex gap-1 items-center'>
            <FontAwesomeIcon icon={faCalendarDay} className='text-[11px] md:text-[18px] text-[#123836]' />
            <span className='text-[11px] md:text-[18px]'>Start Date: {tournament.startDate}</span>
          </div>
          <div className='flex gap-1 items-center'>
            <FontAwesomeIcon icon={faCalendarCheck} className='text-[11px] md:text-[18px] text-[#123836]' />
            <span className='text-[11px] md:text-[18px]'>End Date: {tournament.endDate}</span>
          </div>
          <div className='flex gap-1 items-center'>
            <span className='text-[11px] md:text-[18px]'>Status: </span>
            <span className={`text-[13px] md:text-[18px] ${tournament.status === 'Ongoing' ? 'text-red-500' :
              tournament.status === 'Ended' ? 'text-green-500' : 'text-yellow-500'}`}
            >
              {tournament.status}
            </span>
          </div>
          <div className='flex gap-1 items-center'>
            <FontAwesomeIcon icon={faLocationPin} className='text-[13px] md:text-[18px] text-[#123836]' />
            <span className='text-[13px] md:text-[18px]'>Location: {tournament.location}</span>
          </div>
        </div>
      </div>

      <div className='flex mx-[5%] md:mx-[10%] py-[1%] gap-5 border-b border-gray-300'>
        {(tournament.format === 'hybrid'
          ? [
              { id: 'group_stage', name: 'Group Stage' },
              { id: 'elimination_stage', name: 'Elimination Stage' },
              { id: 'matches', name: 'Matches' }
            ]
          : [
              { id: 'standings', name: (tournament.format === 'single_elimination' || tournament.format === 'double_elimination') ? 'Bracket' : 'Standings' },
              { id: 'matches', name: 'Matches' }
            ]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-3 py-1 md:px-6 md:py-1.5 rounded-[15px] text-[13px] md:text-[18px] font-medium transition-colors
                ${selectedTab === tab.id
                ? 'bg-[#123836] text-white shadow-md'
                : 'bg-white text-[#123836] border border-gray-300 cursor-pointer hover:bg-[#123836]/50 hover:text-white hover:shadow-md shadow-sm'
              }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {selectedTab === 'standings' && (
        <>
          {(tournament.format === 'single_elimination' || tournament.format === 'double_elimination') && (
            <div className='flex flex-col mx-[5%] md:mx-[10%] py-[1%] gap-5 md:gap-10 border-b border-gray-300'>
              <span className='text-[#123836] font-semibold text-[18px] md:text-[32px]'>Knockout Stage</span>
              {matches.length > 0 ? (
                <TournamentBracket
                  mode={tournament.format === 'double_elimination' ? 'double' : 'single'}
                  matches={tournament.format === 'double_elimination' ? undefined : bracketData}
                  doubleMatches={tournament.format === 'double_elimination' ? bracketData : undefined}
                  showTabs={false}
                  onMatchClick={(match) => console.log('Clicked:', match)}
                />
              ) : (
                <div className='flex flex-col py-[5%] items-center justify-center text-gray-500'>
                  <span>No bracket matches generated yet.</span>
                </div>
              )}
            </div>
          )}

          {tournament.format === 'round_robin' && (
            <div className='flex flex-col mx-[5%] md:mx-[10%] py-[1%] gap-5 md:gap-10 border-b border-gray-300'>
              <span className='text-[#123836] font-semibold text-[18px] md:text-[32px]'>Group Stage</span>
              {groups.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-10 items-start'>
                  {groups.map((group) => (
                    <LeaderboardTable key={group.id} group={group} advanceCount={tournament.advance_per_group} />
                  ))}
                </div>
              ) : (
                <div className='flex flex-col py-[5%] items-center justify-center text-gray-500'>
                  <span>No group stages generated yet.</span>
                </div>
              )}
            </div>
          )}

          {tournament.format === 'round_scoring' && (
            <div className='flex flex-col mx-[5%] md:mx-[10%] py-[1%] gap-5 md:gap-10 border-b border-gray-300'>
              <span className='text-[#123836] font-semibold text-[18px] md:text-[32px]'>Standings</span>
              {loadingRoundScoring ? (
                <div className="flex justify-center items-center py-10">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-[#123836] rounded-full animate-spin" />
                </div>
              ) : roundScoringData && roundScoringData.standings && roundScoringData.standings.length > 0 ? (
                <div className='w-full flex flex-col rounded-[15px] border border-[#123836]/20 shadow-sm text-[13px] md:text-[18px]'>
                  <div className='flex bg-[#123836] text-white px-[1%] py-[1%] font-semibold text-center'>
                    <span className='w-[10%] border-r border-gray-300'>RANK</span>
                    <span className='w-[60%] border-r border-gray-300'>PARTICIPANTS</span>
                    <span className='w-[15%] border-r border-gray-300'>SCORE</span>
                    <span className='w-[15%]'>STATUS</span>
                  </div>
                  {roundScoringData.standings.map((row, index) => (
                    <div
                      key={index}
                      className={`flex mx-[1%] py-[1%] text-center items-center border-t border-gray-300 ${row.status === 'eliminated' ? 'text-gray-400' : 'font-semibold'}`}
                    >
                      <span className='w-[10%]'>{row.rank}</span>
                      <div className='w-[60%] flex gap-2 text-start items-center pl-[1%]'>
                        <img src={row.comp_logo || (isIndividual ? PLAYER_DEFAULT_LOGO : logo1)} className={`h-4 w-4 md:h-7 md:w-7 object-contain ${row.status === 'eliminated' && 'opacity-40'}`} />
                        <span>{row.comp_name}</span>
                      </div>
                      <span className='w-[15%]'>{row.score}</span>
                      <span className={`w-[15%] uppercase ${row.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>{row.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col py-[5%] items-center justify-center text-gray-500'>
                  <span>No standings available yet.</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {selectedTab === 'group_stage' && (
        <div className='flex flex-col mx-[5%] md:mx-[10%] py-[1%] gap-5 md:gap-10 border-b border-gray-300'>
          <span className='text-[#123836] font-semibold text-[18px] md:text-[32px]'>Group Stage Standings</span>
          {groups.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-10 items-start'>
              {groups.map((group) => (
                <LeaderboardTable key={group.id} group={group} advanceCount={tournament.advance_per_group} />
              ))}
            </div>
          ) : (
            <div className='flex flex-col py-[5%] items-center justify-center text-gray-500'>
              <span>No group stages generated yet.</span>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'elimination_stage' && (
        <div className='flex flex-col mx-[5%] md:mx-[10%] py-[1%] gap-5 md:gap-10 border-b border-gray-300'>
          <span className='text-[#123836] font-semibold text-[18px] md:text-[32px]'>Elimination Stage Bracket</span>
          {matches.filter(m => m.stage === 'stage_2').length > 0 ? (
            <TournamentBracket
              mode={tournament.second_stage_format === 'double_elimination' ? 'double' : 'single'}
              matches={tournament.second_stage_format === 'double_elimination' ? undefined : bracketData}
              doubleMatches={tournament.second_stage_format === 'double_elimination' ? bracketData : undefined}
              showTabs={false}
              onMatchClick={(match) => console.log('Clicked:', match)}
            />
          ) : (
            <div className='flex flex-col py-[5%] items-center justify-center text-gray-500'>
              <span>Elimination stage bracket has not been generated yet. It will be created once the group stage matches are completed.</span>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'matches' && (
        <div className='flex flex-col mx-[5%] md:mx-[10%] py-[1%] gap-5 md:gap-10 border-b border-gray-300'>
          <span className='text-[#123836] font-semibold text-[18px] md:text-[32px]'>Matches List</span>
          {tournament.format === 'hybrid' ? (
            <div>
              <div className='flex gap-4 mb-6'>
                <button
                  onClick={() => setHybridMatchesTab('group')}
                  className={`px-4 py-1.5 rounded-[15px] text-[13px] md:text-[18px] font-semibold transition-colors cursor-pointer ${
                    hybridMatchesTab === 'group'
                      ? 'bg-[#123836] text-white shadow-md'
                      : 'bg-white text-[#123836] border border-gray-300 hover:bg-[#123836]/50 hover:text-white shadow-sm'
                  }`}
                >
                  Group Stage Matches
                </button>
                <button
                  onClick={() => setHybridMatchesTab('elimination')}
                  className={`px-4 py-1.5 rounded-[15px] text-[13px] md:text-[18px] font-semibold transition-colors cursor-pointer ${
                    hybridMatchesTab === 'elimination'
                      ? 'bg-[#123836] text-white shadow-md'
                      : 'bg-white text-[#123836] border border-gray-300 hover:bg-[#123836]/50 hover:text-white shadow-sm'
                  }`}
                >
                  Elimination Stage Matches
                </button>
              </div>

              {hybridMatchesTab === 'group' ? (
                groupRecentMatches.length > 0 ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-10 items-start'>
                    {groupRecentMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <div className='flex flex-col py-[5%] items-center justify-center text-gray-500'>
                    <span>No group stage matches generated yet.</span>
                  </div>
                )
              ) : (
                eliminationRecentMatches.length > 0 ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-10 items-start'>
                    {eliminationRecentMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <div className='flex flex-col py-[5%] items-center justify-center text-gray-500'>
                    <span>No elimination stage matches generated yet.</span>
                  </div>
                ))}
            </div>
          ) : tournament.format === 'round_scoring' ? (
            roundScoringData && roundScoringData.rounds && roundScoringData.rounds.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                {roundScoringData.rounds.map((round) => (
                  <div key={round.match_id} className='flex items-center justify-between p-4 border border-[#123836]/20 rounded-lg shadow-sm bg-white'>
                    <span className='font-semibold text-[#123836] text-[16px] md:text-[20px]'>Round {round.round}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                      round.status === 'completed' ? 'bg-green-100 text-green-800' :
                      round.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      round.status === 'ready' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>{round.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col py-[5%] items-center justify-center text-gray-500'>
                <span>No rounds generated yet.</span>
              </div>
            )
          ) : (
            recentMatchesList.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-10 items-start'>
                {recentMatchesList.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className='flex flex-col py-[5%] items-center justify-center text-gray-500'>
                <span>No matches generated yet.</span>
              </div>
            )
          )}
        </div>
      )}

      <div className='flex mx-[5%] md:mx-[10%] py-[1%] gap-5 md:gap-10'>
        <div className='flex flex-col w-[50%] pr-[1%] gap-5 border-r border-gray-300'>
          <span className='text-[#123836] font-semibold text-[18px] md:text-[32px] py-[1%]'>Tournament Participants</span>
          {loadingParticipants ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#123836] rounded-full animate-spin" />
            </div>
          ) : !isIndividual ? (
            <div className='grid grid-cols-2 md:grid-cols-3 gap-10 items-start'>
              {participants.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          ) : (
            <ParticipantTable participants={participants} />
          )}
        </div>
        <div className='flex flex-col w-[50%] pr-[1%] gap-5'>
          <span className='text-[#123836] font-semibold text-[18px] md:text-[32px] py-[1%]'>Tournament Recent Matches</span>
          {loadingMatches ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#123836] rounded-full animate-spin" />
            </div>
          ) : tournament.format === 'round_scoring' ? (
            <div className='text-[14px] text-gray-400'>Matches list is represented as rounds for this format. See the Matches tab for round progress.</div>
          ) : recentMatchesList.length > 0 ? (
            <div className='grid grid-cols-2 md:grid-cols-2 gap-10 items-start'>
              {recentMatchesList.slice(0, 8).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <span className='text-[14px] text-gray-400'>No recent matches.</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default TournamentPage
