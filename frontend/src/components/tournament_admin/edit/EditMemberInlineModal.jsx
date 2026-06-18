import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import Button from '../../common/Button';
import SelectField from '../../common/SelectField';

const EXPERIENCE_LEVELS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Professional', label: 'Professional' },
];

/**
 * Small modal to rename a single participant / team member.
 */
const EditMemberInlineModal = ({ open, member, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('Beginner');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && member) {
      setName(member.name);
      // Fallback for missing or different capitalization
      const exp = member.experience === 'Pro' ? 'Professional' : member.experience;
      setExperience(exp || 'Beginner');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, member]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, saving]);

  if (!open || !member) return null;

  const handleSave = async () => {
    const defaultExp = member.experience === 'Pro' ? 'Professional' : (member.experience || 'Beginner');
    if (!name.trim() || (name.trim() === member.name && experience === defaultExp)) { onClose(); return; }
    setSaving(true);
    try {
      await onSave(member.id, name.trim(), experience);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-[2px] animate-[fadeIn_0.15s_ease-out]"
        onClick={() => !saving && onClose()}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[380px] pointer-events-auto animate-[fadeIn_0.2s_ease-out] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
                <FontAwesomeIcon icon={faPenToSquare} className="text-[#123836] text-sm" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 m-0">Edit Participant</h3>
            </div>
            <button
              onClick={() => !saving && onClose()}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer transition-colors"
              disabled={saving}
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faXmark} className="text-sm" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Name
              </label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !saving && handleSave()}
                disabled={saving}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 outline-none placeholder:text-slate-300 focus:border-[#123836] focus:ring-2 focus:ring-[rgba(18,56,54,0.08)] transition-all"
                placeholder="Enter name…"
              />
            </div>
            <div>
              <SelectField
                label="Experience Level"
                options={EXPERIENCE_LEVELS}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              loading={saving}
              disabled={!name.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditMemberInlineModal;
