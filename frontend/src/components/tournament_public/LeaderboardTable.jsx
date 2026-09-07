import { isLeagueTableStandings } from '../../constants/sports';

const LeaderboardTable = ({ group, advanceCount, standingsMode }) => {
    const leagueTable = isLeagueTableStandings(standingsMode);

    return (
        <div className='w-full min-w-0 overflow-x-auto'>
        <div className={`w-full ${leagueTable ? 'min-w-[36rem]' : 'min-w-[32rem]'} flex flex-col rounded-[15px] border border-[#123836]/20 shadow-sm text-xs md:text-[18px]`}>
            <div className='text-center py-[1%] uppercase font-semibold'>{group.name}</div>
            <div className='flex bg-[#123836] text-white px-[1%] py-[1%] font-semibold text-center'>
                <span className='w-[10%] min-w-[3.5rem] shrink-0 border-r border-gray-300'>RANK</span>
                <span className={`${leagueTable ? 'w-[50%]' : 'w-[60%]'} min-w-[8rem] border-r border-gray-300`}>PARTICIPANTS</span>
                {leagueTable ? (
                    <>
                        <span className='w-[25%] min-w-[6rem] shrink-0 whitespace-nowrap border-r border-gray-300'>W - D - L</span>
                        <span className='w-[15%] min-w-[3.5rem] shrink-0'>PTS</span>
                    </>
                ) : (
                    <>
                        <span className='w-[15%] min-w-[7rem] shrink-0 whitespace-nowrap border-r border-gray-300'>WIN - LOSE</span>
                        <span className='w-[15%] min-w-[6rem] shrink-0 whitespace-nowrap'>WIN RATE</span>
                    </>
                )}
            </div>
            {group.teams.map((team, index) => {
                const wins = team.wins ?? team.win ?? 0;
                const draws = team.draws ?? 0;
                const losses = team.losses ?? team.lose ?? 0;
                const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
                const isEliminated = team.status === 'eliminated' || team.eliminated === true || (Number(advanceCount) > 0 && team.advanced === false);
                return (
                    <div
                        key={index}
                        className={`flex mx-[1%] py-[1%] text-center items-center border-t border-gray-300 ${isEliminated ? 'text-gray-400 font-normal' : 'font-semibold'}`}
                    >
                        <span className='w-[10%] min-w-[3.5rem] shrink-0'>{team.rank}</span>
                        <div className={`${leagueTable ? 'w-[50%]' : 'w-[60%]'} min-w-0 flex gap-2 text-start items-center pl-[1%]`}>
                            <img src={team.logo} className={`h-4 w-4 md:h-7 md:w-7 object-contain shrink-0 ${isEliminated ? 'opacity-40' : ''}` } />
                            <span className='truncate'>{team.name}</span>
                        </div>
                        {leagueTable ? (
                            <>
                                <span className='w-[25%] min-w-[6rem] shrink-0 whitespace-nowrap'>{wins} - {draws} - {losses}</span>
                                <span className='w-[15%] min-w-[3.5rem] shrink-0'>{team.points ?? 0}</span>
                            </>
                        ) : (
                            <>
                                <span className='w-[15%] min-w-[7rem] shrink-0 whitespace-nowrap'>{wins} - {losses}</span>
                                <span className='w-[15%] min-w-[6rem] shrink-0 whitespace-nowrap'>{winRate}%</span>
                            </>
                        )}
                    </div>
                )
            })}
        </div>
        </div>
    )
}

export default LeaderboardTable;
