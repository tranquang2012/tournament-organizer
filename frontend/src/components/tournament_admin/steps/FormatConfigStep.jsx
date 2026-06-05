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
const FormatConfigStep = ({ data, onChange }) => {
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

          return (
            <button
              key={fmt.key}
              type="button"
              onClick={() => onChange({ ...data, format: fmt.key })}
              className={`
                flex items-start gap-4 p-5 rounded-2xl border-2
                bg-white cursor-pointer transition-all duration-200 text-left group
                ${isSelected
                  ? 'border-[#123836] shadow-[0_0_0_3px_rgba(18,56,54,0.08)]'
                  : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
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


    </div>
  );
};

export default FormatConfigStep;
