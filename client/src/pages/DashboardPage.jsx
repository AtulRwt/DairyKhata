import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { formatCurrency, getMonthName } from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';

const StatCard = ({ label, value, sub, color = 'gray', icon }) => (
  <div className="card flex items-start gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-${color}-50`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.getStats()
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  if (!stats) return null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {getMonthName(stats.month)} {stats.year} overview
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Customers"
          value={stats.activeCustomers}
          sub={`${stats.totalCustomers} total`}
          color="green"
          icon="👥"
        />
        <StatCard
          label="Today's Entries"
          value={stats.todayEntries}
          sub={`out of ${stats.activeCustomers}`}
          color="blue"
          icon="✏️"
        />
        <StatCard
          label="Milk This Month"
          value={`${stats.monthMilk} L`}
          color="green"
          icon="🥛"
        />
        <StatCard
          label="Month Revenue"
          value={formatCurrency(stats.monthRevenue)}
          color="blue"
          icon="💰"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Collected"
          value={formatCurrency(stats.totalCollected)}
          sub={`${stats.paidCount} customers paid`}
          color="green"
          icon="✅"
        />
        <StatCard
          label="Pending"
          value={formatCurrency(stats.totalPending)}
          sub={`${stats.unpaidCount} customers unpaid`}
          color="yellow"
          icon="⏳"
        />
        <StatCard
          label="Employees"
          value={stats.totalEmployees}
          color="gray"
          icon="🧑‍💼"
        />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/register')}
            className="btn-primary"
          >
            📋 Open Register
          </button>
          <button
            onClick={() => navigate('/customers')}
            className="btn-secondary"
          >
            👥 Manage Customers
          </button>
          <button
            onClick={() => navigate('/payments')}
            className="btn-secondary"
          >
            💰 View Payments
          </button>
        </div>
      </div>

      {/* Recent activity */}
      {stats.recentActivity?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h2>
          <div className="card divide-y divide-gray-100">
            {stats.recentActivity.slice(0, 8).map((log) => (
              <div key={log._id} className="py-2.5 flex items-start gap-3">
                <span className="text-base flex-shrink-0">
                  {log.action === 'MILK_ENTRY_CREATED' ? '✏️' :
                   log.action === 'MILK_ENTRY_UPDATED' ? '🔄' :
                   log.action === 'MILK_ENTRY_DELETED' ? '🗑️' :
                   log.action === 'CUSTOMER_CREATED' ? '👤' :
                   log.action === 'PAYMENT_STATUS_UPDATED' ? '💰' : '📝'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <strong>{log.performedBy?.name}</strong>{' '}
                    {log.action === 'MILK_ENTRY_UPDATED' && log.customerId
                      ? `updated ${log.customerId.name}'s entry: ${log.oldValue} → ${log.newValue} L`
                      : log.action === 'MILK_ENTRY_CREATED' && log.customerId
                      ? `added entry for ${log.customerId.name}: ${log.newValue} L`
                      : log.action === 'CUSTOMER_CREATED' && log.customerId
                      ? `added customer ${log.customerId.name}`
                      : log.action.replace(/_/g, ' ').toLowerCase()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
