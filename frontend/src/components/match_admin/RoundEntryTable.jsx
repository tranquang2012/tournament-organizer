import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faClock, faScissors } from '@fortawesome/free-solid-svg-icons';

const RoundEntryTable = ({ participants, rounds }) => {
  // Default to the first non-completed round, or the last round
  const defaultRound = rounds.find(r => r.status !== 'Completed') || rounds[rounds.length - 1];
  const [selectedRoundId, setSelectedRoundId] = useState(defaultRound?.id || rounds[0]?.id);

  const selectedRound = rounds.find(r => r.id === selectedRoundId);

  // Filter to only active participants (eliminated ones don't score)
  const activeParticipants = useMemo(() => {
    return participants.filter(p => p.status === 'Active');
  }, [participants]);

  // Determine status badge style
  let statusBadgeColor = 'bg-slate-100 text-slate-600';
  let statusDotColor = 'bg-slate-400';
  let statusLabel = selectedRound?.status || 'Unknown';

  if (selectedRound?.status === 'In Progress') {
    statusBadgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    statusDotColor = 'bg-emerald-500';
  } else if (selectedRound?.status === 'Completed') {
    statusBadgeColor = 'bg-blue-50 text-blue-700 border border-blue-100';
    statusDotColor = 'bg-blue-500';
  } else {
    statusBadgeColor = 'bg-slate-50 text-slate-500 border border-slate-200';
    statusDotColor = 'bg-slate-400';
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Round Entry</h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Enter Score for each participant
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg focus:ring-[#123836] focus:border-[#123836] px-3 py-2 cursor-pointer outline-none hover:bg-slate-100 transition-colors"
          >
            {rounds.map(round => (
              <option key={round.id} value={round.id}>{round.label}</option>
            ))}
          </select>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusBadgeColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`}></span>
            {statusLabel}
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
              <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Score</th>
              <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-20">Status</th>
            </tr>
          </thead>
          <tbody>
            {activeParticipants.map((p, idx) => {
              const score = p.rounds[selectedRoundId];
              const hasScore = score != null;

              return (
                <tr
                  key={`${selectedRoundId}-${p.rank}`}
                  className={`
                    border-b border-slate-50 transition-colors duration-150
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
                    hover:bg-[#123836]/[0.03]
                  `}
                >
                  {/* Rank */}
                  <td className="pl-5 pr-2 py-3.5">
                    <span className="text-sm font-bold text-slate-400">{idx + 1}</span>
                  </td>

                  {/* Participant Name */}
                  <td className="px-3 py-3.5">
                    <span className="font-semibold text-slate-700">{p.name}</span>
                  </td>

                  {/* Score Input */}
                  <td className="px-3 py-3.5 text-center">
                    <input
                      type="number"
                      defaultValue={hasScore ? score : 0}
                      placeholder="0"
                      disabled={selectedRound?.status === 'Completed'}
                      className={`
                        w-24 h-9 text-center outline-none rounded-lg border text-sm font-semibold
                        transition-all
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                        ${selectedRound?.status === 'Completed'
                          ? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                          : hasScore
                            ? 'border-slate-300 bg-white text-slate-800 focus:border-[#123836] focus:ring-2 focus:ring-[#123836]/10'
                            : 'border-slate-200 bg-white text-slate-400 focus:border-[#123836] focus:ring-2 focus:ring-[#123836]/10'
                        }
                      `}
                    />
                  </td>

                  {/* Status Icon */}
                  <td className="px-3 py-3.5 text-center">
                    {hasScore ? (
                      <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500 text-lg" />
                    ) : (
                      <FontAwesomeIcon icon={faClock} className="text-slate-300 text-lg" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Advance/Cut off */}
      <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm cursor-pointer border-none"
        >
          <FontAwesomeIcon icon={faScissors} className="text-xs" />
          Apply Cut-off
        </button>
      </div>
    </div>
  );
};

export default RoundEntryTable;
