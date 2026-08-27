import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/register',  label: 'Register',  icon: '📋' },
  { path: '/customers', label: 'Customers', icon: '👥' },
  { path: '/employees', label: 'Employees', icon: '🧑‍💼', ownerOnly: true },
  { path: '/windows',   label: 'Windows',   icon: '🪟',  ownerOnly: true },
  { path: '/payments',  label: 'Payments',  icon: '💰',  ownerOnly: true },
  { path: '/settings',  label: 'Settings',  icon: '⚙️',  ownerOnly: true },
];

export default function OwnerLayout() {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNavItems = navItems.filter(
    (item) => !item.ownerOnly || role === 'owner'
  );

  // Bottom nav: max 5 most important items on mobile
  const bottomNavItems = visibleNavItems.slice(0, 5);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── DESKTOP SIDEBAR (hidden on mobile) ── */}
      <aside className="hidden md:flex w-52 flex-shrink-0 bg-white border-r border-gray-200 flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🥛</span>
            </div>
            <span className="font-bold text-gray-800 text-lg">
              Dairy<span className="text-green-600">Khata</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-xs">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile top header (hidden on desktop) */}
        <header className="md:hidden flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">🥛</span>
            </div>
            <span className="font-bold text-gray-800">
              Dairy<span className="text-green-600">Khata</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-xs">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-xs text-gray-600 font-medium truncate max-w-[80px]">
                {user?.name?.split(' ')[0]}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-red-500 font-medium py-1.5 px-2.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile so content clears the nav bar */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* ── MOBILE BOTTOM NAV (hidden on desktop) ── */}
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
