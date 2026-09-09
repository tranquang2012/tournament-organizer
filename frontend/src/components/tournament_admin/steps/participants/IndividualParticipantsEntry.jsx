import { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowUp, faTrash } from '@fortawesome/free-solid-svg-icons';
import InputField from '../../../common/InputField';
import SelectField from '../../../common/SelectField';
import Button from '../../../common/Button';
import {
  EXPERIENCE_OPTIONS,
  expStyle,
} from '../../../../constants/participantConstants';

const ENTRY_LABELS = {
  participant: {
    nameLabel: 'Participant Name',
    namePlaceholder: 'e.g. Nguyen Van A or Team A',
    emptyMessage: 'No participants added yet',
    addButtonText: 'Add Participant',
  },
  player: {
    nameLabel: 'Player Name',
    namePlaceholder: 'e.g. Nguyen Van A',
    emptyMessage: 'No players added yet',
    addButtonText: 'Add Player',
  },
};

const IndividualParticipantsEntry = ({
  participants = [],
  onAddParticipant,
  onRemoveParticipant,
  onCSVUpload,
  entryType = 'participant',
}) => {
  const { nameLabel, namePlaceholder, emptyMessage, addButtonText } =
    ENTRY_LABELS[entryType] || ENTRY_LABELS.participant;

  const csvInputRef = useRef(null);
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('Beginner');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddParticipant({ name: name.trim(), experience });
    setName('');
    setExperience('Beginner');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT — CSV + Manual Entry */}
      <div className="flex flex-col gap-5">
        {/* CSV Upload */}
        <div
          onClick={() => csvInputRef.current?.click()}
          className="
            flex flex-col items-center justify-center gap-2 px-6 py-8
            rounded-xl border-2 border-dashed border-slate-200
            cursor-pointer transition-all duration-200
            hover:border-slate-300 bg-slate-50/50
          "
        >
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <FontAwesomeIcon icon={faFileArrowUp} className="text-slate-400 text-xl" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Upload CSV</span>
          <span className="text-xs text-slate-400">Browse or drag file here</span>
          <Button
            variant="secondary"
            size="sm"
            className="mt-1 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              csvInputRef.current?.click();
            }}
          >
            Browse File
          </Button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            onChange={onCSVUpload}
            className="hidden"
          />
        </div>

        {/* Manual Entry */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-5">
          <h4 className="text-sm font-bold text-slate-800 m-0 mb-4">Manual Entry</h4>
          <div className="flex flex-col gap-3">
            <InputField
              label={nameLabel}
              placeholder={namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <SelectField
              label="Experience"
              options={EXPERIENCE_OPTIONS}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
            <Button onClick={handleAdd} disabled={!name.trim()} fullWidth>
              {addButtonText}
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT — Participant Table */}
      <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[400px]">
          <thead>
            <tr className="border-b border-slate-200/60">
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 w-10">
                #
              </th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">
                Name
              </th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 text-center">
                Experience
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-300">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              participants.map((p, idx) => {
                const exp = expStyle(p.experience || p.mem_expe);
                return (
                  <tr
                    key={p.id || idx}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-white/60 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm text-slate-400">{idx + 1}</td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-700">
                      {p.name || p.mem_name}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ color: exp.text, background: exp.bg }}
                      >
                        {p.experience || p.mem_expe || 'Beginner'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveParticipant(idx)}
                        className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer p-1"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IndividualParticipantsEntry;
