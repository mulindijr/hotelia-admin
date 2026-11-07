import React from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import { useAuth } from '../../context/AuthContext';
import { useHotel } from '../../context/HotelContext';
import ProfileSettingsModal from '../users/ProfileSettingsModal';

const Header = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { hotels, activeHotelId, changeHotel } = useHotel();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);

  return (
    <>
      <header className="bg-white border-b border-zinc-200 h-16 flex items-center justify-between px-4 sm:px-6 z-10 w-full">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="text-zinc-500 hover:text-zinc-900 lg:hidden p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Hotel Selector */}
        {hotels.length > 0 && (
          <div className="flex items-center ml-2 sm:ml-0">
            <select
              value={activeHotelId || ''}
              onChange={(e) => changeHotel(parseInt(e.target.value))}
              className="bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm rounded-lg focus:ring-zinc-900 focus:border-zinc-900 block p-2"
            >
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <NotificationsDropdown />

        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center">
              <User className="w-4 h-4 text-zinc-600" />
            </div>
            <span className="hidden sm:block">{user?.first_name || 'Admin'}</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-zinc-100">
                <p className="text-sm font-medium text-zinc-900">{user?.full_name}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
              </div>
                            <button 
                onClick={() => { setProfileOpen(false); setIsProfileModalOpen(true); }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Account Settings
              </button>
<button 
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-zinc-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
      <ProfileSettingsModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </>
  );
};

export default Header;
