import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'

const mockTournaments = [
    { id: 'c5615c9c-1c28-4cb2-b729-ffeed17359d6', name: 'Tournament Football 1', sport: 'Football', startDate: '27/01/2027', endDate: '28/02/2027', status: 'Ongoing' },
    { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Tournament Badminton 2', sport: 'Badminton', startDate: '25/01/2027', endDate: '20/02/2027', status: 'Ongoing' },
    { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Tournament Valorant 1', sport: 'Valorant', startDate: '31/01/2027', endDate: '14/02/2027', status: 'Ongoing' },
    { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Tournament Football 2', sport: 'Football', startDate: '30/03/2027', endDate: '15/04/2027', status: 'Upcoming' },
]

const FollowedTournaments = () => {
    const navigate = useNavigate()
    const [favorites, setFavorites] = useState(new Set(mockTournaments.map(t => t.id)))

    const handleUnfavorite = (id) => {
        setFavorites(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
        })
    }

    const tournamentLists = mockTournaments.filter(t => favorites.has(t.id))

    return (
        <div className='flex flex-col gap-3'>
            {tournamentLists.length === 0 ? (
                <p className='text-center text-gray-400 py-12'>No favorite tournaments yet</p>
            ) : tournamentLists.map(t => (
                <div key={t.id}
                    className='flex items-center gap-4 bg-white border border-[#d9d9d9] rounded-lg px-4 py-3 shadow-sm
                    hover:shadow-md hover:-translate-y-0.5 hover:border-[#123836] transition-all duration-300 cursor-pointer'
                    onClick={() => navigate(`/tournaments/${t.id}`)}
                >
                    <div className='flex-1 min-w-0'>
                        <div className='mb-1'>
                            <span className='font-semibold text-[15px] text-[#123836]'>{t.name}</span>
                        </div>
                        <div className='flex flex-wrap items-center gap-3 text-[13px] text-gray-500'>
                            <span className='bg-gray-100 px-2 py-0.5 rounded text-[12px]'>{t.sport}</span>
                            <span>Start: {t.startDate}</span>
                            <span>End: {t.endDate}</span>
                            <span>Status: <span className={
                                t.status === 'Ongoing' ? 'text-red-500' :
                                t.status === 'Ended' ? 'text-green-500' : 'text-yellow-500'
                            }>{t.status}</span></span>
                        </div>
                    </div>
                    <button
                        className='shrink-0 bg-[#123826] text-white text-[13px] px-4 py-1.5 rounded-lg hover:opacity-90'
                        onClick={(e) => { e.stopPropagation(); navigate(`/tournaments/${t.id}`) }}
                    >
                        View Details
                    </button>
                    <FontAwesomeIcon
                        icon={faStar}
                        className='text-yellow-500 text-[20px] shrink-0 hover:text-yellow-500/50 transition-colors duration-300'
                        onClick={(e) => { e.stopPropagation(); handleUnfavorite(t.id) }}
                    />
                </div>
            ))}
        </div>
    )
}

export default FollowedTournaments