import { useState } from 'react';
import InputField from '../../common/InputField';
import Button from '../../common/Button';

const EditActionsTab = ({ tournamentId }) => {
  const [pauseMode, setPauseMode] = useState('days');
  const [pauseDays, setPauseDays] = useState('');
  const [pauseUntilDate, setPauseUntilDate] = useState('');

  const handlePause = () => {
    alert('Pause Tournament clicked');
  };

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="pt-2">
        <h3 className="text-base font-bold text-slate-800 mb-1">Pause Tournament</h3>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <p className="text-sm font-medium text-amber-800 m-0 leading-relaxed">
            <strong>Note:</strong> Pausing the tournament will automatically shift all scheduled matches to the next available day based on your selected duration.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          {/* Option Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 self-start">
            <button
              type="button"
              onClick={() => setPauseMode('days')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all duration-200 ${
                pauseMode === 'days'
                  ? 'bg-[#123836] text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Duration (Days)
            </button>
            <button
              type="button"
              onClick={() => setPauseMode('date')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all duration-200 ${
                pauseMode === 'date'
                  ? 'bg-[#123836] text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Specific Date
            </button>
          </div>

          {/* Input Fields */}
          <div className="max-w-sm flex flex-col items-start gap-4">
            {pauseMode === 'days' ? (
              <div className="w-full">
                <InputField
                  label="Pause Duration (Days)"
                  type="number"
                  placeholder="e.g. 7"
                  value={pauseDays}
                  onChange={(e) => setPauseDays(e.target.value)}
                  min="1"
                />
              </div>
            ) : (
              <div className="w-full">
                <InputField
                  label="Pause Until Date"
                  type="date"
                  value={pauseUntilDate}
                  onChange={(e) => setPauseUntilDate(e.target.value)}
                />
              </div>
            )}
            
            <Button
              type="button"
              onClick={handlePause}
              className="bg-amber-500 hover:bg-amber-600 text-white border-none px-6 shadow-sm"
            >
              Pause Tournament
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditActionsTab;
