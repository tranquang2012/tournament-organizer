import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate, useLocation } from 'react-router-dom'
import { faBars, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../config/supabaseClient'
import logo from '../../assets/logo.png'

const sports = [
    { name: 'Football', path: '/sports/01' },
    { name: 'Basketball', path: '/sports/02' },
    { name: 'Badminton', path: '/sports/03' },
    { name: 'Ping Pong', path: '/sports/04' },
    { name: 'Running', path: '/sports/05' },
    { name: 'Bowling', path: '/sports/06' },
    { name: 'League of Legends', path: '/sports/07' },
    { name: 'Valorant', path: '/sports/08' },
    { name: 'Dota 2', path: '/sports/09' },
    { name: 'Counter Strike 2', path: '/sports/10' },
    { name: 'Teamfight Tactics', path: '/sports/11' },
    { name: 'Programming', path: '/sports/12' },
]

const PublicSidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { isLogin, isAdmin } = useAuth()
    const [sportsOpen, setSportsOpen] = useState(false)
    const section = 'block py-3 px-5 text-base md:text-[20px] font-semibold hover:bg-gray-100 rounded-15px border-t border-gray-300 cursor-pointer'

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    useEffect(() => {
        onClose()
    }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            window.location.href = `${window.location.origin}/login`;
        } catch (error) {
            console.error("Logout error:", error.message);
        }
    };

    const navigateAndClose = (path) => {
        navigate(path)
        onClose()
    }

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40"
                    onClick={onClose}
                />
            )}
            <aside
                className={`fixed top-0 left-0 h-full bg-white z-50 shadow-xl transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0 w-[min(85vw,320px)]' : '-translate-x-full w-[min(85vw,320px)]'
                }`}
            >
                <div className='h-14 md:h-[80px] w-full px-4 flex items-center border-b border-gray-100'>
                    <FontAwesomeIcon icon={faBars} className='text-xl mr-3 cursor-pointer shrink-0' onClick={onClose} />
                    <img
                        src={logo}
                        alt="logo"
                        className='max-w-[140px] max-h-[50px] object-contain cursor-pointer'
                        onClick={() => navigateAndClose('/')}
                    />
                </div>
                <div className="w-full flex flex-col overflow-y-auto max-h-[calc(100vh-56px)] md:max-h-[calc(100vh-80px)]">
                    <div className={section} onClick={() => navigateAndClose('/')}>
                        Home Page
                    </div>
                    <div>
                        <div className={`${section} flex items-center justify-between`} onClick={() => setSportsOpen(!sportsOpen)}>
                            <span>Sports</span>
                            <FontAwesomeIcon icon={faChevronDown} className={`text-base transition-transform duration-300 ${sportsOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sportsOpen ? 'max-h-[800px]' : 'max-h-0'}`}>
                                <div className='flex flex-col'>
                                    {sports.map(sport => (
                                        <div key={sport.path} className='py-2 px-8 text-sm hover:bg-gray-100 rounded-15px cursor-pointer'
                                            onClick={() => navigateAndClose(sport.path)}
                                        >
                                            {sport.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={section} onClick={() => navigateAndClose('/tournaments')}>
                        Tournaments
                    </div>
                    <div className={section} onClick={() => navigateAndClose('/matches')}>
                        Matches
                    </div>
                    <div className={section} onClick={() => navigateAndClose('/calendar')}>
                        Calendar
                    </div>
                    {isLogin && (
                        <div>
                            <div className={section} onClick={() => navigateAndClose('/account-management')}>
                                Manage Account
                            </div>
                        </div>
                    )}
                    {isAdmin && (
                        <div>
                            <div className={section} onClick={() => navigateAndClose('/admin')}>
                                Admin Dashboard
                            </div>
                        </div>
                    )}
                    {isLogin ?
                        <div className={`${section} text-red-500`} onClick={handleLogout}>Sign Out</div> :
                        <div className={`${section} text-[#123826]`} onClick={() => navigateAndClose('/login')}>
                            Sign In
                        </div>
                    }
                </div>
            </aside >
        </>
    )
}
export default PublicSidebar
