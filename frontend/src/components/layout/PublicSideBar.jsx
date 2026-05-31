import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink, useNavigate } from 'react-router-dom'
import { faBars, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../config/supabaseClient'
import logo from '../../assets/logo.png'


const sports = [
    'Football', 'Basketball', 'Badminton', 'Ping-pong (Table Tennis)',
    'League of Legends', 'Dota', 'Counter Strike 2', 'Valorant',
    'Running', 'Bowling', 'Teamfight Tactics', 'Programming'
]

const PublicSidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate()
    const { isLogin } = useAuth()
    const [sportsOpen, setSportsOpen] = useState(false)

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            window.location.href = `${window.location.origin}/login`;
        } catch (error) {
            console.error("Logout error:", error.message);
        }
    };

    const section = 'block py-[3%] px-[7%] text-[20px] font-semibold hover:bg-gray-100 rounded-15px border-t border-gray-300 cursor-pointer'

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full bg-white z-50 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-[400px]' : 'w-0'}`}
            >
                {/* Header */}
                <div className='h-[80px] w-full px-5 overflow-hidden flex items-center'>
                    <FontAwesomeIcon icon={faBars} className='text-[30px] mr-[7%] cursor-pointer' onClick={onClose} />
                    <img
                        src={logo}
                        alt="logo"
                        className='h-[170%]  w-auto object-contain cursor-pointer'
                        onClick={() => navigate('/')}
                    />
                </div>
                {/* Navigation Section */}
                <div className="w-full flex flex-col">
                    <div className={section} onClick={() => { navigate('/'); onClose() }}>
                        Home Page
                    </div>

                    {/* Sport DropDown */}
                    <div>
                        <div className={`${section} flex items-center justify-between`} onClick={() => setSportsOpen(!sportsOpen)}>
                            <span>Sports</span>
                            <FontAwesomeIcon icon={faChevronDown} className={`text-[20px] transition-transform duration-300 ${sportsOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sportsOpen ? 'max-h-[600px]' : 'max-h-0'}`}>
                                <div className='flex flex-col'>
                                    {sports.map(sport => (
                                        <div key={sport} className='py-[2%] px-[15%] text-[16px] hover:bg-gray-100 rounded-15px cursor-pointer'
                                            onClick={() => { navigate('/sports'); onClose() }}
                                        >
                                            {sport}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={section} onClick={() => { navigate('/tournaments'); onClose() }}>
                        Tournaments
                    </div>
                    <div className={section} onClick={() => { navigate('/matches'); onClose() }}>
                        Matches
                    </div>

                    {isLogin && (
                        <div>
                            <div className={section} onClick={() => { navigate('/account-management'); onClose() }}>
                                Manage Account
                            </div>
                        </div>
                    )}
                    {isLogin ?
                        <div className={`${section} text-red-500`} onClick={handleLogout}>Sign Out</div> :
                        <div className={`${section} text-[#123826]`} onClick={() => { navigate('/login'); onClose() }}>
                            Sign In
                        </div>
                    }
                </div>
            </aside >
        </>
    )
}

export default PublicSidebar