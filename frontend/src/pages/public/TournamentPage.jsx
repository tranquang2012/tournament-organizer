import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDay, faCalendarCheck, faLocationPin } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'

//import component
import LeaderboardTable from '../../components/tournament_public/LeaderboardTable';
import TeamCard from '../../components/tournament_public/TeamCard';
import MatchCard from '../../components/tournament_public/MatchCard';
import ParticipantTable from '../../components/tournament_public/ParticipantTable';
import TournamentBracket from '../../components/tournament_public/TournamentBracket';

//importAPI
import { getParticipants } from '../../services/TournamentService';

import logo1 from '../../assets/defaultTeamLogos/logo1.jpg'
import logo2 from '../../assets/defaultTeamLogos/logo2.jpg'

const mockRounds = [
  { id: 1, name: 'Round 1' },
  { id: 2, name: 'Round 2' },
]

const mockGroups = [
  {
    id: 'A',
    name: 'Group A',
    teams: [
      { rank: 1, name: 'GEN', logo: logo1, win: 2, lose: 0 },
      { rank: 1, name: 'T1', logo: logo1, win: 2, lose: 0 },
      { rank: 3, name: 'NS', logo: logo1, win: 1, lose: 1 },
      { rank: 4, name: 'DNS', logo: logo1, win: 0, lose: 2 },
      { rank: 5, name: 'BRO', logo: logo1, win: 0, lose: 2, eliminated: true },
    ]
  },
  {
    id: 'B',
    name: 'Group B',
    teams: [
      { rank: 1, name: 'DK', logo: logo1, win: 3, lose: 0 },
      { rank: 2, name: 'BFX', logo: logo1, win: 1, lose: 1 },
      { rank: 2, name: 'KT', logo: logo1, win: 1, lose: 1 },
      { rank: 4, name: 'HLE', logo: logo1, win: 0, lose: 2 },
      { rank: 5, name: 'DRX', logo: logo1, win: 0, lose: 2, eliminated: true },
    ]
  },
  {
    id: 'C',
    name: 'Group C',
    teams: [
      { rank: 1, name: 'DK', logo: logo1, win: 3, lose: 0 },
      { rank: 2, name: 'BFX', logo: logo1, win: 1, lose: 1 },
      { rank: 2, name: 'KT', logo: logo1, win: 1, lose: 1 },
      { rank: 4, name: 'HLE', logo: logo1, win: 0, lose: 2 },
      { rank: 5, name: 'DRX', logo: logo1, win: 0, lose: 2, eliminated: true },
    ]
  }

]

const mockMatches = [
  { id: 1, matchNumber: 10, team1: { name: 'GEN', logo: logo1, score: 2 }, team2: { name: 'NS', logo: logo2, score: 0 }, status: 'Completed' },
  { id: 2, matchNumber: 9, team1: { name: 'KT', logo: logo1, score: 1 }, team2: { name: 'DK', logo: logo2, score: 2 }, status: 'Completed' },
  { id: 3, matchNumber: 8, team1: { name: 'BFX', logo: logo1, score: 2 }, team2: { name: 'DRX', logo: logo2, score: 0 }, status: 'Completed' },
  { id: 4, matchNumber: 7, team1: { name: 'GEN', logo: logo1, score: 1 }, team2: { name: 'T1', logo: logo2, score: 1 }, status: 'Ongoing' },
  { id: 5, matchNumber: 6, team1: { name: 'DNS', logo: logo1, score: 0 }, team2: { name: 'T1', logo: logo2, score: 2 }, status: 'Completed' },
  { id: 6, matchNumber: 5, team1: { name: 'GEN', logo: logo1, score: 2 }, team2: { name: 'NS', logo: logo2, score: 0 }, status: 'Completed' },
  { id: 7, matchNumber: 4, team1: { name: 'GEN', logo: logo1, score: 2 }, team2: { name: 'NS', logo: logo2, score: 1 }, status: 'Completed' },
  { id: 8, matchNumber: 3, team1: { name: 'GEN', logo: logo1, score: 0 }, team2: { name: 'NS', logo: logo2, score: 2 }, status: 'Completed' },
]

const TournamentPage = () => {
  const { id } = useParams()
  const { state } = useLocation()
  const tournament = state?.tournament
  const [selectedRound, setSelectedRound] = useState(mockRounds[0].id)
  const [tourType, setTourType] = useState()
  const [participants, setParticipants] = useState([])
  const [loadingParticipants, setLoadingParticipants] = useState(true)
  const [compType, setCompType] = useState(null)

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const data = await getParticipants(id)
        setParticipants(data)

      } catch (err) {
        console.error('Failed to fetch participants:', err)
      } finally {
        setLoadingParticipants(false)
      }
    }
    if (id) fetchParticipants()
  }, [id])

  useEffect(() => {
    if (participants.length > 0) {
      setCompType(participants[0].type)
    }
  }, [participants])

  return (
    <div>
      <div className='h-[100px] md:h-[320px] w-full overflow-hidden bg-[#123836]/50'>
        <img
          src={tournament?.image}
          alt="banner"
          className='h-full w-full object-contain object-center'
        />
      </div>
      <div className='flex flex-col bg-[#d9d9d9]/50 px-[5%] md:px-[10%] py-[1%] w-full gap-4 md:gap-7 '>
        <div className='text-[#123836] text-[25px] md:text-[36px] font-semibold'>{tournament?.name}</div>
        <span className='text-[13px] md:text-[18px]'>{tournament?.description}</span>
        <div className='flex gap-3 md:gap-20'>
          <div className='flex gap-1 items-center'>
            <FontAwesomeIcon icon={faCalendarDay} className='text-[11px] md:text-[18px] text-[#123836]' />
            <span className='text-[11px] md:text-[18px]'>Start Date: {tournament?.startDate}</span>
          </div>
          <div className='flex gap-1 items-center'>
            <FontAwesomeIcon icon={faCalendarCheck} className='text-[11px] md:text-[18px] text-[#123836]' />
            <span className='text-[11px] md:text-[18px]'>End Date: {tournament?.endDate}</span>
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
            <span className='text-[13px] md:text-[18px]'>Location: {tournament?.location}</span>
          </div>
        </div>
      </div>
      <div className='flex mx-[5%] md:mx-[10%] py-[1%] gap-5 border-b border-gray-300'>
        {mockRounds.map((round) => (
          <button
            key={round.id}
            onClick={() => setSelectedRound(round.id)}
            className={`px-3 py-1 md:px-6 md:py-1.5 rounded-[15px] text-[13px] md:text-[18px] font-medium transition-colors
                ${selectedRound === round.id
                ? 'bg-[#123836] text-white shadow-md'
                : 'bg-white text-[#123836] border border-gray-300 cursor-pointer hover:bg-[#123836]/50 hover:text-white hover:shadow-md shadow-sm'
              }`}
          >
            {round.name}
          </button>
        ))}
      </div>
      {selectedRound === 1 ? (
        <div className='flex flex-col mx-[5%] md:mx-[10%] py-[1%] gap-5 md:gap-10 border-b border-gray-300'>
          <span className='text-[#123836] font-semibold text-[18px] md:text-[32px]'>Group Stage</span>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
            {mockGroups.map((group) => (
              <LeaderboardTable key={group.id} group={group} />
            ))}
          </div>
        </div>
      ) :
        (
          <div className='flex flex-col mx-[5%] md:mx-[10%] py-[1%] gap-5 md:gap-10 border-b border-gray-300'>
            <span className='text-[#123836] font-semibold text-[18px] md:text-[32px]'>Play Offs</span>
            <TournamentBracket
              onMatchClick={(match) => console.log('Clicked:', match)}
            />
          </div>
        )
      }
      <div className='flex flex-col md:flex-row mx-[5%] md:mx-[10%] py-[1%] gap-5 md:gap-10'>
        <div className='flex flex-col w-full md:w-[50%] pr-[1%] gap-5 border-r border-gray-300'>
          <span className='text-[#123836] font-semibold text-[18px] md:text-[32px] py-[1%]'>Tournament Participants</span>
          {compType === 'team' ? (
            <div className='grid grid-cols-2 md:grid-cols-3 gap-10 items-start'>
              {participants.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          ) :
            (<ParticipantTable participants={participants} />)
          }
        </div>
        <div className='flex flex-col w-full md:w-[50%] pr-[1%] gap-5'>
          <span className='text-[#123836] font-semibold text-[18px] md:text-[32px] py-[1%]'>Tournament Recent Matches</span>
          <div className='grid grid-cols-2 md:grid-cols-2 gap-10 items-start'>
            {mockMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TournamentPage
