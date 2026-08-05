import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { faCalendarDays, faClock } from '@fortawesome/free-solid-svg-icons';

import banner from '../../assets/sportImages/football.jpg'

import MatchDetailCard from '../../components/match_public/MatchDetailCard';
import RoundScoringTable from '../../components/match_public/RoundScoringTable';

const teamMatchData = {
  id: 7,
  name: 'Match 07',
  roundText: 'Semifinal 1',
  tournamentName: 'Football Championship',
  date: '20/8/2026',
  time: '07:00 PM',
  competitionType: 'team',
  status: 'ongoing',
  team1: 'Manchester United',
  team2: 'Liverpool',
  score1: 3,
  score2: 5,
  startTime: new Date(Date.now() - 82 * 60 * 1000).toISOString(),
  home: {
    id: 'manu',
    name: 'Manchester United',
    logo: null,
    score: 3,
    scorers: ["N.Vu Duy (12')", "H.Maguire (57')", "M.Rashford (80')"],
    participants: ['Nguyen Vu Duy', 'Harry Maguire']
  },
  away: {
    id: 'lfc',
    name: 'Liverpool',
    score: 5,
    scorers: ["EzCoun (21')", "M.Salah (36')"],
    participants: ['EzCoun', 'Virgil van Dijk'],
  },
  stats: [
    { name: 'Fouls', home: 4, away: 7 },
    { name: 'Kicks', home: 5, away: 12 },
    { name: 'Corners', home: 8, away: 6 },
    { name: 'Offsides', home: 3, away: 6 },
  ]
}

const roundScoringData = {
  id: 8,
  name: 'Match 08',
  roundText: 'Final',
  tournamentName: 'Bowling Championship',
  date: '20/8/2026',
  time: '09:00 AM',
  competitionType: 'individual_scoring',
  status: 'completed',
  team1: null,
  team2: null,
  rounds: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5'],
  participants: [
    { name: 'Nguyen Vu Duy', rank: 1, scores: [153, 182, 180, 189, 183] },
    { name: 'Lee Chong Wei', rank: 2, scores: [180, 145, 123, 164, 154] },
    { name: 'Le Chanh Tri', rank: 3, scores: [200, 185, 174, 190, 166] },
    { name: 'Huynh Nhat Anh', rank: null, scores: [124, 154, 145, 180, 200] },
    { name: 'Tran Quang', rank: null, scores: [180, 154, 124, 172, 144] },
    { name: 'To Nhat Duy', rank: null, scores: [134, 175, 180, 177, 125] },
    { name: 'EztocCoun', rank: null, scores: [189, 172, 170, 177, 174] },
    { name: 'Do Duy Khanh', rank: null, scores: [110, 130, 125, 142, 115] },
  ],
  stats: [
    { name: 'Avg Score', home: 154, away: null },
    { name: 'High Round', home: 200, away: null },
    { name: 'Low Round', home: 110, away: null },
  ]
}

const MatchesPage = () => {
  const { id } = useParams()
  const matchData = roundScoringData
  const isTeamMode = matchData.competitionType === 'team'

  return (
    <div className="flex flex-col">
      <div className='min-h-screen w-full bg-cover bg-center flex items-center justify-center' style={{ backgroundImage: `url(${banner})` }}>
        <div className='bg-white p-5 w-[70%] border border-white shadow-xl rounded-[15px]'>
          <div className='flex gap-2'>
            <div className='flex flex-col gap-3'>
              <span className='text-[#123836] font-semibold text-[30px]'>{matchData.tournamentName}</span>
              <span className='text-[22px] font-semibold'>{matchData.name} - {matchData.roundText}</span>
              <span className='text-[17px] font-thin text-gray-500'>
                <FontAwesomeIcon icon={faCalendarDays} /> {matchData.date} <FontAwesomeIcon icon={faClock} /> {matchData.time}
              </span>
              {matchData.status === 'ongoing' || matchData.status === 'pausing' ? (
                <button className='font-semibold text-red-500 border border-gray-300 rounded-[10px] p-1 shadow-sm cursor-pointer 
                transition-transform duration-300 ease-in-out hover:scale-105 hover:border-gray-500'>Live now!</button>
              ) : (
                <button className='font-semibold text-white rounded-[10px] bg-[#123836] p-1 shadow-sm'>Match End</button>
              )}
            </div>
            <span className='ml-auto text-[#123836] font-semibold text-[50px]'>Netcompany Football Event</span>
          </div>
          <div className='flex items-center justify-center'>
            <div className='w-[70%] pt-15'>
              {isTeamMode
                ? <MatchDetailCard match={matchData} />
                : <RoundScoringTable match={matchData} />
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
                  {isTeamMode ? (
                    <>
                      <tr className='border-b border-gray-100 hover:bg-gray-50 transition-colors'>
                        <td className='px-4 py-3 font-semibold text-gray-700'>{matchData.team1}</td>
                        {matchData.stats.map(s => (
                          <td key={s.name} className='text-center px-3 py-3 text-gray-600'>{s.home}</td>
                        ))}
                      </tr>
                      <tr className='hover:bg-gray-50 transition-colors'>
                        <td className='px-4 py-3 font-semibold text-gray-700'>{matchData.team2}</td>
                        {matchData.stats.map(s => (
                          <td key={s.name} className='text-center px-3 py-3 text-gray-600'>{s.away}</td>
                        ))}
                      </tr>
                    </>
                  ) : (
                    <tr className='hover:bg-gray-50 transition-colors'>
                      <td className='px-4 py-3 font-semibold text-gray-700'>Overall</td>
                      {matchData.stats.map(s => (
                        <td key={s.name} className='text-center px-3 py-3 text-gray-600'>{s.home ?? '—'}</td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchesPage;