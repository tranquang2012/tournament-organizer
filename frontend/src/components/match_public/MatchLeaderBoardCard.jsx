import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom';

import logo1 from '../../assets/defaultTeamLogos/logo1.jpg'
import logo2 from '../../assets/defaultTeamLogos/logo2.jpg'
import logo3 from '../../assets/defaultTeamLogos/logo3.jpg'
import trophy from '../../assets/trophy.png'

const MatchLeaderBoardCard = ({ match }) => {
    const isCompleted = match.status === 'completed';
    const isOngoing = match.status === 'ongoing';
    const isPausing = match.status === 'pausing';
    const navigate = useNavigate();

    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        if (!match.startTime) return;
        if (isPausing) {
            const start = new Date(match.startTime).getTime();
            const pausedAt = new Date(match.pausedTime).getTime();
            const diff = Math.floor((pausedAt - start) / 1000);
            setElapsedSeconds(diff > 0 ? diff : 0);
            return;
        }
        if (!isOngoing) return;

        const updateElapsed = () => {
            const start = new Date(match.startTime).getTime();
            const diff = Math.floor((Date.now() - start) / 1000);
            setElapsedSeconds(diff > 0 ? diff : 0);
        };

        updateElapsed();
        const interval = setInterval(updateElapsed, 1000);
        return () => clearInterval(interval);
    }, [isOngoing, isPausing, match.startTime, match.pausedTime]);

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}'`;
    };

    return (
        <div className='w-full flex flex-col gap-3'>
            <span className='text-[18px] md:text-[25px] font-semibold text-[#123836] hover:underline cursor-pointer hover:opacity-70'
                onClick={() => navigate(`/tournaments`)}
            >
                {match.tournamentName}
            </span>
            <span className='text-[12px] md:text-[17px] font-normal'>Match {match.matchNumber} - {match.round} Match</span>
            <div className='relative flex w-full h-[150px] md:h-[230px] border border-[#d9d9d9] cursor-pointer 
                rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#123836]'
                onClick={() => navigate(`./matches/${match.matchNumber}`)}
            >
                <div className='w-full h-[10%] flex items-center gap-2 bg-[#123836] text-white px-3 rounded-tl-lg rounded-tr-lg'>
                    <span className='text-[10px] md:text-[15px] pr-3 border-r border-white'>Date: {match.date}</span>
                    <span className='text-[10px] md:text-[15px]'>Time: {match.time}</span>
                </div>
            </div>
        </div>
    )
};

export default MatchLeaderBoardCard;