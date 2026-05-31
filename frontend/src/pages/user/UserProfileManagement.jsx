import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPencil, faBell, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth';
import clsx from 'clsx';

//import API
import { uploadCurrentUserAvatar } from '../../services/AuthService';

//import component
import TopNavBar from '../../components/layout/TopNavbar';
import AccountManageSetting from '../../components/user_dashboard/AccountManageSetting';
import NotificationSetting from '../../components/user_dashboard/NotificationSettings';
import FollowedTournaments from '../../components/user_dashboard/FollowedTournaments';
import TopLoadingBar from '../../components/common/TopLoadingBar';
import NotificationToast from '../../components/common/NotificationToast';

const UserProfileManagement = () => {


    const { profile: userData, accessToken, refreshProfile } = useAuth()
    const [avatarUrl, setAvatarUrl] = useState(userData?.avatarUrl || null)
    const [sectionChoose, setSectionChoose] = useState('profile')
    const [isLoading, setIsLoading] = useState(true)
    const [toast, setToast] = useState(null)

    useEffect(() => {
        if (userData) {
            setTimeout(() => {
                setIsLoading(false)
            }, 1000)
        }
    }, [userData])

    useEffect(() => {
        setAvatarUrl(userData?.avatarUrl || null)
    }, [userData?.avatarUrl])


    const changeSection = (section) => {
        setSectionChoose(section)
    }

    //change section choose class
    const sectionClass = (section) => clsx(
        'section py-3 my-[2px] flex items-center rounded-[5px]',
        sectionChoose === section
            ? 'text-white bg-[#123826]'
            : 'cursor-pointer hover:bg-[#123826] hover:opacity-40 hover:text-white'
    )

    //update avatar
    const handleUploadAvatar = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        try {
            const result = await uploadCurrentUserAvatar(file, accessToken)
            await setAvatarUrl(result.data.avatarUrl)
            setToast({ type: 'success', message: 'Avatar updated successfully!' })
        } catch (error) {
            console.error('upload error:', error)
            setToast({ type: 'error', message: 'Failed to update avatar!' })
        }
    }


    return (
        <div>
            <NotificationToast toast={toast} onDismiss={() => setToast(null)} />
            <TopLoadingBar isLoading={isLoading} />
            <div className='account-management'>
                <div className='flex items-center bg-[#123826] h-[60px] px-[5%] md:px-[21%] text-white text-[20px] md:text-[30px]'>
                    Account Management
                </div>
                <div className='flex flex-col md:flex-row w-full px-[5%] md:px-[21%] py-5 gap-5'>
                    <div className='w-full md:w-[30%]'>
                        {/* Avatar */}
                        <div className='flex items-center mb-5 gap-4'>
                            <div className='profile-image border border-black rounded-full h-[80px] w-[80px] md:h-[120px] md:w-[120px] flex items-center justify-center overflow-hidden shrink-0'>
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="avatar" className='w-full h-full object-cover' />
                                ) : (
                                    <FontAwesomeIcon icon={faUser} className='text-[50px] md:text-[80px]' />
                                )}
                            </div>
                            <div className='flex flex-col justify-center'>
                                <div className='text-[18px] md:text-[25px]'><b>{userData?.fullName}</b></div>
                                <input type='file' accept='image/*' id='avatar-upload' className='hidden' onChange={handleUploadAvatar} />
                                <label htmlFor='avatar-upload' className='cursor-pointer text-gray-600 text-[14px] md:text-[16px] mt-1 hover:underline hover:text-[#123826]'>
                                    <FontAwesomeIcon icon={faPencil} /> Change your avatar
                                </label>
                            </div>
                        </div>
                        <div className='flex md:flex-col gap-1 overflow-x-auto'>
                            <div className={sectionClass('profile')} onClick={() => changeSection('profile')}>
                                <FontAwesomeIcon icon={faUser} className='text-[20px] md:text-[35px] pr-2 md:pr-5' />
                                <span className='text-[14px] md:text-[20px] whitespace-nowrap'>My Profile</span>
                            </div>
                            <div className={sectionClass('notification')} onClick={() => changeSection('notification')}>
                                <FontAwesomeIcon icon={faBell} className='text-[20px] md:text-[35px] pr-2 md:pr-5' />
                                <span className='text-[14px] md:text-[20px] whitespace-nowrap'>Notification</span>
                            </div>
                            <div className={sectionClass('event')} onClick={() => changeSection('event')}>
                                <FontAwesomeIcon icon={faCalendarCheck} className='text-[20px] md:text-[35px] pr-2 md:pr-5' />
                                <span className='text-[14px] md:text-[20px] whitespace-nowrap'>My Favorite Events</span>
                            </div>
                        </div>
                    </div>
                    <div className='w-full md:w-[70%]'>
                        <div className='rounded-[15px] shadow-md'>
                            <div className='flex flex-col justify-center border-b border-gray-300 mx-4 md:mx-7 pl-3 md:pl-5 py-4'>
                                <div className='text-[20px] md:text-[25px]'>
                                    <b>{sectionChoose === 'profile' ? 'My Account' : sectionChoose === 'notification' ? 'Notifications' : 'My Favorite Events'}</b>
                                </div>
                                <span className='pt-2 text-[13px] md:text-[16px]'>
                                    {sectionChoose === 'profile' ? 'Manage information to secure your account' :
                                        sectionChoose === 'notification' ? 'Check notifications regularly to update about your favorite tournament schedule' :
                                            'Mark your favorite tournament to recieve schedule details via email'}
                                </span>
                            </div>
                            <div className='mx-4 md:mx-7 p-3 md:p-5'>
                                {sectionChoose === 'profile' ? <AccountManageSetting /> : sectionChoose === 'notification' ? <NotificationSetting /> : <FollowedTournaments />}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
};

export default UserProfileManagement;