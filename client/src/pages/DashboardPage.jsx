import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { formatCurrency, getMonthName } from '../utils/dateUtils';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

const ACTION_META = {
  MILK_ENTRY_CREATED:      { icon: '✏️', color: 'bg-blue-50 text-blue-600' },
  MILK_ENTRY_UPDATED:      { icon: '🔄', color: 'bg-amber-50 text-amber-600' },
  MILK_ENTRY_DELETED:      { icon: '🗑️', color: 'bg-red-50 text-red-600' },
  CUSTOMER_CREATED:        { icon: '👤', color: 'bg-green-50 text-green-600' },
  PAYMENT_STATUS_UPDATED:  { icon: '💰', color: 'bg-purple-50 text-purple-600' },
};

const getActionMeta = (action) => ACTION_META[action] || { icon: '📝', color: 'bg-gray-50 text-gray-500' };

const getActionText = (log) => {
  if (log.action === 'MILK_ENTRY_UPDATED' && log.customerId)
    return `Updated ${log.customerId.name} · ${log.oldValue}→${log.newValue} L`;
  if (log.action === 'MILK_ENTRY_CREATED' && log.customerId)
    return `Entry for ${log.customerId.name} · ${log.newValue} L`;
  if (log.action === 'CUSTOMER_CREATED' && log.customerId)
    return `Added ${log.customerId.name}`;
  return log.action.replace(/_/g, ' ').toLowerCase();
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    dashboardAPI.getStats()
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return null;

  const collectionRate = stats.monthRevenue > 0
    ? Math.round((stats.totalCollected / stats.monthRevenue) * 100)
    : 0;

  const entryRate = stats.activeCustomers > 0
    ? Math.round((stats.todayEntries / stats.activeCustomers) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-5 space-y-4 max-w-5xl">

      {/* ── GREETING HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {getMonthName(stats.month)} {stats.year} · Live overview
          </p>
        </div>
        <button
          onClick={() => navigate('/register')}
          className="btn-primary text-sm py-2 px-4"
        >
          📋 Register
        </button>
      </div>

      {/* ── HERO REVENUE BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-5 text-white shadow-lg">
        {/* decorative blur circles */}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-green-200 text-xs font-medium">Month Revenue</p>
            <p className="text-2xl sm:text-3xl font-bold mt-0.5">{formatCurrency(stats.monthRevenue)}</p>
            <p className="text-green-300 text-xs mt-1">{getMonthName(stats.month)} {stats.year}</p>
          </div>
          <div>
            <p className="text-green-200 text-xs font-medium">Collected</p>
            <p className="text-2xl font-bold mt-0.5">{formatCurrency(stats.totalCollected)}</p>
            <p className="text-green-300 text-xs mt-1">{stats.paidCount} paid</p>
          </div>
          <div>
            <p className="text-green-200 text-xs font-medium">Pending</p>
            <p className="text-2xl font-bold mt-0.5">{formatCurrency(stats.totalPending)}</p>
            <p className="text-green-300 text-xs mt-1">{stats.unpaidCount} unpaid</p>
          </div>
          <div>
            <p className="text-green-200 text-xs font-medium">Milk This Month</p>
            <p className="text-2xl font-bold mt-0.5">{stats.monthMilk} <span className="text-lg font-normal">L</span></p>
            <p className="text-green-300 text-xs mt-1">{stats.activeCustomers} customers</p>
          </div>
        </div>

        {/* Collection progress bar */}
        <div className="relative mt-4 pt-3 border-t border-white/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-green-200">Collection rate</span>
            <span className="text-xs font-bold text-white">{collectionRate}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${collectionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Today's entries */}
        <div
          onClick={() => navigate('/register')}
          className="card p-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Today</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.todayEntries}</p>
              <p className="text-xs text-gray-400 mt-0.5">of {stats.activeCustomers} entries</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              ✏️
            </div>
          </div>
          {/* Mini progress */}
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${entryRate}%` }} />
          </div>
          <p className="text-[10px] text-blue-500 font-medium mt-1">{entryRate}% done</p>
        </div>

        {/* Active customers */}
        <div
          onClick={() => navigate('/customers')}
          className="card p-4 cursor-pointer hover:shadow-md hover:border-green-200 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Customers</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.activeCustomers}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stats.totalCustomers} total</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              👥
            </div>
          </div>
          <div className="mt-3 flex gap-0.5">
            {[...Array(Math.min(stats.activeCustomers, 8))].map((_, i) => (
              <div key={i} className="flex-1 h-1 bg-green-400 rounded-full" />
            ))}
            {[...Array(Math.max(0, 8 - stats.activeCustomers))].map((_, i) => (
              <div key={i} className="flex-1 h-1 bg-gray-100 rounded-full" />
            ))}
          </div>
          <p className="text-[10px] text-green-600 font-medium mt-1">Active</p>
        </div>

        {/* Employees */}
        <div
          onClick={() => navigate('/employees')}
          className="card p-4 cursor-pointer hover:shadow-md hover:border-purple-200 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Employees</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.totalEmployees}</p>
              <p className="text-xs text-gray-400 mt-0.5">on team</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              🧑‍💼
            </div>
          </div>
          <div className="mt-3 h-1 bg-gray-100 rounded-full" />
          <p className="text-[10px] text-purple-500 font-medium mt-1">Staff</p>
        </div>

        {/* Payments */}
        <div
          onClick={() => navigate('/payments')}
          className="card p-4 cursor-pointer hover:shadow-md hover:border-amber-200 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Unpaid</p>
              <p className="text-2xl font-bold text-red-500 mt-0.5">{stats.unpaidCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">customers</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              ⏳
            </div>
          </div>
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${100 - collectionRate}%` }} />
          </div>
          <p className="text-[10px] text-amber-600 font-medium mt-1">Needs follow-up</p>
        </div>
      </div>

      {/* ── QUICK ACTIONS + RECENT ACTIVITY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Quick actions - 2 cols on desktop */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Open Register', icon: '📋', path: '/register', bg: 'bg-green-600', text: 'text-white', hover: 'hover:bg-green-700' },
              { label: 'Customers',    icon: '👥', path: '/customers', bg: 'bg-white', text: 'text-gray-700', hover: 'hover:bg-gray-50', border: 'border border-gray-200' },
              { label: 'Payments',     icon: '💰', path: '/payments',  bg: 'bg-white', text: 'text-gray-700', hover: 'hover:bg-gray-50', border: 'border border-gray-200' },
              { label: 'Windows',      icon: '🪟', path: '/windows',   bg: 'bg-white', text: 'text-gray-700', hover: 'hover:bg-gray-50', border: 'border border-gray-200' },
            ].map(({ label, icon, path, bg, text, hover, border }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`${bg} ${text} ${hover} ${border || ''} rounded-xl p-3.5 flex flex-col items-start gap-1.5 transition-all hover:shadow-sm active:scale-95 text-left`}
              >
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-semibold leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent activity - 3 cols on desktop */}
        <div className="lg:col-span-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Activity</h2>
          {stats.recentActivity?.length > 0 ? (
            <div className="card p-0 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {stats.recentActivity.slice(0, 6).map((log) => {
                  const meta = getActionMeta(log.action);
                  return (
                    <div key={log._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/60 transition-colors">
                      <div className={`w-7 h-7 rounded-lg ${meta.color} flex items-center justify-center text-sm flex-shrink-0`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 truncate">
                          <span className="font-semibold">{log.performedBy?.name}</span>
                          {' · '}
                          {getActionText(log)}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">No activity yet. Start by adding entries in the register.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
