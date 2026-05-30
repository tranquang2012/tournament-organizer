import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPencil, faBell, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth';

//import component


const NotificationSetting = () => {

    const { profile: userData } = useAuth()

    return (
        <div>
            <div className='notification flex flex-col items-center justify-center h-full w-[100%]'>
                <div className="bg-[url('../../assets/no-notification.png')] bg-no-repeat bg-cover bg-center w-[80px] h-[80px]"></div>
                <span className='text-[16px]'>No notification yet!</span>
            </div>
        </div>
    );
};

export default NotificationSetting;