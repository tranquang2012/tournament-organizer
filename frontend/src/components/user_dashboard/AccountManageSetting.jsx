import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPencil, faBell, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth';

//import component


const AccountManageSetting = () => {

    const { profile: userData } = useAuth()
    const { userName, setUserName } = useState(null)

    useEffect(() => {

        return () => {
            // 2. Cleanup (Optional): Code to run before re-running 
            // the effect or when the component unmounts
        };
    }, [userName]); 


    return (
        <div>
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
                        value={userData?.fullName || ''}
                        className='w-full h-[40px] border border-gray-300 rounded-md px-4 shadow-sm outline-none text-[16px]'
                        onChange={(event) => event.target.value}
                    />
                </div>
            </div>
            <div className='button flex py-8 gap-x-[3%]'>
                <button className='save-button cursor-pointer w-[20%] py-1 text-[16px] text-white bg-[#123826] rounded-[10px] hover:bg-[#3aba90]'
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