import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  ShoppingBag, 
  Building2, 
  Bed, 
  CalendarCheck, 
  Users, 
  CreditCard, 
  Settings, 
  ShieldCheck, 
  Hotel, 
  TrendingUp, 
  Wrench, 
  Tags,
  ChevronDown,
  FileText
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
      { 
        name: 'Rooms & Inventory', 
        icon: Bed, 
        permission: 'view rooms',
        children: [
          { name: 'Rooms List', path: '/rooms' },
          { name: 'Availability Grid', path: '/availability' },
          { name: 'Room Types', path: '/room-types' },
          { name: 'Amenities', path: '/amenities' },
        ]
      },
      { name: 'Services & Extras', path: '/services', icon: ShoppingBag, permission: 'view services' },
      { 
        name: 'Rates & Pricing', 
        icon: Tags, 
        permission: 'view rate plans',
        children: [
          { name: 'Rate Plans', path: '/rate-plans' },
          { name: 'Pricing Rules', path: '/pricing-rules' },
        ]
      },
      { 
        name: 'Operations', 
        icon: Wrench, 
        children: [
          { name: 'Housekeeping', path: '/housekeeping', permission: 'view housekeeping' },
          { name: 'Maintenance', path: '/maintenance', permission: 'view maintenance' },
        ]
      },
    ]
  },
  {
    title: 'Administration',
    items: [
      { name: 'Hotels', path: '/hotels', icon: Building2, permission: 'view hotels' },
      { 
        name: 'Staff Management', 
        icon: ShieldCheck, 
        children: [
          { name: 'Staff List', path: '/users', permission: 'view users' },
          { name: 'Roles', path: '/roles', permission: 'update users' },
        ]
      },
      { name: 'Settings', path: '/settings', icon: Settings, permission: 'update hotels' },
      { name: 'Audit Logs', path: '/audit-logs', icon: FileText, permission: 'view activity logs' },
    ]
  }
];

const SidebarDropdownItem = ({ item, setMobileOpen }) => {
  const { hasPermission } = useAuth();
  const location = useLocation();

  const visibleChildren = useMemo(() => {
    return (item.children || []).filter(
      child => !child.permission || hasPermission(child.permission)
    );
  }, [item.children, hasPermission]);

  const isAnyChildActive = visibleChildren.some(
    child => location.pathname === child.path || location.pathname.startsWith(child.path + '/')
  );
  const [isOpen, setIsOpen] = useState(isAnyChildActive);

  useEffect(() => {
    if (isAnyChildActive) {
      setIsOpen(true);
    }
  }, [isAnyChildActive]);

  if (visibleChildren.length === 0) return null;

  return (
    <li>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`
          w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none
          ${isAnyChildActive 
            ? 'bg-zinc-100 text-zinc-900 font-semibold' 
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}
        `}
      >
        <div className="flex items-center gap-3">
          <item.icon className="w-5 h-5 text-zinc-500" />
          <span>{item.name}</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-zinc-700' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <ul className="mt-1 ml-4 pl-3 border-l border-zinc-200 space-y-1 py-1">
          {visibleChildren.map((child) => (
            <li key={child.name}>
              <NavLink
                to={child.path}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={({ isActive }) => `
                  block px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${isActive 
                    ? 'bg-zinc-900 text-white shadow-xs font-semibold' 
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'}
                `}
              >
                {child.name}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

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
              if (item.children && item.children.length > 0) {
                return item.children.some(child => !child.permission || hasPermission(child.permission));
              }
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
                  {filteredItems.map((item) => {
                    if (item.children && item.children.length > 0) {
                      return (
                        <SidebarDropdownItem
                          key={item.name}
                          item={item}
                          setMobileOpen={setOpen}
                        />
                      );
                    }

                    return (
                      <li key={item.name}>
                        <NavLink
                          to={item.path}
                          onClick={() => setOpen(false)}
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
                    );
                  })}
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
