import React from 'react';

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

const GlobalLeaderboard = ({ participants, rounds, setsPerMatch = 1 }) => {
  const completedRounds = rounds.filter(r => r.status === 'Completed').length;
  const totalRounds = rounds.length;
  const activeCount = participants.filter(p => p.status === 'Active').length;
  const eliminatedCount = participants.filter(p => p.status === 'Eliminated').length;
  const gameCount = Math.max(1, Number(setsPerMatch) || 1);
  const showGameColumns = gameCount > 1 && rounds.length === 1;
  const singleRoundId = rounds[0]?.id;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex justify-between items-start">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Global Leaderboard</h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            {completedRounds}/{totalRounds} rounds completed - {showGameColumns ? `Sum of ${gameCount} games` : 'Score (Points)'}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {activeCount} active
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            {eliminatedCount} eliminated
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="pl-5 pr-2 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-10">#</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Participant</th>
              <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Status</th>
              {showGameColumns ? (
                <>
                  {Array.from({ length: gameCount }, (_, index) => (
                    <th key={`game-${index}`} className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-20">
                      Game {index + 1}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-16">Total</th>
                </>
              ) : (
                <>
                  {rounds.map(round => (
                    <th key={round.id} className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-20">
                      {round.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-16">Best</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-16">Total</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {participants.map((p, idx) => {
              const isTopThree = idx < 3;
              const isEliminated = p.status === 'Eliminated';

              return (
                <tr
                  key={p.id || p.rank}
                  className={`
                    border-b border-slate-50 transition-colors duration-150
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
                    hover:bg-[#123836]/[0.03]
                    ${isEliminated ? 'opacity-60' : ''}
                  `}
                >
                  {/* Rank */}
                  <td className="pl-5 pr-2 py-3.5">
                    {isTopThree ? (
                      <span className="text-base">{MEDAL_ICONS[idx]}</span>
                    ) : (
                      <span className="text-sm font-bold text-slate-400">{p.rank}</span>
                    )}
                  </td>

                  {/* Participant Name */}
                  <td className="px-3 py-3.5">
                    <span className={`font-semibold ${isTopThree && !isEliminated ? 'text-slate-800' : 'text-slate-600'}`}>
                      {p.name}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3.5 text-center">
                    <span className={`
                      inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold
                      ${p.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-red-50 text-red-600 border border-red-100'
                      }
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Active' ? 'bg-emerald-500' : 'bg-red-400'}`}></span>
                      {p.status}
                    </span>
                  </td>

                  {/* Round scores */}
                  {showGameColumns ? (
                    <>
                      {Array.from({ length: gameCount }, (_, index) => {
                        const score = p.sets?.[singleRoundId]?.[index];
                        return (
                          <td key={`${p.id}-game-${index}`} className="px-3 py-3.5 text-center font-semibold text-slate-600">
                            {score != null ? score : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3.5 text-center font-bold text-slate-800">{p.total}</td>
                    </>
                  ) : (
                    <>
                      {rounds.map(round => {
                        const score = p.rounds[round.id];
                        return (
                          <td key={round.id} className="px-3 py-3.5 text-center font-semibold text-slate-600">
                            {score != null ? score : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3.5 text-center font-bold text-slate-700">{p.best}</td>
                      <td className="px-3 py-3.5 text-center font-bold text-slate-800">{p.total}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GlobalLeaderboard;
