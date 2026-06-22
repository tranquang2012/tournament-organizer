import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrophy,
  faRepeat,
  faArrowsSpin,
  faChartColumn,
  faSitemap,
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
  {
    key: 'hybrid',
    label: 'Hybrid (Groups + Knockout)',
    icon: faSitemap,
    description: 'Round robin group stage into an elimination bracket.',
    color: '#ef4444',
  },
];

/**
 * Step 3 
 */
const FormatConfigStep = ({ data, onChange, currentSportConfig }) => {
  const update = (field) => (e) => {
    onChange({ ...data, [field]: e?.target ? e.target.value : e });
  };

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 m-0">Format Configuration</h2>
        <p className="text-sm text-slate-400 mt-1 m-0">
          Choose a tournament format and configure match settings
        </p>
      </div>

      {/* Format cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {FORMAT_OPTIONS.map((fmt) => {
          const isSelected = data.format === fmt.key;
          const FORMAT_CATEGORIES = {
            'single_elimination': 'versus',
            'double_elimination': 'versus',
            'round_robin': 'versus',
            'round_scoring': 'scoring',
            'hybrid': 'versus',
          };
          const checkSupported = (supportedList, val) => {
            const category = FORMAT_CATEGORIES[val];
            if (!supportedList || !category) return true;
            if (Array.isArray(supportedList)) return supportedList.some(s => s.toLowerCase() === category.toLowerCase());
            if (typeof supportedList === 'string') return supportedList.toLowerCase().includes(category.toLowerCase());
            return true;
          };
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
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: `${fmt.color}18`,
                }}
              >
                <FontAwesomeIcon
                  icon={fmt.icon}
                  className="text-lg"
                  style={{ color: fmt.color }}
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold m-0 leading-tight ${
                    isSelected ? 'text-[#123836]' : 'text-slate-800'
                  }`}
                >
                  {fmt.label}
                </p>
                <p className="text-xs text-slate-400 mt-1 m-0 leading-relaxed">
                  {fmt.description}
                </p>
              </div>

              {/* Radio indicator */}
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5
                  transition-all duration-200
                  ${isSelected
                    ? 'border-[#123836]'
                    : 'border-slate-200 group-hover:border-slate-300'
                  }
                `}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#123836]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hybrid Sub-configuration */}
      {data.format === 'hybrid' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-[fadeIn_0.3s_ease-out]">
          <h3 className="text-lg font-bold text-slate-800 m-0 mb-4">Hybrid Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Elimination Type</label>
              <select
                value={data.hybridEliminationType || 'single_elimination'}
                onChange={update('hybridEliminationType')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123836]/20 focus:border-[#123836] transition-all cursor-pointer"
              >
                <option value="single_elimination">Single Elimination</option>
                <option value="double_elimination">Double Elimination</option>
              </select>
            </div>
            <InputField
              label="Number of Stages (Groups)"
              type="number"
              placeholder="e.g. 2"
              value={data.hybridStages || ''}
              onChange={update('hybridStages')}
              min="1"
            />
            <InputField
              label="Matches per Stage"
              type="number"
              placeholder="e.g. 1"
              value={data.hybridMatchesPerStage || ''}
              onChange={update('hybridMatchesPerStage')}
              min="1"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default FormatConfigStep;
