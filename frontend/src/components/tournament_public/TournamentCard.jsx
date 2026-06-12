import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faStar } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'

import banner1 from '../../assets/bannerImages/banner1.jpg'
import banner2 from '../../assets/bannerImages/banner2.jpg'
import banner3 from '../../assets/bannerImages/banner3.jpg'

//import component
import ConfirmationModal from '../common/ConfirmationModal'

const TournamentCard = ({ tournament }) => {
    const navigate = useNavigate();
    const { isLogin } = useAuth()
    const [favorite, setFavorite] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false)

    const handleRedirectToLogin = () => {
        navigate('/login')
    }

    return (
        <div>
            <ConfirmationModal
                open={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleRedirectToLogin}
                title="Favourite Tournament"
                description="You need to login to add this tournament to your favorite list. Do you want to login now?"
                intent="info"
                confirmLabel="Sign In"
                cancelLabel="Cancel"
            />
            <div className='relative flex w-full h-[130px] md:h-[150px] border border-[#d9d9d9] cursor-pointer gap-3 mt-1
            rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#123836]'
                onClick={() => navigate(`/tournaments`)}
            >
                <img src={tournament.image || banner1} alt={tournament.name} className='w-[50%] h-full object-cover object-center rounded-tl-lg rounded-bl-lg' />
                <div className='flex flex-col w-[45%]'>
                    <div className='flex flex-col mt-[5%] items-start h-[90%]'>
                        <span className='text-[15px] md:text-[21px] text-[#123836] font-semibold'>{tournament.name}</span>
                        <span className='text-[10px] md:text-[14px] text-gray-500'>Start Date: {tournament.startDate}</span>
                        <span className='text-[10px] md:text-[14px] text-gray-500'>End Date: {tournament.endDate}</span>
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
                    {favorite ? (
                        <FontAwesomeIcon icon={faStar} className='text-yellow-500 text-[18px] hover:text-yellow-500/50 transition-colors duration-300'
                            onClick={(e) => {
                                e.stopPropagation();
                                setFavorite(!favorite);
                            }}
                        />
                    ) : (
                        <FontAwesomeIcon icon={faStar} className='text-gray-400 text-[18px] mr-1 hover:text-yellow-500/50 transition-colors duration-300'
                            onClick={(e) => {
                                if (!isLogin) {
                                    e.stopPropagation();
                                    setShowConfirm(true);
                                } else {
                                    e.stopPropagation();
                                    setFavorite(!favorite);
                                }
                            }}
                        />
                    )}
                </div>

            </div>
        </div>
    )
};

export default TournamentCard;