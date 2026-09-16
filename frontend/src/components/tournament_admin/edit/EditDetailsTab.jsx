import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faImage,
  faCloudArrowUp,
  faCheck,
  faFlask,
  faTableColumns,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import InputField from '../../common/InputField';
import TextAreaField from '../../common/TextAreaField';
import UploadField from '../../common/UploadField';
import Button from '../../common/Button';
import { updateTournamentDetails } from '../../../services/TournamentService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const DEFAULT_BANNERS = [
  { id: 'banner1', src: `${supabaseUrl}/storage/v1/object/public/tournament-banners/default/banner1.jpg`, label: 'Banner 1' },
  { id: 'banner2', src: `${supabaseUrl}/storage/v1/object/public/tournament-banners/default/banner2.jpg`, label: 'Banner 2' },
  { id: 'banner3', src: `${supabaseUrl}/storage/v1/object/public/tournament-banners/default/banner3.jpg`, label: 'Banner 3' },
  { id: 'banner4', src: `${supabaseUrl}/storage/v1/object/public/tournament-banners/default/banner4.jpg`, label: 'Banner 4' },
];

const FORMAT_LABELS = {
  single_elimination: 'Single Elimination',
  double_elimination: 'Double Elimination',
  round_robin: 'Round Robin',
  hybrid: 'Hybrid',
};

/**
 * Tab 1 of TournamentEditPage.
 */
const EditDetailsTab = ({ tournamentId, initialData }) => {
  const toDateInput = (dateStr) => {
    if (!dateStr) return '';
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [form, setForm] = useState({
    name: initialData?.tour_name || '',
    description: initialData?.tour_descrip || '',
    location: initialData?.tour_locat || '',
    startDate: toDateInput(initialData?.tour_startdate),
    endDate: toDateInput(initialData?.tour_enddate),
    banner: null,           
    defaultBanner: DEFAULT_BANNERS.find(b => b.src === initialData?.tour_banner)?.id || null,    
    defaultBannerSrc: initialData?.tour_banner || null, 
  });

  const [bannerMode, setBannerMode] = useState('default');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e?.target ? e.target.value : e }));
    setSaved(false);
  };

  const selectDefaultBanner = (banner) => {
    setBannerMode('default');
    setForm((prev) => ({
      ...prev,
      defaultBanner: banner.id,
      defaultBannerSrc: banner.src,
      banner: null,
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateTournamentDetails(tournamentId, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const sportName = initialData?.sport_name || '—';
  const formatLabel = FORMAT_LABELS[initialData?.tour_format] || initialData?.tour_format || '—';

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      {/* Read-only info row */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200">
          <FontAwesomeIcon icon={faFlask} className="text-slate-400 text-xs" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sport</span>
          <span className="text-sm font-bold text-slate-700">{sportName}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200">
          <FontAwesomeIcon icon={faTableColumns} className="text-slate-400 text-xs" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Format</span>
          <span className="text-sm font-bold text-slate-700">{formatLabel}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
          <span className="text-[11px] font-semibold text-amber-700">
            ⚠ Sport and format cannot be changed after creation
          </span>
        </div>
      </div>

      {/* Editable form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputField
          label="Tournament Name"
          placeholder="e.g. Summer Championship 2026"
          value={form.name}
          onChange={update('name')}
          required
          className="md:col-span-2"
        />

        <TextAreaField
          label="Description"
          placeholder="Describe the tournament rules, prizes, and other details…"
          value={form.description}
          onChange={update('description')}
          rows={4}
          className="md:col-span-2"
        />

        <InputField
          label="Location"
          placeholder="e.g. Ho Chi Minh City, Vietnam"
          value={form.location}
          onChange={update('location')}
        />

        {/* Spacer */}
        <div className="hidden md:block" />

        <InputField
          label="Start Date"
          type="date"
          value={form.startDate}
          onChange={update('startDate')}
          required
        />

        <InputField
          label="End Date"
          type="date"
          value={form.endDate}
          onChange={update('endDate')}
          required
        />

        {/* Banner */}
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Banner Image</label>

          {/* Mode toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 self-start mb-3">
            <button
              type="button"
              onClick={() => setBannerMode('default')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all duration-200 ${
                bannerMode === 'default'
                  ? 'bg-[#123836] text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FontAwesomeIcon icon={faImage} className="text-xs" />
              Use Default
            </button>
            <button
              type="button"
              onClick={() => setBannerMode('custom')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all duration-200 ${
                bannerMode === 'custom'
                  ? 'bg-[#123836] text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FontAwesomeIcon icon={faCloudArrowUp} className="text-xs" />
              Upload Custom
            </button>
          </div>

          {/* Current banner preview */}
          {bannerMode === 'default' && !form.defaultBanner && initialData?.tour_banner && (
            <div className="mb-3">
              <p className="text-xs text-slate-400 mb-2">Current banner</p>
              <img
                src={initialData.tour_banner}
                alt="Current banner"
                className="w-full max-w-sm h-24 object-cover rounded-xl border border-slate-200"
              />
            </div>
          )}

          {/* Default banner grid */}
          {bannerMode === 'default' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DEFAULT_BANNERS.map((banner) => {
                const isSelected = form.defaultBanner === banner.id;
                return (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => selectDefaultBanner(banner)}
                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 p-0 bg-transparent aspect-[16/9] ${
                      isSelected
                        ? 'border-[#123836] shadow-[0_0_0_3px_rgba(18,56,54,0.12)]'
                        : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    <img src={banner.src} alt={banner.label} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[rgba(18,56,54,0.35)] flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                          <FontAwesomeIcon icon={faCheck} className="text-[#123836] text-sm" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom upload */}
          {bannerMode === 'custom' && (
            <UploadField
              accept="image/*"
              maxSizeMB={2}
              value={form.banner}
              onChange={(file) =>
                setForm((prev) => ({
                  ...prev,
                  banner: file,
                  defaultBanner: null,
                  defaultBannerSrc: null,
                }))
              }
              helperText="PNG, JPG or WebP — max 2 MB"
            />
          )}
        </div>

      </div>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3 pt-8 mt-8 border-t border-slate-100">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 animate-[fadeIn_0.3s_ease-out]">
            <FontAwesomeIcon icon={faCircleCheck} />
            Changes saved
          </span>
        )}
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={!form.name.trim()}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default EditDetailsTab;
