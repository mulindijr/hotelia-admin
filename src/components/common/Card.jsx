import React from 'react';

const Card = ({ children, title, subtitle, className = '', headerActions }) => {
  return (
    <div className={`bg-white border border-zinc-200 rounded-xl p-6 shadow-sm ${className}`}>
      {(title || headerActions) && (
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
          <div>
            {title && <h3 className="text-base font-semibold text-zinc-900">{title}</h3>}
            {subtitle && <span className="text-xs text-zinc-500">{subtitle}</span>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className="text-sm text-zinc-900">
        {children}
      </div>
    </div>
  );
};

export default Card;
