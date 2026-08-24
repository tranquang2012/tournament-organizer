import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

import logo1 from '../../assets/defaultTeamLogos/logo1.jpg'

import first from '../../assets/RankingIcon/1st.png'
import second from '../../assets/RankingIcon/2nd.png'
import third from '../../assets/RankingIcon/3rd.png'

const MatchLeaderBoardCard = ({ match }) => {
    const isCompleted = match.status === 'completed';
    const isOngoing = match.status === 'ongoing';
    const isPausing = match.status === 'pausing' || match.status === 'paused';
    const navigate = useNavigate();

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

    const visibleParticipants = (match.participants || []).slice(0, 5);
    const hasMoreParticipants = (match.participants || []).length > 5;

    return (
        <div className='w-full flex flex-col gap-3'>
            <span className='text-[18px] md:text-[25px] font-semibold text-[#123836] hover:underline cursor-pointer hover:opacity-70'
                onClick={() => match.tourId && navigate(`/tournaments/${match.tourId}`)}
            >
                {match.tournamentName}
            </span>
            <span className='text-[12px] md:text-[17px] font-normal'>{match.matchLabel || `Match ${match.matchNumber} - ${match.round} Match`}</span>
            <div className='relative flex flex-col w-full border border-[#d9d9d9] cursor-pointer
                rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#123836]'
                onClick={() => match.matchId && navigate(`/matches/${match.matchId}`)}
            >
                <div className='w-full h-[44px] shrink-0 flex items-center gap-2 bg-[#123836] text-white px-3 rounded-tl-lg rounded-tr-lg'>
                    <span className='text-[10px] md:text-[15px] pr-3 border-r border-white'>Date: {match.date}</span>
                    <span className='text-[10px] md:text-[15px]'>Time: {match.time}</span>
                    <span className='text-[20px] text-right flex items-center ml-auto'>
                        {isCompleted ? (
                            <FontAwesomeIcon icon={faCircle} className='text-[15px] text-green-400 mr-1' />
                        ) : isPausing ? (
                            <FontAwesomeIcon icon={faCircle} className='text-[15px] text-yellow-500 mr-1 animate-pulse' />
                        ) : (
                            <FontAwesomeIcon icon={faCircle} className='text-[15px] text-red-500 mr-1 animate-pulse' />
                        )}
                        <span className='text-[10px] md:text-[13px] md:text-[16px]'>
                            {isCompleted ? 'Finished' : isPausing ? (match.status === 'paused' ? 'Paused' : 'Pausing') : formatTime(isPausing ? pausedElapsedSeconds : elapsedSeconds)}
                        </span>
                    </span>
                </div>
                <div className='flex flex-col w-full p-3 gap-2'>
                    {visibleParticipants.map((participant, index) => (
                        <div key={index} className={`h-10 shrink-0 text-[13px] md:text-[17px] flex items-center gap-3 border rounded-md px-3
                            ${isCompleted && index >= 3
                            ? 'bg-gray-100 border-gray-200 text-gray-400 hover:bg-gray-100'
                            : 'border-gray-300 hover:bg-[#f0f0f0]'}`}
                        >
                            <div className='w-8 h-8 flex items-center justify-center flex-shrink-0'>
                                {index === 0 ? (
                                    <img src={first} className='h-full w-full object-contain' />
                                ) : index === 1 ? (
                                    <img src={second} className='h-full w-full object-contain' />
                                ) : index === 2 ? (
                                    <img src={third} className='h-full w-full object-contain' />
                                ) : (
                                    <span className='font-medium text-gray-600'>{index + 1}</span>
                                )}
                            </div>
                            <img
                                src={participant.logo || logo1}
                                alt={participant.name}
                                className={`h-4 w-4 md:h-6 md:w-6 object-contain ${isCompleted && index >= 3 ? 'opacity-40' : ''}`}
                            />
                            <span className={`font-semibold truncate ${isCompleted && index >= 3 ? 'text-gray-400' : ''}`}>{participant.name}</span>
                            <span className={`font-semibold ml-auto ${isCompleted && index >= 3 ? 'text-gray-400' : ''}`}>{participant.score} pts</span>
                        </div>
                    ))}
                </div>
                {hasMoreParticipants && (
                    <span className='shrink-0 text-gray-500 text-[13px] md:text-[15px] text-center hover:text-[#123836] cursor-pointer pb-2'>View more participants</span>
                )}
            </div>
        </div>
    )
};

export default MatchLeaderBoardCard;