import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPencil, faBell, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth';

//import api
import { updateCurrentUserProfile } from '../../services/AuthService';

//import component
import ConfirmationModal from '../common/ConfirmationModal'
import NotificationToast from '../common/NotificationToast'


const AccountManageSetting = () => {

    const { profile: userData, accessToken, refreshProfile } = useAuth()
    const [userName, setUserName] = useState(userData?.fullName || '')
    const [showConfirm, setShowConfirm] = useState(false)
    const [toast, setToast] = useState(null)

    useEffect(() => {
        if (userData?.fullName) {
            setUserName(userData.fullName)
        }
    }, [userData])

    const handleConfirmSave = async () => {
        try {
            await updateCurrentUserProfile(
                { fullName: userName },
                accessToken
            )
            await refreshProfile()
            setShowConfirm(false)
            setToast({ type: 'success', message: 'Profile updated successfully!' })
        }
        catch (error) {
            console.error("Error", error)
            setShowConfirm(false)
            setToast({ type: 'error', message: 'Failed to update profile!' })
        }
    }

    return (
        <div>
            <NotificationToast toast={toast} onDismiss={() => setToast(null)} />
            <ConfirmationModal
                open={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirmSave}
                title="Confirm Change"
                description="Are you sure to update your account profile information?"
                intent="info"
                confirmLabel="Save Changes"
                cancelLabel="Cancel"
            />
            <div className='flex flex-col md:flex-row md:items-center mb-2 gap-1 md:gap-0'>
                <div className='w-full md:w-[120px] text-[14px] md:text-[16px] font-medium'>Email</div>
                <div className='flex-1'>
                    <input
                        type='text'
                        value={userData?.email || ''}
                        disabled
                        className='w-full h-[40px] border border-gray-300 rounded-md px-4 shadow-sm bg-gray-100 text-gray-500 outline-none text-[14px] md:text-[16px]'
                    />
                </div>
            </div>
            <div className='text-gray-500 text-[12px] md:text-[14px] mb-6 md:mb-8 md:pl-30'>
                You can not change your email.
            </div>
            <div className='flex flex-col md:flex-row md:items-center mb-2 gap-1 md:gap-0'>
                <div className='w-full md:w-[120px] text-[14px] md:text-[16px] font-medium'>Username</div>
                <div className='flex-1'>
                    <input
                        type='text'
                        value={userName}
                        className='w-full h-[40px] border border-gray-300 rounded-md px-4 shadow-sm outline-none text-[14px] md:text-[16px]'
                        onChange={(event) => setUserName(event.target.value)}
                    />
                </div>
            </div>
            <div className='flex py-6 md:py-8 gap-x-[3%]'>
                <button
                    className='cursor-pointer w-full md:w-[20%] py-2 text-[14px] md:text-[16px] text-white bg-[#123826] rounded-[10px] hover:bg-[#3aba90]'
                    onClick={() => setShowConfirm(true)}
                >
                    Save Changes
                </button>
            </div>
        </div>
    )
};

export default AccountManageSetting;