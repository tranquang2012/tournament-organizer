import { useNavigate } from 'react-router-dom';
import { formatScoringSchedule } from '../../utils/dateFormatter';

const getStatusBadge = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'running':
      return 'bg-blue-100 text-blue-800';
    case 'ready':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const ScoringRoundList = ({ rounds, maxItems, className = 'grid grid-cols-1 md:grid-cols-2 gap-5' }) => {
  const navigate = useNavigate();

  if (!rounds || rounds.length === 0) {
    return (
      <div className="flex flex-col py-[5%] items-center justify-center text-gray-500">
        <span>No rounds generated yet.</span>
      </div>
    );
  }

  const displayedRounds = maxItems ? rounds.slice(0, maxItems) : rounds;

  return (
    <div className={className}>
      {displayedRounds.map((round) => {
        const scheduleLabel = formatScoringSchedule(round.scheduled_start);
        return (
          <button
            key={round.match_id}
            type="button"
            onClick={() => navigate(`/matches/${round.match_id}`)}
            className="flex items-center justify-between p-4 border border-[#123836]/20 rounded-lg shadow-sm bg-white text-left cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#123836]"
          >
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-[#123836] text-[16px] md:text-[20px]">
                {round.group_name || `Round ${round.round}`}
              </span>
              {scheduleLabel && (
                <span className="text-xs md:text-sm text-slate-500 font-medium">
                  {scheduleLabel}
                </span>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusBadge(
                round.status
              )}`}
            >
              {round.status}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ScoringRoundList;
