import trophy from '../../assets/trophy.png'
import { formatDuration } from '../../utils/duration'

const RoundScoringTable = ({ match, scoreMode = 'points' }) => {
    const isCompleted = match.status === 'completed';
    const isOngoing = match.status === 'ongoing';

    const rankBadge = (rank) => {
        if (rank === 1) return '🥇'
        if (rank === 2) return '🥈'
        if (rank === 3) return '🥉'
        return null
    }

    return (
        <div className='w-full'>
            {/* Header */}
            <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-2'>
                    {isCompleted ? (
                        <span className='flex items-center gap-1 text-green-500 font-semibold text-[17px]'>
                            <span className='w-2 h-2 rounded-full bg-green-500 inline-block'></span> Finished
                        </span>
                    ) : isOngoing ? (
                        <span className='flex items-center gap-1 text-red-500 font-semibold text-[17px]'>
                            <span className='w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse'></span> Live
                        </span>
                    ) : (
                        <span className='flex items-center gap-1 text-slate-500 font-semibold text-[17px]'>
                            <span className='w-2 h-2 rounded-full bg-slate-400 inline-block'></span> Upcoming
                        </span>
                    )}
                </div>
                <div className='flex items-center gap-2 font-bold text-[20px] uppercase tracking-wide'>
                    Match Scores <img src={trophy} alt='trophy' className='w-3 h-3 md:h-6 md:w-6 object-contain' />
                </div>
                <div className='w-20' />
            </div>

            {/* Table */}
            <div className='border border-gray-200 rounded-[10px] overflow-hidden shadow-sm overflow-x-auto'>
                <table className='w-full text-xs md:text-[15px] min-w-[300px]'>
                    <thead>
                        <tr className='bg-[#123836] text-white'>
                            <th className='text-left px-4 py-3 font-semibold'>Participants</th>
                            {match.rounds.map(r => (
                                <th key={r} className='text-center px-3 py-3 font-semibold'>{r}</th>
                            ))}
                            <th className='text-center px-3 py-3 font-semibold text-red-300'>
                                {scoreMode === 'time' ? 'Best Time' : 'Total Score'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {match.participants.map((p, i) => {
                            const total = scoreMode === 'time'
                                ? (p.scores.filter((v) => v != null).length
                                    ? Math.min(...p.scores.filter((v) => v != null).map(Number))
                                    : null)
                                : p.scores.reduce((sum, value) => sum + (Number(value) || 0), 0)
                            return (
                                <tr key={i} className='border-t border-gray-100 hover:bg-gray-50 transition-colors'>
                                    <td className='px-4 py-3 font-medium text-gray-800 flex items-center gap-2'>
                                        {p.name}
                                        {rankBadge(p.rank) && <span>{rankBadge(p.rank)}</span>}
                                    </td>
                                    {p.scores.map((s, j) => (
                                        <td key={j} className='text-center px-3 py-3 text-gray-700'>
                                            {s == null ? '--' : (scoreMode === 'time' ? formatDuration(s) : s)}
                                        </td>
                                    ))}
                                    <td className='text-center px-3 py-3 font-bold text-red-500'>
                                        {total == null ? '--' : (scoreMode === 'time' ? formatDuration(total) : total)}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default RoundScoringTable