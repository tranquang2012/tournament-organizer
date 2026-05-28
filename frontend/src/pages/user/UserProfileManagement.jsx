import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPencil, faBell, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import './UserProfileManagement.css'
import { useAuth } from '../../hooks/useAuth';

//import component
import TopNavBar from '../../components/layout/TopNavbar';

const UserProfileManagement = () => {

    const [sectionChoose, setSectionChoose] = useState('profile')
    const { profile: userData } = useAuth()

    const changeSection = (section) => {
        setSectionChoose(section)
    }

    return (
        <div>
            <TopNavBar />
            <div className='account-management'>
                <div className='title flex items-center bg-[#123826] h-[60px] pl-90 text-white text-[30px]'>Account Management</div>
                <div className='account-management-container flex h-[500px] w-full px-90 py-5'>
                    <div className='content-left w-[30%]'>
                        <div className='profile h-[120px] w-full flex mb-5'>
                            <div className='profile-image border border-black rounded-[50%] h-full w-[120px] flex items-center justify-center'>
                                <FontAwesomeIcon icon={faUser} className='user-icon text-[80px]' />
                            </div>
                            <div className='edit-img pl-[30px] flex flex-col justify-center'>
                                <div className='text-[25px]'><b>{userData?.fullName}</b></div>
                                <div className='cursor-pointer text-gray-850'><FontAwesomeIcon icon={faPencil}></FontAwesomeIcon> Change your avatar</div>
                            </div>
                        </div>
                        <div className={sectionChoose === 'profile' ?
                            'section text-white py-5 flex items-center bg-[#123826]' :
                            'section cursor-pointer py-5 flex items-center hover:bg-[#123826] hover:opacity-30 hover:text-white'}
                            onClick={() => changeSection('profile')}
                        >
                            <FontAwesomeIcon icon={faUser} className='user-icon text-[40px] pr-5' />
                            <span className='text-[22px]'>My Profile</span>
                        </div>
                        <div className={sectionChoose === 'notification' ?
                            'section text-white py-5 flex items-center bg-[#123826]' :
                            'section cursor-pointer py-5 flex items-center hover:bg-[#123826] hover:opacity-30 hover:text-white'}
                            onClick={() => changeSection('notification')}
                        >
                            <FontAwesomeIcon icon={faBell} className='user-icon text-[40px] pr-5' />
                            <span className='text-[22px]'>Notification</span>
                        </div>
                        <div className={sectionChoose === 'event' ?
                            'section py-5 text-white flex items-center bg-[#123826]' :
                            'section cursor-pointer py-5 flex items-center hover:bg-[#123826] hover:opacity-30 hover:text-white'}
                            onClick={() => changeSection('event')}
                        >
                            <FontAwesomeIcon icon={faCalendarCheck} className='user-icon text-[40px] pr-5' />
                            <span className='text-[22px]'>My Favorite Events</span>
                        </div>
                    </div>
                    <div className='content-right w-[70%] h-full'>
                        <div className='my-profile-container h-full rounded-[15px] shadow-md'>
                            <div className='content-up h-[25%] flex flex-col justify-center border-b border-gray-300 mx-7 pl-5'>
                                <div className='text-[25px]'><b>My Profile</b></div>
                                <span className='pt-2'>Manage information to secure your account </span>
                            </div>
                            <div className='content-down h-[75%] mx-7 p-5'>
                                <div className='flex items-center mb-2'>
                                    <div className='w-[120px] text-[18px] font-medium'>Email</div>
                                    <div className='flex-1'>
                                        <input
                                            type='text'
                                            value={userData?.email || ''}
                                            disabled
                                            className='w-full h-[40px] border border-gray-300 rounded-md px-4 shadow-sm bg-gray-100 text-gray-500 outline-none'
                                        />
                                    </div>
                                </div>
                                <div className='text-gray-500 text-[14px] pl-30 mb-8'>
                                    You can not change your email.
                                </div>
                                <div className='flex items-center mb-2'>
                                    <div className='w-[120px] text-[18px] font-medium'>Username</div>
                                    <div className='flex-1'>
                                        <input
                                            type='text'
                                            value={userData?.fullName || ''}
                                            className='w-full h-[40px] border border-gray-300 rounded-md px-4 shadow-sm outline-none'
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileManagement;
