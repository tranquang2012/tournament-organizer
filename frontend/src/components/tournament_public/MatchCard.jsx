import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom';

import logo1 from '../../assets/defaultTeamLogos/logo1.jpg'


const MatchCard = ({ match }) => {
    const team1Lose = match.status === 'Completed' && match.team1.score < match.team2.score
    const team2Lose = match.status === 'Completed' && match.team2.score < match.team1.score

    return (
        <div className='w-full flex flex-col rounded-[5px] border border-[#123836]/20 shadow-sm text-[13px] md:text-[18px]'>
            <div className='text-center py-[1%] font-semibold bg-[#123836] text-white rounded-t-[5px]'>MATCH {match.matchNumber}</div>
            <div className='flex w-full gap-1 md:gap-5 items-center justify-center py-[5%] border-b border-[#123836]/20'>
                <div className={`flex flex-col w-[30%] items-center justify-center md:gap-1 ${team1Lose && 'opacity-40' } `}>
                    <img src={match.team1.logo} className='h-10 w-10 md:h-15 md:w-15 object-contain' />
                    <span className='text-[13px] md:text-[16px] font-semibold'>{match.team1.name}</span>
                </div>
                <span className='text-[10px] md:text-[18px] font-semibold'>{match.team1.score} - {match.team2.score}</span>
                <div className={`flex flex-col w-[30%] items-center justify-center md:gap-1 ${team2Lose && 'opacity-40' } `}>
                    <img src={match.team2.logo} className='h-10 w-10 md:h-15 md:w-15 object-contain' />
                    <span className='text-[13px] md:text-[16px] font-semibold'>{match.team2.name}</span>
                </div>
            </div>
        </div>
    )
}

export default MatchCard;