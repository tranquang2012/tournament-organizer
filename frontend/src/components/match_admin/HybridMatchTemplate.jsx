import React, { useState } from 'react';
import RoundRobinMatchTemplate from './RoundRobinMatchTemplate';
import EliminationMatchTemplate from './EliminationMatchTemplate';
import RoundScoringMatchTemplate from './RoundScoringMatchTemplate';

const HybridMatchTemplate = ({ tournament }) => {
  const [activeStage, setActiveStage] = useState('stage1');

  const firstStageFormat = tournament?.first_stage_format || 'round_robin';
  const secondStageFormat = tournament?.second_stage_format || tournament?.hybridSecondRound || 'single_elimination';

  const renderStage = (stageKey, format) => {
    if (format === 'round_scoring') {
      return <RoundScoringMatchTemplate tournament={tournament} stage={stageKey} />;
    }
    if (format === 'round_robin') {
      return <RoundRobinMatchTemplate tournament={tournament} stage={stageKey} />;
    }
    return <EliminationMatchTemplate tournament={tournament} stage={stageKey} />;
  };

  const stageOneLabel = firstStageFormat === 'round_scoring' ? 'Scoring Stage' : 'Group Stage';
  const stageTwoLabel = secondStageFormat === 'round_scoring' ? 'Scoring Stage' : 'Final Stage';

  return (
    <div className="flex flex-col w-full font-['Inter',_'Segoe_UI',_system-ui,_sans-serif]">
      <div className="flex items-center gap-1 mb-6 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200 shadow-sm w-fit mx-auto relative z-10">
        <button
          onClick={() => setActiveStage('stage1')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
            activeStage === 'stage1'
              ? 'bg-white text-[#123836] shadow-sm border border-slate-200/60'
              : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'
          }`}
        >
          Stage 1: {stageOneLabel}
        </button>
        <button
          onClick={() => setActiveStage('stage2')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
            activeStage === 'stage2'
              ? 'bg-white text-[#123836] shadow-sm border border-slate-200/60'
              : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'
          }`}
        >
          Stage 2: {stageTwoLabel}
        </button>
      </div>

      <div className="animate-[fadeIn_0.3s_ease-out]">
        {activeStage === 'stage1'
          ? renderStage('stage_1', firstStageFormat)
          : renderStage('stage_2', secondStageFormat)}
      </div>
    </div>
  );
};

export default HybridMatchTemplate;
