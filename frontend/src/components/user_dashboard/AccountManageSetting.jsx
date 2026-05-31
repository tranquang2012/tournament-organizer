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
            <NotificationToast
                toast={toast}
                onDismiss={() => setToast(null)}
            />
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
            <div className='flex items-center mb-2'>
                <div className='w-[120px] text-[16px] font-medium'>Email</div>
                <div className='flex-1'>
                    <input
                        type='text'
                        value={userData?.email || ''}
                        disabled
                        className='w-full h-[40px] border border-gray-300 rounded-md px-4 shadow-sm bg-gray-100 text-gray-500 outline-none text-[16px]'
                    />
                </div>
            </div>
            <div className='text-gray-500 text-[14px] pl-30 mb-8'>
                You can not change your email.
            </div>
            <div className='flex items-center mb-2'>
                <div className='w-[120px] text-[16px] font-medium'>Username</div>
                <div className='flex-1'>
                    <input
                        type='text'
                        value={userName}
                        className='w-full h-[40px] border border-gray-300 rounded-md px-4 shadow-sm outline-none text-[16px]'
                        onChange={(event) => setUserName(event.target.value)}
                    />
                </div>
            </div>
            <div className='button flex py-8 gap-x-[3%]'>
                <button
                    className='save-button cursor-pointer w-[20%] py-1 text-[16px] text-white bg-[#123826] rounded-[10px] hover:bg-[#3aba90]'
                    onClick={() => setShowConfirm(true)}
                >
                    Save Changes
                </button>
                <button className='save-button cursor-pointer w-[20%] py-1 text-[16px] text-white bg-[#ed2121] rounded-[10px] hover:bg-[#eb6565]'>
                    Deactivate
                </button>
            </div>
        </div>
    );
};

export default AccountManageSetting;