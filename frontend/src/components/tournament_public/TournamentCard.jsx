import { useNavigate } from 'react-router-dom';

import banner1 from '../../assets/bannerImages/banner1.jpg'

import FavoriteStarButton from './FavoriteStarButton';

const TournamentCard = ({ tournament, isFavorite, onFavoriteChange }) => {
    const navigate = useNavigate();
    const tournamentId = tournament.id

    return (
        <div>
            <div className='relative flex w-full min:h-[130px] md:min:h-[150px] border border-[#d9d9d9] cursor-pointer mt-1
            rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#123836]'
                onClick={() => navigate(`/tournaments/${tournamentId}`, { state: { tournament } })}
            >
                <img src={tournament.image || banner1} alt={tournament.name} className='w-[50%] h-[130px] md:h-[150px] object-cover object-center rounded-tl-lg rounded-bl-lg pr-2' />
                <div className='flex flex-col w-[45%]'>
                    <div className='flex flex-col'>
                        <span className='text-[15px] md:text-[20px] text-[#123836] font-semibold'>{tournament.name}</span>
                        <span className='text-[10px] md:text-[13px] text-gray-500'>Start Date: {tournament.startDate}</span>
                        <span className='text-[10px] md:text-[13px] text-gray-500'>End Date: {tournament.endDate}</span>
                    </div>
                    <div className='mt-auto'>
                        <span className='text-[10px] md:text-[14px]'>Status: </span>
                        <span className={`text-[10px] md:text-[14px] ${tournament.status === 'Ongoing' ? 'text-red-500' :
                            tournament.status === 'Ended' ? 'text-green-500' : 'text-yellow-500'}`}
                        >
                            {tournament.status}
                        </span>
                    </div>
                </div>
                <div className='flex items-center w-[5%]'>
                    <FavoriteStarButton
                        tournamentId={tournamentId}
                        isFavorite={isFavorite}
                        onFavoriteChange={onFavoriteChange}
                        className='mr-1'
                    />
                </div>
            </div>
        </div>
    )
};

export default TournamentCard;
