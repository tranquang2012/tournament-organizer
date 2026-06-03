export function InputField({
  label,
  placeholder = '',
  value = '',
  onChange,
  required = false,
  error = '',
  type = 'text',
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
      <input
        id={fieldId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 rounded-xl border text-sm text-slate-700 outline-none
          transition-all duration-200 placeholder:text-slate-400
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-slate-200 focus:border-[#123836] focus:ring-2 focus:ring-[rgba(18,56,54,0.12)]'
          }
          ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white'}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 mt-0.5">{error}</span>
      )}
    </div>
  );
}

export default InputField;
