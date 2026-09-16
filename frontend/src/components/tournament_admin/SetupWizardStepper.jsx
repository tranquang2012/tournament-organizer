import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

const SetupWizardStepper = ({ steps = [], currentStep = 0, onStepClick, isStepCompleted }) => {
  return (
    <div className="flex items-center justify-center w-full max-w-[700px] mx-auto select-none">
      {steps.map((step, idx) => {
        const isCompleted = isStepCompleted ? isStepCompleted(idx) : idx < currentStep;
        const isActive = idx === currentStep;
        const isUpcoming = idx > currentStep;

        return (
          <div key={idx} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <button
              type="button"
              onClick={() => onStepClick?.(idx)}
              className={`
                flex flex-col items-center gap-2 bg-transparent border-none
                cursor-pointer transition-all duration-300 group relative
                outline-none focus-visible:outline-none
              `}
              aria-label={`Step ${idx + 1}: ${step.label}`}
            >
              {/* Circle */}
              <div
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                  text-xs sm:text-sm font-bold transition-all duration-300 shrink-0
                  ${isCompleted
                    ? 'bg-[#123836] text-white shadow-[0_0_0_3px_rgba(18,56,54,0.15)]'
                    : isActive
                      ? 'bg-white text-[#123836] border-[2.5px] border-[#123836] shadow-[0_0_0_4px_rgba(18,56,54,0.10)]'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-200 group-hover:border-slate-300 group-hover:text-slate-500'
                  }
                `}
              >
                {isCompleted ? (
                  <FontAwesomeIcon icon={faCheck} className="text-sm" />
                ) : (
                  idx + 1
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  text-xs font-semibold whitespace-nowrap transition-colors duration-200 hidden sm:block
                  ${isCompleted
                    ? 'text-[#123836]'
                    : isActive
                      ? 'text-[#123836]'
                      : 'text-slate-400 group-hover:text-slate-500'
                  }
                `}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line (not after last step) */}
            {idx < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-1 sm:mx-2 mt-0 sm:mt-[-20px] relative">
                {/* Track */}
                <div className="absolute inset-0 bg-slate-200 rounded-full" />
                {/* Fill */}
                <div
                  className={`
                    absolute inset-y-0 left-0 bg-[#123836] rounded-full
                    transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                  `}
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SetupWizardStepper;
