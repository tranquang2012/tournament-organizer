import React from 'react';

const AdminTournamentCard = ({ tournament }) => {
  const {
    image,
    title,
    format,
    startDate,
    endDate,
    completedMatches,
    totalMatches,
    matchesLabel = 'matches',
    teamsCount,
    participantsLabel = 'teams',
    liveCount,
    status
  } = tournament;

  const percentage = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  let progressBarColor = 'bg-[#ef4444]'; // red
  if (percentage >= 80) {
    progressBarColor = 'bg-[#3b82f6]'; // blue
  } else if (percentage >= 60) {
    progressBarColor = 'bg-[#22c55e]'; // green
  } else if (percentage >= 40) {
    progressBarColor = 'bg-[#eab308]'; // yellow
  } else if (percentage >= 20) {
    progressBarColor = 'bg-[#f97316]'; // orange
  }


  let badgeColor = 'bg-[#dcfce7] text-[#166534]'; // active
  let badgeDotColor = 'bg-[#22c55e]';
  if (status === 'Upcoming') {
    badgeColor = 'bg-[#f1f5f9] text-[#475569]'; // upcoming
    badgeDotColor = 'bg-[#94a3b8]';
  } else if (status === 'Completed') {
    badgeColor = 'bg-[#dbeafe] text-[#1e3a8a]'; // completed
    badgeDotColor = 'bg-[#3b82f6]';
  }

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 cursor-pointer">
      <div className="w-full aspect-[192/31] overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className={`w-fit px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${badgeColor}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${badgeDotColor}`}></div>
          {status}
        </div>
        
        <div>
          <h3 className="text-[14px] font-bold text-slate-800 leading-tight mb-1.5">{title}</h3>
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 tracking-wide">
            <span>{format}</span>
            <span>{startDate} - {endDate}</span>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-800 mb-1.5">
            <span>{completedMatches}/{totalMatches} {matchesLabel}</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`} style={{ width: `${percentage}%` }}></div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 mt-2">
          <span>{teamsCount} {participantsLabel}</span>
          {liveCount > 0 && (
            <span className="text-[#22c55e] flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-[#22c55e]"></div>
              {liveCount} live
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTournamentCard;
