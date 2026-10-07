import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'Rooms', path: '/rooms' },
  { name: 'Room Types', path: '/room-types' },
  { name: 'Amenities', path: '/amenities' },
  { name: 'Availability Grid', path: '/availability' },
];

const RoomsNavigation = () => {
  const location = useLocation();

  return (
    <div className="border-b border-zinc-200 mb-6">
      <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${isActive
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'}
              `}
            >
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default RoomsNavigation;
