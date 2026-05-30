import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPencil, faBell, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth';

//import component
import TopNavBar from '../../components/layout/TopNavbar';
import AccountManageSetting from '../../components/user_dashboard/AccountManageSetting';
import NotificationSetting from '../../components/user_dashboard/NotificationSettings';
import FollowedTournaments from '../../components/user_dashboard/FollowedTournaments';

const UserProfileManagement = () => {

    const [sectionChoose, setSectionChoose] = useState('profile')
    const [loading, setLoading] = useState(true)
    const { profile: userData } = useAuth()


    const changeSection = (section) => {
        setSectionChoose(section)
    }

    return (
        <div>
            <TopNavBar />
            <div className='account-management'>
                <div className='title flex items-center bg-[#123826] h-[60px] px-[21%] text-white text-[30px]'>Account Management</div>
                <div className='account-management-container flex h-[500px] w-full px-[21%] py-5'>
                    <div className='content-left w-[30%]'>
                        <div className='profile h-[120px] w-full flex mb-5'>
                            <div className='profile-image border border-black rounded-[50%] h-full w-[120px] flex items-center justify-center'>
                                <FontAwesomeIcon icon={faUser} className='user-icon text-[80px]' />
                            </div>
                            <div className='edit-img pl-[20px] flex flex-col justify-center'>
                                <div className='text-[25px]'><b>{userData?.fullName}</b></div>
                                <div className='cursor-pointer text-gray-850 text-[16px] my-2'><FontAwesomeIcon icon={faPencil}></FontAwesomeIcon> Change your avatar</div>
                            </div>
                        </div>
                        <div className={sectionChoose === 'profile' ?
                            'section text-white py-3 my-[2px] flex items-center bg-[#123826] rounded-[5px]' :
                            'section cursor-pointer py-3 my-[2px] flex items-center hover:bg-[#123826] rounded-[5px] hover:opacity-40 hover:text-white'}
                            onClick={() => changeSection('profile')}
                        >
                            <FontAwesomeIcon icon={faUser} className='user-icon text-[35px] pr-5' />
                            <span className='text-[20px]'>My Profile</span>
                        </div>
                        <div className={sectionChoose === 'notification' ?
                            'section text-white py-3 my-[2px] flex items-center bg-[#123826] rounded-[5px]' :
                            'section cursor-pointer py-3 my-[2px] flex items-center hover:bg-[#123826] rounded-[5px] hover:opacity-40 hover:text-white'}
                            onClick={() => changeSection('notification')}
                        >
                            <FontAwesomeIcon icon={faBell} className='user-icon text-[35px] pr-5' />
                            <span className='text-[20px]'>Notification</span>
                        </div>
                        <div className={sectionChoose === 'event' ?
                            'section py-3 my-[2px] text-white flex items-center bg-[#123826] rounded-[5px]' :
                            'section cursor-pointer py-3 my-[2px] flex items-center hover:bg-[#123826] rounded-[5px] hover:opacity-40 hover:text-white'}
                            onClick={() => changeSection('event')}
                        >
                            <FontAwesomeIcon icon={faCalendarCheck} className='user-icon text-[35px] pr-5' />
                            <span className='text-[20px]'>My Favorite Events</span>
                        </div>
                    </div>
                    <div className='content-right w-[70%] h-full'>
                        <div className='my-profile-container h-full rounded-[15px] shadow-md'>
                            <div className='content-up h-[25%] flex flex-col justify-center border-b border-gray-300 mx-7 pl-5'>
                                <div className='text-[25px]'><b>{sectionChoose === 'profile' ? 'My Account' : `${sectionChoose === 'notification' ? 'Notifications' : 'My Favorite Events'}`}</b></div>
                                <span className='pt-2 text-[16px]'>{sectionChoose === 'profile' ? 'Manage information to secure your account' :
                                    `${sectionChoose === 'notification' ? 'Check notifications regularly to update about your favorite tournament schedule' : 'Mark your favorite tournament to recieve schedule details via email'}`}
                                </span>
                            </div>
                            <div className='content-down h-[75%] mx-7 p-5'>                              
                                {sectionChoose === 'profile' ? <AccountManageSetting/> : sectionChoose === 'notification' ? <NotificationSetting/> : <FollowedTournaments/>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileManagement;