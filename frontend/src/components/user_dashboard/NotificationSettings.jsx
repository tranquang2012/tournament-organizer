import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPencil, faBell, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth';
import notification from '../../assets/notification.png'

//import component



const NotificationSetting = () => {

    const { profile: userData } = useAuth()

    return (
        <div>
            <div className='notification flex flex-col items-center justify-center h-[300px]'>
                <img
                    src={notification}
                    alt="no-notification"
                    className='w-[100px] h-[80px]'
                />
                <span className='text-[16px]'>No notification yet!</span>
            </div>
        </div>
    );
};

export default NotificationSetting;