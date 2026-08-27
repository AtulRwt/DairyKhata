import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/register',  label: 'Register',  icon: '📋' },
  { path: '/customers', label: 'Customers', icon: '👥' },
  { path: '/employees', label: 'Employees', icon: '🧑‍💼', ownerOnly: true },
  { path: '/windows',   label: 'Windows',   icon: '🪟',  ownerOnly: true },
  { path: '/payments',  label: 'Payments',  icon: '💰',  ownerOnly: true },
];

// Profile dropdown — shared between mobile header & desktop sidebar
function ProfileDropdown({ user, role, onLogout, onSettings }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl hover:bg-gray-100 transition-colors px-1.5 py-1 min-h-0"
        aria-label="Profile menu"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-gray-800 leading-tight truncate max-w-[90px]">{user?.name?.split(' ')[0]}</p>
          <p className="text-[10px] text-gray-400 capitalize leading-tight">{role}</p>
        </div>
        <svg className={`w-3 h-3 text-gray-400 transition-transform hidden sm:block ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-[100] overflow-hidden">
          {/* User info header */}
          <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{role}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => { onSettings(); setOpen(false); }}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors min-h-0"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => { onLogout(); setOpen(false); }}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors min-h-0"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OwnerLayout() {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleSettings = () => navigate('/settings');

  const visibleNavItems = navItems.filter(
    (item) => !item.ownerOnly || role === 'owner'
  );

  // Bottom nav: max 5 items on mobile
  const bottomNavItems = visibleNavItems.slice(0, 5);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex w-52 flex-shrink-0 bg-white border-r border-gray-200 flex-col">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-sm">🥛</span>
            </div>
            <span className="font-bold text-gray-800 text-lg tracking-tight">
              Dairy<span className="text-green-600">Khata</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-green-50 text-green-700 font-semibold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Profile section */}
        <div className="p-3 border-t border-gray-100">
          <ProfileDropdown
            user={user}
            role={role}
            onLogout={handleLogout}
            onSettings={handleSettings}
          />
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile top header */}
        <header className="md:hidden flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">🥛</span>
            </div>
            <span className="font-bold text-gray-800 tracking-tight">
              Dairy<span className="text-green-600">Khata</span>
            </span>
          </div>
          <ProfileDropdown
            user={user}
            role={role}
            onLogout={handleLogout}
            onSettings={handleSettings}
          />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px] ${
                  isActive ? 'text-green-700' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-green-600 rounded-full" />
                  )}
                  <span className="text-xl leading-none">{item.icon}</span>
                  <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-green-700' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
