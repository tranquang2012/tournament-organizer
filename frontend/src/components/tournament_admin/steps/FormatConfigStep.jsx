import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrophy,
  faRepeat,
  faArrowsSpin,
  faChartColumn,
} from '@fortawesome/free-solid-svg-icons';
import InputField from '../../common/InputField';

const FORMAT_OPTIONS = [
  {
    key: 'single_elimination',
    label: 'Single Elimination',
    icon: faTrophy,
    description: 'Lose once, you\'re out. Fast and decisive.',
    color: '#f59e0b',
  },
  {
    key: 'double_elimination',
    label: 'Double Elimination',
    icon: faRepeat,
    description: 'Two losses to be eliminated. More forgiving.',
    color: '#3b82f6',
  },
  {
    key: 'round_robin',
    label: 'Round Robin',
    icon: faArrowsSpin,
    description: 'Everyone plays everyone. Most fair.',
    color: '#22c55e',
  },
  {
    key: 'round_scoring',
    label: 'Round Scoring',
    icon: faChartColumn,
    description: 'Points-based rounds. Great for leagues.',
    color: '#8b5cf6',
  },
];

/**
 * Step 3 
 */
const FormatConfigStep = ({ data, onChange, currentSportConfig }) => {
  const [activeTab, setActiveTab] = useState(data.format === 'hybrid' ? 'multi' : 'single');

  const update = (field) => (e) => {
    onChange({ ...data, [field]: e?.target ? e.target.value : e });
  };

  const checkSupported = (supportedList, val) => {
    const FORMAT_CATEGORIES = {
      'single_elimination': 'versus',
      'double_elimination': 'versus',
      'round_robin': 'versus',
      'round_scoring': 'scoring',
    };
    const category = FORMAT_CATEGORIES[val];
    if (!supportedList || !category) return true;
    if (Array.isArray(supportedList)) return supportedList.some(s => s.toLowerCase() === category.toLowerCase());
    if (typeof supportedList === 'string') return supportedList.toLowerCase().includes(category.toLowerCase());
    return true;
  };

  const isScoringSport = currentSportConfig
    ? checkSupported(currentSportConfig.format, 'round_scoring') && !checkSupported(currentSportConfig.format, 'round_robin')
    : false;
  const showGamesPerMatch =
    data.format === 'round_scoring' ||
    (data.format === 'hybrid' && (data.hybridSecondRound === 'round_scoring' || isScoringSport));

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 m-0">Format Configuration</h2>
        <p className="text-sm text-slate-400 mt-1 m-0">
          Choose a tournament format and configure match settings
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 self-start">
          <button
            type="button"
            onClick={() => {
              setActiveTab('single');
              if (data.format === 'hybrid') {
                onChange({ ...data, format: '' });
              }
            }}
            className={`
              flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold
              border-none transition-all duration-200
              ${activeTab === 'single'
                ? 'bg-[#123836] text-white shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-700 cursor-pointer'
              }
            `}
          >
            Single Round
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('multi');
              onChange({ ...data, format: 'hybrid' });
            }}
            className={`
              flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold
              border-none transition-all duration-200
              ${activeTab === 'multi'
                ? 'bg-[#123836] text-white shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-700 cursor-pointer'
              }
            `}
          >
            Multi Round
          </button>
        </div>
      </div>

      {activeTab === 'single' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 animate-[fadeIn_0.3s_ease-out]">
          {FORMAT_OPTIONS.map((fmt) => {
            const isSelected = data.format === fmt.key;
            const isSupported = currentSportConfig ? checkSupported(currentSportConfig.format, fmt.key) : true;

            return (
              <button
                key={fmt.key}
                type="button"
                disabled={!isSupported}
                onClick={() => isSupported && onChange({ ...data, format: fmt.key })}
                className={`
                  flex items-start gap-4 p-5 rounded-2xl border-2
                  bg-white transition-all duration-200 text-left group
                  ${isSelected && isSupported
                    ? 'border-[#123836] shadow-[0_0_0_3px_rgba(18,56,54,0.08)] cursor-pointer'
                    : isSupported
                      ? 'border-slate-100 hover:border-slate-200 hover:shadow-sm cursor-pointer'
                      : 'border-slate-100 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                  style={{ background: `${fmt.color}18` }}
                >
                  <FontAwesomeIcon icon={fmt.icon} className="text-lg" style={{ color: fmt.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold m-0 leading-tight ${isSelected ? 'text-[#123836]' : 'text-slate-800'}`}>
                    {fmt.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 m-0 leading-relaxed">
                    {fmt.description}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${isSelected ? 'border-[#123836]' : 'border-slate-200 group-hover:border-slate-300'}`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#123836]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'multi' && (
        <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
          {/* First Round Section */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 m-0 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#123836] text-white text-xs">1</span>
              First Round: Group Stage (Round Robin)
            </h3>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Number of Groups"
                  type="number"
                  placeholder="e.g. 4"
                  value={data.hybridGroups || ''}
                  onChange={update('hybridGroups')}
                  min="1"
                />
                <InputField
                  label="Advance per Group"
                  type="number"
                  placeholder="e.g. 2"
                  value={data.hybridAdvancing || ''}
                  onChange={update('hybridAdvancing')}
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Second Round Section */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 m-0 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#123836] text-white text-xs">2</span>
              Second Round: Final Stage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FORMAT_OPTIONS.filter(f => f.key !== 'round_robin').map((fmt) => {
                const isSelected = data.hybridSecondRound === fmt.key;
                const isSupported = currentSportConfig ? checkSupported(currentSportConfig.format, fmt.key) : true;

                return (
                  <button
                    key={fmt.key}
                    type="button"
                    disabled={!isSupported}
                    onClick={() => isSupported && onChange({ ...data, hybridSecondRound: fmt.key })}
                    className={`
                      flex items-start gap-4 p-5 rounded-2xl border-2
                      bg-white transition-all duration-200 text-left group
                      ${isSelected && isSupported
                        ? 'border-[#123836] shadow-[0_0_0_3px_rgba(18,56,54,0.08)] cursor-pointer'
                        : isSupported
                          ? 'border-slate-100 hover:border-slate-200 hover:shadow-sm cursor-pointer'
                          : 'border-slate-100 opacity-50 cursor-not-allowed'
                      }
                    `}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                      style={{ background: `${fmt.color}18` }}
                    >
                      <FontAwesomeIcon icon={fmt.icon} className="text-lg" style={{ color: fmt.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold m-0 leading-tight ${isSelected ? 'text-[#123836]' : 'text-slate-800'}`}>
                        {fmt.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 m-0 leading-relaxed">
                        {fmt.description}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${isSelected ? 'border-[#123836]' : 'border-slate-200 group-hover:border-slate-300'}`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#123836]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showGamesPerMatch && (
        <div className="mt-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="max-w-sm">
            <InputField
              label="Games per match"
              type="number"
              placeholder="e.g. 3"
              value={data.setsPerMatch ?? '1'}
              onChange={update('setsPerMatch')}
              min="1"
              max="20"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 m-0">
            How many games are played in one scoring session. Rankings use the sum of all games.
          </p>
        </div>
      )}
    </div>
  );
};

export default FormatConfigStep;

