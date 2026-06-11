import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'

//import component
import MatchScoreCard from '../../components/match_public/MatchScoreCard'
import TournamentCard from '../../components/tournament_public/TournamentCard'
import TopLoadingBar from '../../components/common/TopLoadingBar'

//import endpoints
import { getSportInformation } from '../../services/SportService'


const matchItems = [
  {
    tournamentName: 'Tournament Football 1', matchNumber: '11', round: 'Group A', date: '08/02/2027', time: '03:00PM', team1: 'FOXY', team2: 'KIMETSU', score1: 3, score2: 5, status: 'ongoing',
    startTime: new Date(Date.now()).toISOString()
  },
  {
    tournamentName: 'Tournament Football 1', matchNumber: '10', round: 'Group A', date: '07/02/2027', time: '01:00PM', team1: 'FOXY', team2: 'KIMETSU', score1: 2, score2: 1, status: 'ongoing',
    startTime: '2026-06-11T02:00:34.572Z', pausedTime: new Date().toISOString()
  },
  { tournamentName: 'Tournament Football 2', matchNumber: '5', round: 'Group B', date: '06/02/2027', time: '05:00PM', team1: 'FOXY', team2: 'KIMETSU', score1: 0, score2: 2, status: 'completed' },
  { tournamentName: 'Tournament Football 3', matchNumber: '5', round: 'Semi-Final', date: '06/02/2027', time: '06:00PM', team1: 'FOXY', team2: 'KIMETSU', score1: 3, score2: 2, status: 'completed', },
  { tournamentName: 'Tournament Football 3', matchNumber: '5', round: 'Semi-Final', date: '06/02/2027', time: '06:00PM', team1: 'FOXY', team2: 'KIMETSU', score1: 3, score2: 2, status: 'completed', },
];

const tournamentItemsOnGoing = [
  { name: 'Tournament Football 1', startDate: '27/01/2027', endDate: '10/02/2027', status: 'Ongoing' },
  { name: 'Tournament Football 2', startDate: '28/01/2027', endDate: '11/02/2027', status: 'Ongoing' },
  { name: 'Tournament Football 3', startDate: '27/01/2027', endDate: '10/02/2027', status: 'Ongoing' },
  { name: 'Tournament Football 4', startDate: '28/01/2027', endDate: '11/02/2027', status: 'Ongoing' },
];

const tournamentItemsCompleted = [
  { name: 'Tournament Football 3', startDate: '20/01/2027', endDate: '30/01/2027', status: 'Ended' },
  { name: 'Tournament Football 4', startDate: '22/01/2027', endDate: '01/02/2027', status: 'Ended' },
  { name: 'Tournament Football 3', startDate: '20/01/2027', endDate: '30/01/2027', status: 'Ended' },
  { name: 'Tournament Football 4', startDate: '22/01/2027', endDate: '01/02/2027', status: 'Ended' },
];

const tournamentItemsUpcoming = [
  { name: 'Tournament Basketball 5', startDate: '01/02/2027', endDate: '15/02/2027', status: 'Upcoming' },
  { name: 'Tournament Football 6', startDate: '05/02/2027', endDate: '20/02/2027', status: 'Upcoming' },
  { name: 'Tournament Football 5', startDate: '01/02/2027', endDate: '15/02/2027', status: 'Upcoming' },
  { name: 'Tournament Football 6', startDate: '05/02/2027', endDate: '20/02/2027', status: 'Upcoming' },
];

const SportsPage = () => {
  const { id } = useParams()

  const [sportInfo, setSportInfo] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isOpenOngoing, setIsOpenOngoing] = useState(true);
  const [isOpenUpcoming, setIsOpenUpcoming] = useState(true);
  const [isOpenCompleted, setIsOpenCompleted] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filterTournaments = (items) => {
    if (!searchQuery.trim()) return items;
    return items.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const filteredOngoing = filterTournaments(tournamentItemsOnGoing);
  const filteredUpcoming = filterTournaments(tournamentItemsUpcoming);
  const filteredCompleted = filterTournaments(tournamentItemsCompleted);

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsOpenOngoing(true);
      setIsOpenUpcoming(true);
      setIsOpenCompleted(true);
    }
  }, [searchQuery]);

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
      <div className='flex items-center bg-[#d9d9d9] h-[70px] px-[5%] md:px-[10%] text-[#123836] text-[20px] md:text-[30px] font-semibold w-full'>
        <div className='w-[60%]'>Recent Matches</div>
        <div className='w-[40%] ml-5'>Tournament List</div>
      </div>
      <div className='flex flex-col md:flex-row px-[5%] md:px-[10%] py-5'>
        <div className='flex flex-col gap-10 w-full md:pr-5 md:w-[60%] md:border-r border-[#d9d9d9]'>
          {matchItems.map((match, index) => (
            <MatchScoreCard key={index} match={match} />
          ))}
        </div>
        <div className='flex flex-col w-full md:w-[40%] md:ml-5 gap-3'>
          <input
            type='text'
            placeholder='Search tournament...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full border border-[#d9d9d9] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#123836] transition-colors duration-200 mt-5 md:mt-0'
          />
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
