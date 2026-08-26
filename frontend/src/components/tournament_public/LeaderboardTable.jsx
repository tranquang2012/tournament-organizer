import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom';


const LeaderboardTable = ({ group, advanceCount }) => {

    return (
        <div className='w-full overflow-x-auto'>
        <div className='w-full min-w-[320px] flex flex-col rounded-[15px] border border-[#123836]/20 shadow-sm text-xs md:text-[18px]'>
            <div className='text-center py-[1%] uppercase font-semibold'>{group.name}</div>
            <div className='flex bg-[#123836] text-white px-[1%] py-[1%] font-semibold text-center'>
                <span className='w-[10%] border-r border-gray-300'>RANK</span>
                <span className='w-[60%] border-r border-gray-300'>PARTICIPANTS</span>
                <span className='w-[15%] border-r border-gray-300'>WIN - LOSE</span>
                <span className='w-[15%]'>WIN RATE</span>
            </div>
            {group.teams.map((team, index) => {
                const winRate = team.win + team.lose > 0 ? Math.round((team.win / (team.win + team.lose)) * 100) : 0
                const isEliminated = team.status === 'eliminated' || team.eliminated === true || (Number(advanceCount) > 0 && team.advanced === false);
                return (
                    <div
                        key={index}
                        className={`flex mx-[1%] py-[1%] text-center items-center border-t border-gray-300 ${isEliminated ? 'text-gray-400 font-normal' : 'font-semibold'}`}
                    >
                        <span className='w-[10%]'>{team.rank}</span>
                        <div className='w-[60%] flex gap-2 text-start items-center pl-[1%]'>
                            <img src={team.logo} className={`h-4 w-4 md:h-7 md:w-7 object-contain ${isEliminated ? 'opacity-40' : ''}` } />
                            <span className='truncate'>{team.name}</span>
                        </div>
                        <span className='w-[15%]'>{team.win} - {team.lose}</span>
                        <span className='w-[15%]'>{winRate}%</span>
                    </div>
                )
            })}
        </div>
        </div>
    )
}

export default LeaderboardTable;