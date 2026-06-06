import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useParams } from 'react-router-dom'

import football from '../../assets/sportImages/football.jpg'

//import component
import MatchScoreCard from '../../components/match_public/MatchScoreCard'


const matchItems = [
  { tournamentName: 'Tournament Football 1', matchNumber: '11', round: 'Group A', date: '08/02/2027', time: '03:00PM', team1: 'FOXY', team2: 'KIMETSU', score1: 3, score2: 5, status: 'ongoing', minute: '82:33' },
  { tournamentName: 'Tournament Football 1', matchNumber: '10', round: 'Group A', date: '07/02/2027', time: '01:00PM', team1: 'FOXY', team2: 'KIMETSU', score1: 2, score2: 1, status: 'completed', minute: '90:00' },
  { tournamentName: 'Tournament Football 2', matchNumber: '5', round: 'Group B', date: '06/02/2027', time: '05:00PM', team1: 'FOXY', team2: 'KIMETSU', score1: 0, score2: 2, status: 'completed', minute: '90:00' },
];

const SportsPage = () => {

  const { id } = useParams()

  return (
    <div>
      {/* sport title */}
      <div className='relative h-[150px] w-full overflow-hidden bg-black'>
        <img src={football} alt={id} className='h-full w-full object-cover object-center opacity-70' />
        <div className='absolute inset-0 left-[50%] flex items-center justify-center'>
          <span className='font-aoboshi text-[#123836] text-[25px] md:text-[50px] font-semibold drop-shadow-sm'>
            Netcompany {id} Event
          </span>
        </div>
      </div>
      <div className='flex items-center bg-[#d9d9d9] h-[70px] px-[5%] md:px-[10%] text-[#123836] text-[20px] md:text-[30px] font-semibold w-full'>
        <div className='w-[60%]'>Recent Matches</div>
        <div className='w-[40%]'>Tournament List</div>
      </div>
      <div className='flex px-[5%] md:px-[10%] py-5'>
        <div className='flex flex-col gap-10 w-full pr-5 md:w-[60%] h-[100vh] border-r border-[#d9d9d9]'>
          {matchItems.map((match, index) => (
            <MatchScoreCard key={index} match={match} />
          ))}
        </div>
        <div className='w-full md:w-[40%] h-[400px] ml-5'>
          <span className='text-[18px] md:text-[25px] font-semibold text-[#123836]'>Tournament 1</span>
        </div>
      </div>
    </div>
  )
}

export default SportsPage
