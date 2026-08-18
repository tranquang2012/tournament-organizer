import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartColumn, faTableCells } from '@fortawesome/free-solid-svg-icons';
import GlobalLeaderboard from './GlobalLeaderboard';
import RoundEntryTable from './RoundEntryTable';
import { mockScoringParticipants, mockScoringRounds } from './mockMatchData';

const TABS = [
  { id: 'dashboard', label: 'Match Dashboard', icon: faChartColumn },
  { id: 'roundEntry', label: 'Round Entry', icon: faTableCells },
];

const RoundScoringMatchTemplate = ({ tournament }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const participants = mockScoringParticipants;
  const rounds = mockScoringRounds;

  return (
    <div className="flex flex-col font-['Inter',_'Segoe_UI',_system-ui,_sans-serif] w-full">

      {/* Tab Bar */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 self-start w-fit shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
              border-none cursor-pointer transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-[#123836] text-white shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }
            `}
          >
            <FontAwesomeIcon icon={tab.icon} className="text-xs" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="animate-[fadeIn_0.2s_ease-out]">
          <GlobalLeaderboard participants={participants} rounds={rounds} />
        </div>
      )}

      {activeTab === 'roundEntry' && (
        <div className="animate-[fadeIn_0.2s_ease-out]">
          <RoundEntryTable participants={participants} rounds={rounds} />
        </div>
      )}

    </div>
  );
};

export default RoundScoringMatchTemplate;
