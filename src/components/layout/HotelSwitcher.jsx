import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Check, Plus, Search } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { useAuth } from '../../context/AuthContext';

const HotelSwitcher = () => {
  const { hotels, activeHotel, activeHotelId, changeHotel, isLoading } = useHotel();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (isLoading && (!hotels || hotels.length === 0)) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg animate-pulse">
        <div className="w-5 h-5 bg-zinc-200 rounded" />
        <div className="w-24 h-4 bg-zinc-200 rounded" />
      </div>
    );
  }

  if (!hotels || hotels.length === 0) {
    return null;
  }

  // If only 1 hotel, render a clean property pill without dropdown toggle
  if (hotels.length === 1) {
    const single = hotels[0];
    return (
      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg select-none">
        <div className="w-6 h-6 rounded-md bg-zinc-200/80 flex items-center justify-center shrink-0 overflow-hidden">
          {single.logo ? (
            <img src={single.logo} alt={single.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-zinc-600" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-900 truncate max-w-[140px] sm:max-w-[200px]">
            {single.name}
          </p>
          {(single.city || single.country) && (
            <p className="text-[10px] text-zinc-500 truncate leading-none">
              {[single.city, single.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  }

  const filteredHotels = hotels.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    (h.city && h.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none
          ${isOpen 
            ? 'bg-zinc-100 border-zinc-300 ring-2 ring-zinc-900/10' 
            : 'bg-zinc-50 hover:bg-zinc-100/80 border-zinc-200 hover:border-zinc-300'}
        `}
      >
        <div className="w-6 h-6 rounded-md bg-zinc-200/80 flex items-center justify-center shrink-0 overflow-hidden">
          {activeHotel?.logo ? (
            <img src={activeHotel.logo} alt={activeHotel.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-zinc-600" />
          )}
        </div>

        <div className="text-left min-w-0">
          <p className="text-xs font-semibold text-zinc-900 truncate max-w-[120px] sm:max-w-[180px] leading-tight">
            {activeHotel?.name || 'Select Hotel'}
          </p>
          {(activeHotel?.city || activeHotel?.country) && (
            <p className="text-[10px] text-zinc-500 truncate leading-tight">
              {[activeHotel.city, activeHotel.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        <ChevronDown 
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-zinc-900' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
          {/* Header & Optional Search */}
          <div className="p-2 border-b border-zinc-100 bg-zinc-50/50">
            <div className="px-2 py-1 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Switch Property
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">
                {hotels.length} properties
              </span>
            </div>

            {hotels.length > 4 && (
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter properties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Properties List */}
          <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
            {filteredHotels.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400">
                No matching properties found.
              </div>
            ) : (
              filteredHotels.map((hotel) => {
                const isActive = hotel.id === activeHotelId;
                return (
                  <button
                    key={hotel.id}
                    type="button"
                    onClick={() => {
                      changeHotel(hotel.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`
                      w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer select-none
                      ${isActive 
                        ? 'bg-zinc-100 text-zinc-900' 
                        : 'hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900'}
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`
                        w-7 h-7 rounded-md flex items-center justify-center shrink-0 overflow-hidden border
                        ${isActive ? 'border-zinc-400 bg-white' : 'border-zinc-200 bg-zinc-100'}
                      `}>
                        {hotel.logo ? (
                          <img src={hotel.logo} alt={hotel.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium leading-tight truncate ${isActive ? 'font-semibold text-zinc-900' : 'text-zinc-800'}`}>
                          {hotel.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">
                          {[hotel.city, hotel.country].filter(Boolean).join(', ') || 'Active property'}
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <Check className="w-4 h-4 text-zinc-900 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Manage Hotels Shortcut Footer */}
          {hasPermission('view hotels') && (
            <div className="p-1.5 border-t border-zinc-100 bg-zinc-50/50">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/hotels');
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <span>Manage Properties</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HotelSwitcher;
