import React from 'react';

const Input = React.forwardRef(({ 
  label, 
  error, 
  type = 'text', 
  className = '', 
  id,
  ...props 
}, ref) => {
  const inputId = id || Math.random().toString(36).substr(2, 9);
  
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        type={type}
        className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-500' : 'border-zinc-200'}
          ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
