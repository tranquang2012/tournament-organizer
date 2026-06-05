import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPencil, faBell, faCalendarCheck, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth';

const MatchScoreCard = () => {

    const { profile: userData, accessToken, refreshProfile } = useAuth()

    return (
        <div className='w-full flex flex-col gap-3'>
            <span className='text-[18px] md:text-[25px] font-semibold'>Tournament Name</span>
            <span className='text-[12px] md:text-[17px] font-normal'>Match 11- Group A Match</span>
            <div className='flex w-full h-[150px] md:h-[230px]  border border-[#d9d9d9] rounded-lg'>
                <div className='flex flex-col w-[50%] gap-1'>
                    <span className='text-[15px]'>Date: 08/02/2027</span>
                    <span className='text-[15px]'>Time: 03:00 PM</span>
                </div>
                <div className='w-[50%] bg-[#123836] rounded-tr-lg rounded-br-lg'>

                </div>
            </div>
        </div>
    )
};

export default MatchScoreCard;