import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react'

import logo1 from '../../assets/defaultTeamLogos/logo1.jpg'
import logo2 from '../../assets/defaultTeamLogos/logo2.jpg'
import trophy from '../../assets/trophy.png'

const MatchDetailCard = ({ match }) => {
    const isCompleted = match.status === 'completed';
    const isOngoing = match.status === 'ongoing';
    const isPausing = match.status === 'pausing' || match.status === 'paused';

    const team1Losing = match.score1 < match.score2;
    const team2Losing = match.score2 < match.score1;

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const pausedElapsedSeconds = (() => {
        if (!isPausing || !match.startTime || !match.pausedTime) return 0;
        const start = new Date(match.startTime).getTime();
        const pausedAt = new Date(match.pausedTime).getTime();
        const diff = Math.floor((pausedAt - start) / 1000);
        return Number.isFinite(diff) && diff > 0 ? diff : 0;
    })();

    useEffect(() => {
        if (!match.startTime || !isOngoing) return;

        const updateElapsed = () => {
            const start = new Date(match.startTime).getTime();
            const diff = Math.floor((Date.now() - start) / 1000);
            setElapsedSeconds(diff > 0 ? diff : 0);
        };

        const timeout = setTimeout(updateElapsed, 0);
        const interval = setInterval(updateElapsed, 1000);
        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [isOngoing, match.startTime]);

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}'`;
    };

    return (
        <div className='w-full flex flex-col gap-3'>
            <div className='relative flex w-full min-h-[150px] md:min-h-[230px] border border-[#d9d9d9] cursor-pointer 
                rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#123836]'>
                <div className='flex flex-col w-[50%] mt-1'>
                    <div className='text-[20px] h-[30px] px-3 flex items-center'>
                        {isCompleted ? (
                            <FontAwesomeIcon icon={faCircle} className='text-[15px] text-green-400 mr-1' />
                        ) : isPausing ? (
                            <FontAwesomeIcon icon={faCircle} className='text-[15px] text-yellow-500 mr-1 animate-pulse' />
                        ) : (
                            <FontAwesomeIcon icon={faCircle} className='text-[15px] text-red-500 mr-1 animate-pulse' />
                        )}
                        <span className='mr-2 text-[10px] md:text-[13px] md:text-[16px]'>
                            {isCompleted ? 'Finished' : isPausing ? (match.status === 'paused' ? 'Paused' : 'Pausing') : formatTime(isPausing ? pausedElapsedSeconds : elapsedSeconds)}
                        </span>
                    </div>
                    <div className={`flex flex-col mt-[5%] items-center transition-all duration-300 ${isCompleted && team1Losing ? 'opacity-40' : ''}`}>
                        <img src={logo1} alt='logoteam1' className='w-10 h-10 md:h-15 md:w-15 object-contain' />
                        <span className='text-[10px] md:text-[15px] font-black uppercase mt-2'>{match.team1}</span>
                        <div className='flex flex-col items-center mt-2 gap-0.5'>
                            {match.home?.scorers?.map((s, i) => (
                                <span key={i} className='text-[10px] md:text-[12px] text-gray-500'>{s}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className='flex flex-col w-[50%] bg-[#123836] rounded-tr-lg rounded-br-lg text-white'>
                    <div className='h-[30px] text-[#123836]'>Hide</div>
                    <div className={`flex flex-col mt-[5%] items-center transition-all duration-300 ${isCompleted && team2Losing ? 'opacity-40' : ''}`}>
                        <img src={logo2} alt='logoteam2' className='w-10 h-10 md:h-15 md:w-15 object-contain' />
                        <span className='text-[10px] md:text-[15px] font-black uppercase mt-2'>{match.team2}</span>
                        <div className='flex flex-col items-center mt-2 gap-0.5'>
                            {match.away?.scorers?.map((s, i) => (
                                <span key={i} className='text-[10px] md:text-[12px] text-white/70'>{s}</span>
                            ))}
                        </div>
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

export default MatchDetailCard;