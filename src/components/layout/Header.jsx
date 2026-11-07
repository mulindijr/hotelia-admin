import React, { useState } from 'react';
import { Menu, User, LogOut, Plus } from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import HotelSwitcher from './HotelSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useHotel } from '../../context/HotelContext';
import ProfileSettingsModal from '../users/ProfileSettingsModal';
import CreateBookingModal from '../bookings/CreateBookingModal';

const Header = ({ onMenuToggle }) => {
  const { user, logout, hasPermission } = useAuth();
  const { activeHotelId } = useHotel();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-zinc-200 h-16 flex items-center justify-between px-4 sm:px-6 z-10 w-full">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuToggle}
          className="text-zinc-500 hover:text-zinc-900 lg:hidden p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Modern Property Switcher */}
        <HotelSwitcher />
      </div>

      <div className="flex items-center gap-3">
        {/* Fast Action: New Booking */}
        {hasPermission('create bookings') && activeHotelId && (
          <>
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-colors cursor-pointer select-none"
            >
              <Plus className="w-4 h-4" />
              <span>New Booking</span>
            </button>
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="sm:hidden p-2 text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="New Booking"
            >
              <Plus className="w-4 h-4" />
            </button>
          </>
        )}

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
      {activeHotelId && (
        <CreateBookingModal 
          isOpen={isBookingModalOpen} 
          onClose={() => setIsBookingModalOpen(false)} 
        />
      )}
    </>
  );
};

export default Header;
