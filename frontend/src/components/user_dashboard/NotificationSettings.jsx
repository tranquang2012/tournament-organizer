import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faFootball, faCalendarDays, faStar, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth';
import notification from '../../assets/notification.png'

const mockNotifications = [
    { id: 1, type: 'ongoing', icon: faFootball, title: 'Tournament Football 1 has started', body: 'The tournament you favorited began on 27/01/2027. Check the latest match schedule.', time: '2 hours ago', read: false },
    { id: 2, type: 'upcoming', icon: faCalendarDays, title: 'Tournament Football 2 starts in 3 days', body: 'Your favorited tournament kicks off on 30/03/2027. Make sure you\'re up to date.', time: '1 day ago', read: false },
    { id: 3, type: 'reminder', icon: faStar, title: 'New tournament added to your sport', body: 'A new Valorant tournament has been created. You might want to add it to your favorites.', time: '3 days ago', read: false },
    { id: 4, type: 'ongoing', icon: faTrophy, title: 'Tournament Badminton 2 — round update', body: 'Round 2 matches have been scheduled. View the full bracket.', time: '5 days ago', read: true },
]

const iconStyle = {
    ongoing: 'bg-red-50 text-red-500',
    upcoming: 'bg-blue-50 text-blue-500',
    reminder: 'bg-yellow-50 text-yellow-500',
}

const NotificationSetting = () => {
    const { profile: userData } = useAuth()
    const [notifications, setNotifications] = useState(mockNotifications)

    const markOne = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    const markAll = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const unreadCount = notifications.filter(n => !n.read).length

    if (notifications.length === 0) {
        return (
            <div className='flex flex-col items-center justify-center h-[300px]'>
                <img src={notification} alt="no-notification" className='w-[100px] h-[80px]' />
                <span className='text-[16px] text-gray-400'>No notification yet!</span>
            </div>
        )
    }

    return (
        <div className='flex flex-col h-full overflow-y-auto'>
            <div className='flex items-center justify-between mb-3'>
                <span className='text-[15px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded'>
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
                </span>
                <button onClick={markAll} className='text-[14px] text-gray-500 border border-gray-200 rounded px-3 py-1 hover:border-gray-400 transition-colors'>
                    Mark all as read
                </button>
            </div>
            <div className='flex flex-col divide-y divide-gray-100'>
                {notifications.map(n => (
                    <div key={n.id} className={`flex items-start gap-3 py-3 ${n.read ? 'opacity-60' : ''}`}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconStyle[n.type]}`}>
                            <FontAwesomeIcon icon={n.icon} className='text-[15px]' />
                        </div>
                        <div className='flex-1 min-w-0'>
                            <p className={`text-[15px] mb-0.5 ${n.read ? 'font-normal text-gray-500' : 'font-medium text-gray-800'}`}>{n.title}</p>
                            <p className='text-[14px] text-gray-500 mb-1'>{n.body}</p>
                            <span className='text-[15px] text-gray-400'>{n.time}</span>
                        </div>
                        <div className='flex flex-col items-end gap-2 shrink-0'>
                            {!n.read && <div className='w-2 h-2 rounded-full bg-blue-500 mt-1' />}
                            {!n.read && (
                                <button onClick={() => markOne(n.id)} className='text-[14px] text-gray-500 border border-gray-200 rounded px-2 py-0.5 hover:border-gray-400 transition-colors whitespace-nowrap'>
                                    Mark read
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default NotificationSetting