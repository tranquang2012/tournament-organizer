import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
export function SelectField({
  label,
  options = [],
  value = '',
  onChange,
  required = false,
  error = '',
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  id,
  ...props
}) {
  const fieldId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className="text-sm font-semibold text-slate-700"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={fieldId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full appearance-none px-4 pr-10 py-2.5 rounded-xl border text-sm
            cursor-pointer outline-none transition-all duration-200
            ${!value ? 'text-slate-400' : 'text-slate-700'}
            ${error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-slate-200 focus:border-[#123836] focus:ring-2 focus:ring-[rgba(18,56,54,0.12)]'
            }
            ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white'}
          `}
          {...props}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <FontAwesomeIcon
          icon={faChevronDown}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"
        />
      </div>
      {error && (
        <span className="text-xs text-red-500 mt-0.5">{error}</span>
      )}
    </div>
  );
}

export default SelectField;
