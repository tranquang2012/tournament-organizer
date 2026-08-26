import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom';

import playerLogo from '../../assets/playerLogo.png'

const ParticipantTable = ({ participants }) => {

    return (
        <div className='w-full overflow-x-auto'>
        <div className='w-full min-w-[280px] flex flex-col rounded-[15px] border border-[#123836]/20 shadow-sm text-xs md:text-[18px]'>
            <div className='flex bg-[#123836] text-white px-[1%] py-[1%] font-semibold text-center rounded-tr-[15px]  rounded-tl-[15px]'>
                <span className='w-[10%] border-r border-gray-300'>#</span>
                <span className='w-[70%] border-r border-gray-300'>PARTICIPANTS</span>
                <span className='w-[20%]'>EXPERIENCE</span>
            </div>
            {participants.map((participant, index) => {
                return (
                    <div
                        key={index}
                        className='flex mx-[1%] py-[1%] text-center items-center border-t border-gray-300 font-semibold'
                    >
                        <span className='w-[10%]'>{index + 1}</span>
                        <div className='w-[70%] flex gap-2 text-start items-center pl-[1%]'>
                            <img src={playerLogo} className='h-4 w-4 md:h-7 md:w-7 object-contain shrink-0' />
                            <span className='truncate'>{participant.name}</span>
                        </div>
                        <span className='w-[20%]'>{participant.experience}</span>
                    </div>
                )
            })}
        </div>
        </div>
    )
}

export default ParticipantTable;