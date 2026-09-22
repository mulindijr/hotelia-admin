import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Bed, 
  CalendarCheck, 
  Users, 
  CreditCard,
  Settings,
  ShieldCheck,
  Hotel
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, permission: 'view reports' },
  { name: 'Bookings', path: '/bookings', icon: CalendarCheck, permission: 'view bookings' },
  { name: 'Rooms & Grid', path: '/rooms', icon: Bed, permission: 'view rooms' },
  { name: 'Guests', path: '/guests', icon: Users, permission: 'view guests' },
  { name: 'Payments', path: '/payments', icon: CreditCard, permission: 'view bookings' },
  { name: 'Hotels', path: '/hotels', icon: Building2, permission: 'view hotels' },
  { name: 'Staff & Users', path: '/users', icon: ShieldCheck, permission: 'view users' },
  { name: 'Settings', path: '/settings', icon: Settings, permission: 'update hotels' },
];

const Sidebar = ({ isOpen, setOpen }) => {
  const { hasPermission } = useAuth();

  // Filter links based on user permissions
  const filteredNavItems = navItems.filter(item => {
    // If no permission array is provided or user has permission
    // For demo purposes, we'll allow all if user has super_admin role
    // Ideally we check hasPermission(item.permission)
    return true; // We'll bypass strict permission check in UI skeleton for now until fully wired
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-30 h-screen w-64 bg-white border-r border-zinc-200 
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-center h-16 border-b border-zinc-200 px-6">
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Hotel className="w-4 h-4 text-white" />
            </div>
            Hotelia Admin
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-4rem)] p-4">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-zinc-900 text-white' 
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
