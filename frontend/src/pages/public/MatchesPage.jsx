import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { faCalendarDays, faClock } from '@fortawesome/free-solid-svg-icons';

import banner from '../../assets/sportImages/football.jpg'

import MatchDetailCard from '../../components/match_public/MatchDetailCard';
import RoundScoringTable from '../../components/match_public/RoundScoringTable';

import { getMatch, getMatchStats } from '../../services/MatchService';
import { getParticipants, getSportRules } from '../../services/TournamentService';

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

  // Build stats arrays: group by stat name and scope using comp_id
  const groupedStats = {};
  stats.forEach(s => {
    if (!groupedStats[s.name]) {
      groupedStats[s.name] = { name: s.name, type: s.type, home: null, away: null, matchLevel: null };
    }
    const val = s.type === 'INTEGER' ? Number(s.value || 0) : (s.value || '—');
    if (s.comp_id && s.comp_id === c1?.comp_id) {
      groupedStats[s.name].home = val;
    } else if (s.comp_id && s.comp_id === c2?.comp_id) {
      groupedStats[s.name].away = val;
    } else if (!s.comp_id) {
      groupedStats[s.name].matchLevel = val;
    }
  });

  const matchStats = [];
  const teamStats = [];

  Object.values(groupedStats).forEach(s => {
    const hasTeamStat = s.home !== null || s.away !== null;
    const hasMatchStat = s.matchLevel !== null;

    if (hasTeamStat && hasMatchStat) {
      console.warn(`Stat "${s.name}" has both team and match scopes. Dropping match scope.`);
    }

    if (hasTeamStat) {
      teamStats.push({
        name: s.name,
        type: s.type,
        home: s.home !== null ? s.home : (s.type === 'INTEGER' ? 0 : '—'),
        away: s.away !== null ? s.away : (s.type === 'INTEGER' ? 0 : '—')
      });
    } else if (hasMatchStat) {
      matchStats.push({
        name: s.name,
        type: s.type,
        value: s.matchLevel
      });
    }
  });

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
    elapsedMs: match.elapsed_ms,
    runningSince: match.running_since,
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
    matchStats,
    teamStats,
  };
};

const parseRoundScores = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const isRoundScoringMatch = (match) => (
  match.tour_format === 'round_scoring'
  || match.stage === 'round_scoring'
  || (match.stage === 'stage_1' && match.first_stage_format === 'round_scoring')
  || (match.stage === 'stage_2' && match.second_stage_format === 'round_scoring')
);

const buildRoundScoringData = (match, stats, participants = []) => {
  const roundScores = parseRoundScores(match.round_scores);
  const nameById = Object.fromEntries((participants || []).map((p) => [p.id, p.name]));

  const maxSetsFromScores = roundScores.reduce((max, row) => {
    const length = Array.isArray(row.sets) ? row.sets.length : 0;
    return Math.max(max, length);
  }, 0);
  const gameCount = Math.max(1, Number(match.sets_per_match) || maxSetsFromScores || 1);

  const participantList = [...roundScores]
    .sort((a, b) => (a.rank || 999) - (b.rank || 999))
    .map((row) => {
      const storedSets = Array.isArray(row.sets) ? row.sets : null;
      const scores = Array.from({ length: gameCount }, (_, index) => {
        if (storedSets && storedSets[index] != null && storedSets[index] !== '') {
          const numeric = Number(storedSets[index]);
          return Number.isFinite(numeric) ? numeric : null;
        }
        if (!storedSets && gameCount === 1 && row.score != null) {
          const numeric = Number(row.score);
          return Number.isFinite(numeric) ? numeric : null;
        }
        return null;
      });

      return {
        name: nameById[row.comp_id]
          || match.competitors?.find((c) => c.comp_id === row.comp_id)?.comp_name
          || row.comp_name
          || 'Unknown',
        rank: row.rank || null,
        scores,
      };
    });

  const rounds = gameCount > 1
    ? Array.from({ length: gameCount }, (_, index) => `Game ${index + 1}`)
    : [`Round ${match.round}`];

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
    elapsedMs: match.elapsed_ms,
    runningSince: match.running_since,
    rounds,
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
  const [scoreMode, setScoreMode] = useState('points')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [match, stats, rules] = await Promise.all([
          getMatch(id),
          getMatchStats(id),
          getSportRules(),
        ]);

        if (match.tour_banner) setBannerUrl(match.tour_banner);
        setScoreMode(rules?.[match.sp_id]?.score_mode || 'points');

        const roundScoring = isRoundScoringMatch(match);
        const isTeam = match.participant_type === 'team' && !roundScoring;

        setIsTeamMode(isTeam);
        setIsRoundScoring(roundScoring);

        if (roundScoring) {
          let scoringParticipants = [];
          if (match.tour_id) {
            try {
              scoringParticipants = await getParticipants(match.tour_id);
            } catch { /* names are optional */ }
          }
          setMatchData(buildRoundScoringData(match, stats, scoringParticipants));
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
      <div className='min-h-screen w-full bg-cover bg-center flex items-center justify-center px-4 py-6' style={{ backgroundImage: `url(${bannerUrl})` }}>
        <div className='bg-white p-4 md:p-5 w-full max-w-5xl md:w-[70%] border border-white shadow-xl rounded-[15px]'>
          <div className='flex gap-2'>
            <div className='flex flex-col gap-3 flex-1 min-w-0'>
              <span className='text-[#123836] font-semibold text-xl md:text-[30px] truncate'>{matchData.tournamentName}</span>
              <span className='text-base md:text-[22px] font-semibold'>{matchData.name} - {matchData.roundText}</span>
              <span className='text-sm md:text-[17px] font-thin text-gray-500'>
                {matchData.date && <><FontAwesomeIcon icon={faCalendarDays} /> {matchData.date} </>}
                {matchData.time && <><FontAwesomeIcon icon={faClock} /> {matchData.time}</>}
              </span>
              {matchData.status === 'ongoing' || matchData.status === 'running' || matchData.status === 'paused' ? (
                <button className='font-semibold text-red-500 border border-gray-300 rounded-[10px] p-1 shadow-sm cursor-pointer w-fit
                transition-transform duration-300 ease-in-out hover:scale-105 hover:border-gray-500'>Live now!</button>
              ) : (
                <button className='font-semibold text-white rounded-[10px] bg-[#123836] p-1 shadow-sm w-fit'>Match End</button>
              )}
            </div>
            <span className='hidden md:block ml-auto text-[#123836] font-semibold text-[50px] shrink-0'>{matchData.tournamentName}</span>
          </div>
          <div className='flex items-center justify-center'>
            <div className='w-full md:w-[70%] pt-6 md:pt-15'>
              {isRoundScoring
                ? <RoundScoringTable match={matchData} scoreMode={scoreMode} />
                : <MatchDetailCard match={matchData} />
              }
            </div>
          </div>

          {!isRoundScoring && matchData.matchStats?.length > 0 && (
            <div className='mt-10 border border-gray-200 rounded-[10px] overflow-hidden shadow-sm'>
              <div className='bg-[#123836] text-white text-[15px] font-semibold px-4 py-2'>
                Match Stats
              </div>
              <div className='p-4 bg-gray-50'>
                <div className='grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4'>
                  {matchData.matchStats.map(s => (
                    <div key={s.name} className='border border-gray-200 rounded-[10px] p-3 bg-white shadow-sm flex flex-col items-start'>
                      <span className='text-xs text-slate-500 uppercase font-semibold mb-1'>{s.name}</span>
                      <span className='text-2xl font-bold text-[#123836]'>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className='flex flex-col md:flex-row gap-6 md:gap-10 mt-10'>
            {isTeamMode && (
              <div className='border border-gray-200 rounded-[10px] overflow-hidden shadow-sm w-full md:w-[35%] self-start'>
                <div className='bg-[#123836] text-white text-[15px] font-semibold px-4 py-2'>
                  Match Participants
                </div>
                <div className='overflow-x-auto'>
                <table className='w-full text-[14px] min-w-[280px]'>
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
              </div>
            )}
            {isRoundScoring ? (
              matchData.stats?.length > 0 && (
                <div className='flex-1 border border-gray-200 rounded-[10px] overflow-hidden shadow-sm self-start w-full'>
                  <div className='overflow-x-auto'>
                  <table className='w-full text-[14px] min-w-[300px]'>
                    <thead>
                      <tr className='bg-gray-50'>
                        <th className='text-left px-4 py-3 text-[#123836] font-semibold border-b border-gray-200'>Overall</th>
                        {matchData.stats.map(s => (
                          <th key={s.name} className='text-center px-3 py-3 text-[#123836] font-semibold border-b border-gray-200'>
                            {s.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className='hover:bg-gray-50 transition-colors'>
                        <td className='px-4 py-3 font-semibold text-gray-700'>Values</td>
                        {matchData.stats.map(s => (
                          <td key={s.name} className='text-center px-3 py-3 text-gray-600'>
                            {s.home !== '—' ? s.home : s.matchLevel}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                  </div>
                </div>
              )
            ) : (
              matchData.teamStats?.length > 0 && (
                <div className='flex-1 border border-gray-200 rounded-[10px] overflow-hidden shadow-sm self-start w-full'>
                  <div className='bg-[#123836] text-white text-[15px] font-semibold px-4 py-2'>
                    Team Stats
                  </div>
                  <div className='overflow-x-auto'>
                  <table className='w-full text-[14px] min-w-[300px]'>
                    <thead>
                      <tr className='bg-gray-50'>
                        <th className='text-left px-4 py-3 text-[#123836] font-semibold border-b border-gray-200'>Teams</th>
                        {matchData.teamStats.map(s => (
                          <th key={s.name} className='text-center px-3 py-3 text-[#123836] font-semibold border-b border-gray-200'>
                            {s.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className='border-b border-gray-100 hover:bg-gray-50 transition-colors'>
                        <td className='px-4 py-3 font-semibold text-gray-700'>{matchData.team1}</td>
                        {matchData.teamStats.map(s => (
                          <td key={s.name} className='text-center px-3 py-3 text-gray-600'>{s.home}</td>
                        ))}
                      </tr>
                      <tr className='border-b border-gray-100 hover:bg-gray-50 transition-colors'>
                        <td className='px-4 py-3 font-semibold text-gray-700'>{matchData.team2}</td>
                        {matchData.teamStats.map(s => (
                          <td key={s.name} className='text-center px-3 py-3 text-gray-600'>{s.away}</td>
                        ))}
                      </tr>

                    </tbody>
                  </table>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchesPage;