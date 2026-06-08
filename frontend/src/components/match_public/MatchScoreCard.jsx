import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom';

import logo1 from '../../assets/defaultTeamLogos/logo1.jpg'
import logo2 from '../../assets/defaultTeamLogos/logo2.jpg'
import logo3 from '../../assets/defaultTeamLogos/logo3.jpg'
import trophy from '../../assets/trophy.png'

const MatchScoreCard = ({ match }) => {
    const isCompleted = match.status === 'completed';
    const isOngoing = match.status === 'ongoing';
    const navigate = useNavigate();

    const team1Losing = match.score1 < match.score2;
    const team2Losing = match.score2 < match.score1;

    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        if (!isOngoing || !match.startTime) return;
        const updateElapsed = () => {
            const start = new Date(match.startTime).getTime();
            const now = Date.now();
            const diff = Math.floor((now - start) / 1000);
            setElapsedSeconds(diff > 0 ? diff : 0);
        };
        updateElapsed();
        const interval = setInterval(updateElapsed, 1000);
        return () => clearInterval(interval);
    }, [isOngoing, match.startTime]);

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}'`;
    };

    return (
        <div className='w-full flex flex-col gap-3'>
            <span className='text-[18px] md:text-[25px] font-semibold'>{match.tournamentName}</span>
            <span className='text-[12px] md:text-[17px] font-normal'>Match {match.matchNumber} - {match.round} Match</span>
            <div className='relative flex w-full h-[150px] md:h-[230px] border border-[#d9d9d9] cursor-pointer 
                rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#123836]'
                onClick={() => navigate(`./matches/${match.matchNumber}`)}
            >
                <div className='flex flex-col w-[50%] mt-1'>
                    <span className='text-[10px] md:text-[15px] h-[10%]'>Date: {match.date}</span>
                    <span className='text-[10px] md:text-[15px] h-[10%]'>Time: {match.time}</span>
                    <div className={`flex flex-col mt-[5%] items-center transition-all duration-300 ${isCompleted && team1Losing ? 'opacity-40' : ''}`}>
                        <img src={logo1} alt='logoteam1' className='w-10 h-10 md:h-15 md:w-15 object-contain' />
                        <span className='text-[10px] md:text-[15px] font-black uppercase'>{match.team1}</span>
                    </div>
                </div>
                <div className='flex flex-col w-[50%] bg-[#123836] rounded-tr-lg rounded-br-lg text-white'>
                    <div className='text-[20px] h-[20%] text-right mt-1 flex items-center justify-end'>
                        {isCompleted ? (
                            <FontAwesomeIcon icon={faCircle} className='text-green-400 mr-1' />
                        ) : (
                            <FontAwesomeIcon icon={faCircle} className='text-red-500 mr-1 animate-pulse' />
                        )}
                        <span className='mr-2 text-[10px] md:text-[13px] md:text-[16px]'>
                            {isCompleted ? 'Completed' : formatTime(elapsedSeconds)}
                        </span>
                    </div>
                    <div className={`flex flex-col mt-[5%] items-center transition-all duration-300 ${isCompleted && team2Losing ? 'opacity-40' : ''}`}>
                        <img src={logo2} alt='logoteam2' className='w-10 h-10 md:h-15 md:w-15 object-contain' />
                        <span className='text-[10px] md:text-[15px] font-black uppercase'>{match.team2}</span>
                    </div>
                </div>
                <div className='absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none'>
                    <div className='flex items-center mt-[3%]'>
                        <span className='text-[20px] md:text-[32px] font-bold text-black mr-1'>{match.score1}</span>
                        <span className='text-[20px] md:text-[15px] font-black text-black'>—</span>
                        <span className='text-[20px] md:text-[15px] font-black text-white'>—</span>
                        <span className='text-[20px] md:text-[32px] font-bold text-white ml-1'>{match.score2}</span>
                    </div>
                    <img src={trophy} alt='trophy' className='w-10 h-10 md:h-13 md:w-13 object-contain' />
                </div>
            </div>
        </div>
    )
};

export default MatchScoreCard;