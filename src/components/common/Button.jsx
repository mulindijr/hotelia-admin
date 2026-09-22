import React from 'react';

const Button = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  className = '', 
  disabled = false, 
  isLoading = false,
  ...props 
}, ref) => {
  
  const baseClasses = "inline-flex items-center justify-center text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white",
    secondary: "px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200",
    ghost: "px-4 py-2 bg-transparent hover:bg-zinc-100 text-zinc-700",
    destructive: "px-4 py-2 bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
