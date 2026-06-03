import { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faXmark, faFile } from '@fortawesome/free-solid-svg-icons';

export function UploadField({
  label,
  accept = 'image/*',
  maxSizeMB = 2,
  value = null,
  onChange,
  helperText = '',
  required = false,
  error = '',
  className = '',
  id,
}) {
  const fieldId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (!file) return;

    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      return;
    }

    onChange?.(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleBrowse = () => inputRef.current?.click();

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
    e.target.value = '';
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange?.(null);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {!value ? (
        /* Drop zone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleBrowse}
          className={`
            flex flex-col items-center justify-center gap-2 px-6 py-8
            rounded-xl border-2 border-dashed cursor-pointer
            transition-all duration-200
            ${dragOver
              ? 'border-[#123836] bg-[rgba(18,56,54,0.04)]'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }
          `}
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <FontAwesomeIcon icon={faCloudArrowUp} className="text-slate-400 text-lg" />
          </div>
          <div className="text-center">
            <span className="text-sm text-slate-600">
              Drop file here or{' '}
              <span className="text-[#123836] font-semibold underline underline-offset-2">
                browse
              </span>
            </span>
          </div>
          {helperText && (
            <span className="text-xs text-slate-400">{helperText}</span>
          )}
        </div>
      ) : (
        /* File preview */
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white">
          <div className="w-9 h-9 rounded-lg bg-[rgba(18,56,54,0.08)] flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faFile} className="text-[#123836] text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate m-0">
              {value.name}
            </p>
            <p className="text-xs text-slate-400 m-0">
              {(value.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 border-none bg-transparent cursor-pointer transition-colors"
            aria-label="Remove file"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      {error && (
        <span className="text-xs text-red-500 mt-0.5">{error}</span>
      )}
    </div>
  );
}

export default UploadField;
