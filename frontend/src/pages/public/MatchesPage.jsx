import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { faCalendarDays, faClock } from '@fortawesome/free-solid-svg-icons';

import banner from '../../assets/sportImages/football.jpg'

import MatchScoreCard from '../../components/match_public/MatchScoreCard';

const matchData = {
  // Match info
  id: 7,
  name: 'Match 07',
  roundText: 'Semifinal 1',
  tournamentName: 'Netcompany Football Event',
  date: '20/8/2026',
  time: '07:00 PM',
  state: 'LIVE', // 'LIVE' | 'DONE' | 'UPCOMING'
  timer: '82:33',

  // Competitors (works for both team & individual)
  competitionType: 'team', // 'team' | 'individual'
  home: {
    id: 'manu',
    name: 'Manchester United',
    logo: null, // URL hoặc null để dùng fallback
    score: 3,
    scorers: ['N.Vu Duy (12\')', 'H.Maguire (57\')', 'M.Rashford (80\')'],
    participants: ['Nguyen Vu Duy', 'Harry Maguire']
  },
  away: {
    id: 'lfc',
    name: 'Liverpool',
    score: 5,
    scorers: ['EzCoun (21\')', 'M.Salah (36\')',],
    participants: ['EzCoun', 'Virgil van Dijk',],
  },

  // Stats
  stats: {
    home: { fouls: 4, kicks: 5, corners: 8, offsides: 3 },
    away: { fouls: 7, kicks: 12, corners: 6, offsides: 6 },
  },
}

const MatchesPage = () => {
  const { id } = useParams()



  return (
    <div className="flex flex-col">
      <div className='min-h-screen w-full bg-cover bg-center flex items-center justify-center' style={{ backgroundImage: `url(${banner})` }}>
        <div className='bg-white p-5 min-h-[60vh] w-[70%] border border-gray-300 shadow-xl rounded-[15px] '>
          <div className='flex gap-2'>
            <div className='flex flex-col gap-5'>
              <span className='text-[#123836] font-bold text-[35px] uppercase'>Tournament Name</span>
              <span className='text-[25px] font-semibold'>Match 07 - Semifinal 1</span>
              <span className='text-[20px] text-gray-500'>
                <FontAwesomeIcon icon={faCalendarDays} /> 27/07/2026 <FontAwesomeIcon icon={faClock} /> 01:00 PM
              </span>
            </div>
            <span className='ml-auto text-[#123836] font-bold text-[50px] '>Netcompany Football Event</span>
          </div>
          <div className='w-[70%] items-center justify-center'>
            <MatchScoreCard match={matchData} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchesPage;