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
  Hotel,
  TrendingUp,
  Sparkles,
  Wrench,
  Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigationGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard, permission: 'view reports' },
      { name: 'Reports', path: '/reports', icon: TrendingUp, permission: 'view reports' },
    ]
  },
  {
    title: 'Front Desk',
    items: [
      { name: 'Bookings', path: '/bookings', icon: CalendarCheck, permission: 'view bookings' },
      { name: 'Guests', path: '/guests', icon: Users, permission: 'view guests' },
      { name: 'Payments', path: '/payments', icon: CreditCard, permission: 'view bookings' },
    ]
  },
  {
    title: 'Property',
    items: [
      { name: 'Rooms & Grid', path: '/rooms', icon: Bed, permission: 'view rooms' },
      { name: 'Housekeeping', path: '/housekeeping', icon: Sparkles, permission: 'view housekeeping' },
      { name: 'Maintenance', path: '/maintenance', icon: Wrench, permission: 'view maintenance' },
    ]
  },
  {
    title: 'Administration',
    items: [
      { name: 'Hotels', path: '/hotels', icon: Building2, permission: 'view hotels' },
      { name: 'Staff & Users', path: '/users', icon: ShieldCheck, permission: 'view users' },
      { name: 'Roles & Permissions', path: '/roles', icon: Key, permission: 'manage roles' },
      { name: 'Settings', path: '/settings', icon: Settings, permission: 'update hotels' },
      { name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck, permission: 'view activity logs' },
    ]
  }
];

const Sidebar = ({ isOpen, setOpen }) => {
  const { hasPermission } = useAuth();

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
        flex flex-col
      `}>
        <div className="flex items-center justify-center h-16 border-b border-zinc-200 px-6 shrink-0">
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Hotel className="w-4 h-4 text-white" />
            </div>
            Hotelia Admin
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-6">
          {navigationGroups.map((group) => {
            // Filter items in this group based on permissions
            const filteredItems = group.items.filter(item => {
              if (!item.permission) return true;
              return hasPermission(item.permission);
            });

            // If no items are visible, don't render the group
            if (filteredItems.length === 0) return null;

            return (
              <div key={group.title}>
                <h3 className="px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {filteredItems.map((item) => (
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
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
