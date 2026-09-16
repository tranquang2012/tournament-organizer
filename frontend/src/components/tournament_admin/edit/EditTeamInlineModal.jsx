import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPenToSquare, faUpload, faImage } from '@fortawesome/free-solid-svg-icons';
import Button from '../../common/Button';
import { supabase } from '../../../config/supabaseClient';

/**
 * Small modal to rename and upload logo of a team / competitor.
 */
const EditTeamInlineModal = ({ open, team, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && team) {
      setName(team.name || '');
      setLogoUrl(team.logo || '');
      setPreviewUrl(team.logo || '');
      setLogoFile(null);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, team]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, saving]);

  if (!open || !team) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Team name is required.');
      return;
    }
    if (name.trim().length > 150) {
      setError('Team name must be 150 characters or fewer.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      let finalLogoUrl = logoUrl;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `logos/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('tournament-banners')
          .upload(fileName, logoFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('tournament-banners')
          .getPublicUrl(fileName);

        finalLogoUrl = publicUrl;
      }

      await onSave(team.id, name.trim(), finalLogoUrl || null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update team.');
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[calc(100vw-2rem)] sm:max-w-[380px] mx-4 pointer-events-auto animate-[fadeIn_0.2s_ease-out] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
                <FontAwesomeIcon icon={faPenToSquare} className="text-[#123836] text-sm" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 m-0">Edit Team</h3>
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
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Team Name
              </label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !saving && handleSave()}
                disabled={saving}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 outline-none placeholder:text-slate-300 focus:border-[#123836] focus:ring-2 focus:ring-[rgba(18,56,54,0.08)] transition-all"
                placeholder="Enter team name…"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Team Logo
              </label>
              
              <div className="flex items-center gap-4 mt-2">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Logo preview"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-300 shrink-0">
                    <FontAwesomeIcon icon={faImage} className="text-xl" />
                  </div>
                )}
                
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={saving}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={faUpload}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    Upload Image
                  </Button>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Supports PNG, JPG or GIF.
                  </p>
                </div>
              </div>
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

export default EditTeamInlineModal;
