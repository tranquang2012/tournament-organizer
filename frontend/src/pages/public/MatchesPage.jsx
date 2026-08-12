import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { faCalendarDays, faClock } from '@fortawesome/free-solid-svg-icons';

import banner from '../../assets/sportImages/football.jpg'

import MatchDetailCard from '../../components/match_public/MatchDetailCard';
import RoundScoringTable from '../../components/match_public/RoundScoringTable';

import { getMatch, getMatchStats } from '../../services/MatchService';
import { getParticipants } from '../../services/TournamentService';

const formatScheduledDate = (isoStr) => {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const formatScheduledTime = (isoStr) => {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const buildTeamMatchData = (match, stats, participants) => {
  const c1 = match.competitors?.[0];
  const c2 = match.competitors?.[1];
  const r1 = match.results?.[0];
  const r2 = match.results?.[1];

  // Build participant lists per team from tournament participants
  // getParticipants returns { id, name, members: [{ name }] } (not comp_id/mem_name)
  const findMembers = (compId) => {
    const comp = participants.find(p => p.id === compId);
    return comp?.members?.map(m => m.name) || [];
  };

  // Build stats array: group by stat name and pair home/away using comp_id
  const statsByName = {};
  stats.forEach(s => {
    if (!statsByName[s.name]) statsByName[s.name] = { name: s.name, home: '—', away: '—', matchLevel: '—' };
    const val = s.type === 'INTEGER' ? Number(s.value || 0) : (s.value || '—');
    if (s.comp_id && s.comp_id === c1?.comp_id) {
      statsByName[s.name].home = val;
    } else if (s.comp_id && s.comp_id === c2?.comp_id) {
      statsByName[s.name].away = val;
    } else if (!s.comp_id) {
      // Match-level stat (no comp_id)
      statsByName[s.name].matchLevel = val;
    }
  });
  const statRows = Object.values(statsByName);

  return {
    id: match.match_id,
    name: `Round ${match.round}`,
    roundText: match.group_name || match.stage || '',
    tournamentName: match.tour_name || '',
    date: formatScheduledDate(match.scheduled_start),
    time: formatScheduledTime(match.scheduled_start),
    competitionType: 'team',
    status: match.status === 'running' ? 'ongoing' : match.status,
    team1: c1?.comp_name || 'TBD',
    team2: c2?.comp_name || 'TBD',
    score1: r1?.score ?? 0,
    score2: r2?.score ?? 0,
    startTime: match.scheduled_start,
    home: {
      id: c1?.comp_id,
      name: c1?.comp_name || 'TBD',
      logo: c1?.comp_logo,
      score: r1?.score ?? 0,
      scorers: [],
      participants: findMembers(c1?.comp_id),
    },
    away: {
      id: c2?.comp_id,
      name: c2?.comp_name || 'TBD',
      logo: c2?.comp_logo,
      score: r2?.score ?? 0,
      scorers: [],
      participants: findMembers(c2?.comp_id),
    },
    stats: statRows,
  };
};

const buildRoundScoringData = (match, stats) => {
  const roundScores = match.round_scores || [];

  // Build rounds list and participant scores from round_scores JSON
  const participantList = roundScores.map(r => ({
    name: match.competitors?.find(c => c.comp_id === r.comp_id)?.comp_name || r.comp_id,
    rank: r.rank || null,
    scores: [r.score ?? 0],
  }));

  // Compute aggregate stats
  const allScores = roundScores.map(r => r.score ?? 0);
  const statRows = allScores.length > 0
    ? [
        { name: 'Avg Score', home: Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length), away: null },
        { name: 'High Score', home: Math.max(...allScores), away: null },
        { name: 'Low Score', home: Math.min(...allScores), away: null },
      ]
    : stats.map(s => ({
        name: s.name,
        home: s.type === 'INTEGER' ? Number(s.value || 0) : (s.value || '—'),
        away: null,
      }));

  return {
    id: match.match_id,
    name: `Round ${match.round}`,
    roundText: match.group_name || match.stage || '',
    tournamentName: match.tour_name || '',
    date: formatScheduledDate(match.scheduled_start),
    time: formatScheduledTime(match.scheduled_start),
    competitionType: 'individual_scoring',
    status: match.status === 'running' ? 'ongoing' : match.status,
    rounds: [`Round ${match.round}`],
    participants: participantList,
    stats: statRows,
  };
};

const MatchesPage = () => {
  const { id } = useParams()
  const [matchData, setMatchData] = useState(null)
  const [isTeamMode, setIsTeamMode] = useState(false)
  const [isRoundScoring, setIsRoundScoring] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bannerUrl, setBannerUrl] = useState(banner)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [match, stats] = await Promise.all([
          getMatch(id),
          getMatchStats(id),
        ]);

        if (match.tour_banner) setBannerUrl(match.tour_banner);

        const roundScoring = match.tour_format === 'round_scoring'
          || match.stage === 'round_scoring';
        const isTeam = match.participant_type === 'team' && !roundScoring;

        setIsTeamMode(isTeam);
        setIsRoundScoring(roundScoring);

        if (roundScoring) {
          setMatchData(buildRoundScoringData(match, stats));
        } else {
          // Fetch participants for team member lists
          let participants = [];
          if (isTeam && match.tour_id) {
            try {
              participants = await getParticipants(match.tour_id);
            } catch { /* non-critical */ }
          }
          setMatchData(buildTeamMatchData(match, stats, participants));
        }
      } catch (err) {
        console.error('Failed to fetch match data:', err);
        setError('Match not found');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-500">Loading match...</div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">{error || 'Match not found'}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className='min-h-screen w-full bg-cover bg-center flex items-center justify-center' style={{ backgroundImage: `url(${bannerUrl})` }}>
        <div className='bg-white p-5 w-[70%] border border-white shadow-xl rounded-[15px]'>
          <div className='flex gap-2'>
            <div className='flex flex-col gap-3'>
              <span className='text-[#123836] font-semibold text-[30px]'>{matchData.tournamentName}</span>
              <span className='text-[22px] font-semibold'>{matchData.name} - {matchData.roundText}</span>
              <span className='text-[17px] font-thin text-gray-500'>
                {matchData.date && <><FontAwesomeIcon icon={faCalendarDays} /> {matchData.date} </>}
                {matchData.time && <><FontAwesomeIcon icon={faClock} /> {matchData.time}</>}
              </span>
              {matchData.status === 'ongoing' || matchData.status === 'running' || matchData.status === 'pausing' ? (
                <button className='font-semibold text-red-500 border border-gray-300 rounded-[10px] p-1 shadow-sm cursor-pointer 
                transition-transform duration-300 ease-in-out hover:scale-105 hover:border-gray-500'>Live now!</button>
              ) : (
                <button className='font-semibold text-white rounded-[10px] bg-[#123836] p-1 shadow-sm'>Match End</button>
              )}
            </div>
            <span className='ml-auto text-[#123836] font-semibold text-[50px]'>{matchData.tournamentName}</span>
          </div>
          <div className='flex items-center justify-center'>
            <div className='w-[70%] pt-15'>
              {isRoundScoring
                ? <RoundScoringTable match={matchData} />
                : <MatchDetailCard match={matchData} />
              }
            </div>
          </div>
          <div className='flex gap-10 mt-10'>
            {isTeamMode && (
              <div className='border border-gray-200 rounded-[10px] overflow-hidden shadow-sm w-[35%]'>
                <div className='bg-[#123836] text-white text-[15px] font-semibold px-4 py-2'>
                  Match Participants
                </div>
                <table className='w-full text-[14px]'>
                  <thead>
                    <tr className='bg-gray-50'>
                      <th className='text-left px-4 py-2 text-[#123836] font-semibold border-b border-r border-gray-200'>{matchData.team1}</th>
                      <th className='text-left px-4 py-2 text-[#123836] font-semibold border-b border-gray-200'>{matchData.team2}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.max(matchData.home.participants.length, matchData.away.participants.length) }).map((_, i) => (
                      <tr key={i} className='border-b border-gray-100 last:border-0'>
                        <td className='px-4 py-2 border-r border-gray-200 text-gray-700'>{matchData.home.participants[i] || ''}</td>
                        <td className='px-4 py-2 text-gray-700'>{matchData.away.participants[i] || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {matchData.stats.length > 0 && (
              <div className='flex-1 border border-gray-200 rounded-[10px] overflow-hidden shadow-sm'>
                <table className='w-full text-[14px]'>
                  <thead>
                    <tr className='bg-gray-50'>
                      <th className='text-left px-4 py-3 text-[#123836] font-semibold border-b border-gray-200'>Teams</th>
                      {matchData.stats.map(s => (
                        <th key={s.name} className='text-center px-3 py-3 text-[#123836] font-semibold border-b border-gray-200'>
                          {s.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!isRoundScoring ? (
                      <>
                        <tr className='border-b border-gray-100 hover:bg-gray-50 transition-colors'>
                          <td className='px-4 py-3 font-semibold text-gray-700'>{matchData.team1}</td>
                          {matchData.stats.map(s => (
                            <td key={s.name} className='text-center px-3 py-3 text-gray-600'>{s.home}</td>
                          ))}
                        </tr>
                        <tr className='border-b border-gray-100 hover:bg-gray-50 transition-colors'>
                          <td className='px-4 py-3 font-semibold text-gray-700'>{matchData.team2}</td>
                          {matchData.stats.map(s => (
                            <td key={s.name} className='text-center px-3 py-3 text-gray-600'>{s.away}</td>
                          ))}
                        </tr>
                        {matchData.stats.some(s => s.matchLevel !== '—') && (
                          <tr className='hover:bg-gray-50 transition-colors bg-[#f8fafa]'>
                            <td className='px-4 py-3 font-semibold text-[#123836]'>Match Overall</td>
                            {matchData.stats.map(s => (
                              <td key={s.name} className='text-center px-3 py-3 font-medium text-[#123836]'>
                                {s.matchLevel !== '—' ? s.matchLevel : ''}
                              </td>
                            ))}
                          </tr>
                        )}
                      </>
                    ) : (
                      <tr className='hover:bg-gray-50 transition-colors'>
                        <td className='px-4 py-3 font-semibold text-gray-700'>Overall</td>
                        {matchData.stats.map(s => (
                          <td key={s.name} className='text-center px-3 py-3 text-gray-600'>
                            {s.home !== '—' ? s.home : s.matchLevel}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchesPage;