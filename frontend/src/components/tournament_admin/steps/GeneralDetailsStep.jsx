import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faCloudArrowUp, faCheck } from '@fortawesome/free-solid-svg-icons';
import InputField from '../../common/InputField';
import TextAreaField from '../../common/TextAreaField';
import UploadField from '../../common/UploadField';

import banner1 from '../../../assets/bannerImages/banner1.jpg';
import banner2 from '../../../assets/bannerImages/banner2.jpg';
import banner3 from '../../../assets/bannerImages/banner3.jpg';
import banner4 from '../../../assets/bannerImages/banner4.jpg';

const DEFAULT_BANNERS = [
  { id: 'banner1', src: banner1, label: 'Banner 1' },
  { id: 'banner2', src: banner2, label: 'Banner 2' },
  { id: 'banner3', src: banner3, label: 'Banner 3' },
  { id: 'banner4', src: banner4, label: 'Banner 4' },
];

/**
 * Step 1 
 *
 */
const GeneralDetailsStep = ({ data, onChange }) => {
  const [bannerMode, setBannerMode] = useState(
    data.banner ? 'custom' : data.defaultBanner ? 'default' : null,
  );

  const update = (field) => (e) => {
    onChange({ ...data, [field]: e?.target ? e.target.value : e });
  };

  const selectDefaultBanner = (banner) => {
    setBannerMode('default');
    onChange({ ...data, defaultBanner: banner.id, defaultBannerSrc: banner.src, banner: null });
  };

  const switchToCustom = () => {
    setBannerMode('custom');
    onChange({ ...data, defaultBanner: null, defaultBannerSrc: null });
  };

  const switchToDefault = () => {
    setBannerMode('default');
    onChange({ ...data, banner: null });
  };

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 m-0">General Details</h2>
        <p className="text-sm text-slate-400 mt-1 m-0">
          Set up the basic information for your tournament
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tournament Name*/}
        <InputField
          label="Tournament Name"
          placeholder="e.g. Summer Championship 2026"
          value={data.name}
          onChange={update('name')}
          required
          className="md:col-span-2"
        />

        {/* Description*/}
        <TextAreaField
          label="Description"
          placeholder="Describe the tournament rules, prizes, and other details..."
          value={data.description}
          onChange={update('description')}
          rows={4}
          className="md:col-span-2"
        />

        {/* Location */}
        <InputField
          label="Location"
          placeholder="e.g. Ho Chi Minh City, Vietnam"
          value={data.location}
          onChange={update('location')}
        />

        {/* Spacer on desktop */}
        <div className="hidden md:block" />

        {/* Start Date */}
        <InputField
          label="Start Date"
          type="date"
          value={data.startDate}
          onChange={update('startDate')}
          required
        />

        {/* End Date */}
        <InputField
          label="End Date"
          type="date"
          value={data.endDate}
          onChange={update('endDate')}
          required
        />

        {/* Banner Image */}
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Banner Image</label>

          {/* Mode toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 self-start mb-3">
            <button
              type="button"
              onClick={switchToDefault}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                border-none cursor-pointer transition-all duration-200
                ${bannerMode === 'default' || !bannerMode
                  ? 'bg-[#123836] text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
                }
              `}
            >
              <FontAwesomeIcon icon={faImage} className="text-xs" />
              Use Default
            </button>
            <button
              type="button"
              onClick={switchToCustom}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                border-none cursor-pointer transition-all duration-200
                ${bannerMode === 'custom'
                  ? 'bg-[#123836] text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
                }
              `}
            >
              <FontAwesomeIcon icon={faCloudArrowUp} className="text-xs" />
              Upload Custom
            </button>
          </div>

          {/* Default banner grid */}
          {(bannerMode === 'default' || !bannerMode) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DEFAULT_BANNERS.map((banner) => {
                const isSelected = data.defaultBanner === banner.id;
                return (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => selectDefaultBanner(banner)}
                    className={`
                      relative rounded-xl overflow-hidden border-2 cursor-pointer
                      transition-all duration-200 p-0 bg-transparent aspect-[16/9]
                      ${isSelected
                        ? 'border-[#123836] shadow-[0_0_0_3px_rgba(18,56,54,0.12)]'
                        : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
                      }
                    `}
                  >
                    <img
                      src={banner.src}
                      alt={banner.label}
                      className="w-full h-full object-cover"
                    />
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
              value={data.banner}
              onChange={(file) => onChange({ ...data, banner: file, defaultBanner: null, defaultBannerSrc: null })}
              helperText="PNG, JPG or WebP — max 2 MB"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralDetailsStep;
