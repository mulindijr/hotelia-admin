import React from 'react';

const Select = React.forwardRef(({ 
  label, 
  error, 
  options = [], 
  className = '', 
  id,
  placeholder = "Select an option",
  ...props 
}, ref) => {
  const selectId = id || Math.random().toString(36).substr(2, 9);
  
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-500' : 'border-zinc-200'}
          ${className}`}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
