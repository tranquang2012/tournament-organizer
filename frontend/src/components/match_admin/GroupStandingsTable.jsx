import React from 'react';

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

const GroupStandingsTable = ({ standings, totalRoundRobinMatches }) => {
  const completedMatches = standings.reduce((sum, s) => sum + s.played, 0) / 2;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Group Standings</h2>
        <p className="text-xs font-medium text-slate-400 mt-0.5">
          {completedMatches}/{totalRoundRobinMatches} matches completed
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="pl-5 pr-2 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-10">#</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Team</th>
              <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-16">P</th>
              <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-16">W</th>
              <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-16">L</th>
              <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-20">W/L %</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, idx) => {
              const isTopThree = idx < 3;
              return (
                <tr
                  key={row.rank}
                  className={`
                    border-b border-slate-50 transition-colors duration-150
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
                    hover:bg-[#123836]/[0.03]
                  `}
                >
                  {/* Rank */}
                  <td className="pl-5 pr-2 py-3.5">
                    {isTopThree ? (
                      <span className="text-base">{MEDAL_ICONS[idx]}</span>
                    ) : (
                      <span className="text-sm font-bold text-slate-400">{row.rank}</span>
                    )}
                  </td>

                  {/* Team */}
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-3">
                      {row.team.logo ? (
                        <img
                          src={row.team.logo}
                          alt={row.team.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold shadow-sm">
                          ?
                        </div>
                      )}
                      <span className={`font-semibold ${isTopThree ? 'text-slate-800' : 'text-slate-600'}`}>
                        {row.team.name}
                      </span>
                    </div>
                  </td>

                  {/* Played */}
                  <td className="px-3 py-3.5 text-center font-semibold text-slate-600">{row.played}</td>

                  {/* Wins */}
                  <td className="px-3 py-3.5 text-center font-bold text-emerald-600">{row.wins}</td>

                  {/* Losses */}
                  <td className="px-3 py-3.5 text-center font-bold text-red-500">{row.losses}</td>

                  {/* Win Rate */}
                  <td className="px-3 py-3.5 text-center">
                    <span className={`
                      inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                      ${parseFloat(row.winRate) >= 50
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : parseFloat(row.winRate) > 0
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }
                    `}>
                      {row.winRate}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-x-6 gap-y-1">
        {[
          ['P', 'PLAYED'],
          ['W', 'WON'],
          ['L', 'LOST'],
          ['W/L %', 'WIN RATE'],
        ].map(([abbr, full]) => (
          <span key={abbr} className="text-[11px] font-semibold text-slate-400 tracking-wide">
            <span className="text-slate-500">{abbr}</span> = {full}
          </span>
        ))}
      </div>
    </div>
  );
};

export default GroupStandingsTable;
