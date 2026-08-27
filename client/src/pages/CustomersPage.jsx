import { useEffect, useState } from 'react';
import { customersAPI, windowsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/dateUtils';

const STATUS_BADGE = {
  true:  <span className="badge-paid">Active</span>,
  false: <span className="badge-unpaid">Inactive</span>,
};

function CustomerModal({ customer, windows, onClose, onSaved, defaultRate }) {
  const [form, setForm] = useState(
    customer
      ? {
          name: customer.name,
          phone: customer.phone,
          address: customer.address || '',
          milkRate: customer.milkRate,
          windowId: customer.windowId?._id || customer.windowId || '',
          notes: customer.notes || '',
        }
      : { name: '', phone: '', address: '', milkRate: defaultRate || 60, windowId: '', notes: '' }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (customer) {
        await customersAPI.update(customer._id, form);
      } else {
        await customersAPI.create(form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-bold text-gray-800">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <div>
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
              placeholder="Customer name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Phone Number *</label>
              <input
                className="form-input"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="form-label">Milk Rate (₹/L) *</label>
              <input
                className="form-input"
                type="number"
                step="0.5"
                min="0"
                value={form.milkRate}
                onChange={(e) => setForm({ ...form, milkRate: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="form-label">Address</label>
            <input
              className="form-input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Window / Route</label>
              <select
                className="form-input"
                value={form.windowId}
                onChange={(e) => setForm({ ...form, windowId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {windows.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <input
                className="form-input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : customer ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showActive, setShowActive] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [defaultRate, setDefaultRate] = useState(60);

  const load = async () => {
    setLoading(true);
    try {
      const [custRes, winRes] = await Promise.all([
        customersAPI.getAll({ active: showActive, search }),
        windowsAPI.getAll(),
      ]);
      setCustomers(custRes.data.data.customers);
      setWindows(winRes.data.data.windows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [showActive]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleToggleStatus = async (customer) => {
    try {
      await customersAPI.updateStatus(customer._id, !customer.active);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditCustomer(null);
    load();
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} customers</p>
        </div>
        <button
          onClick={() => { setEditCustomer(null); setShowModal(true); }}
          className="btn-primary text-sm"
        >
          + Add
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          className="form-input flex-1"
          placeholder="Search name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-secondary px-3">🔍</button>
        <label className="flex items-center gap-1.5 cursor-pointer px-1">
          <input
            type="checkbox"
            id="showActive"
            checked={showActive}
            onChange={(e) => setShowActive(e.target.checked)}
            className="rounded w-4 h-4"
          />
          <span className="text-sm text-gray-600 whitespace-nowrap">Active</span>
        </label>
      </form>

      {loading ? (
        <LoadingSpinner />
      ) : customers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-medium text-gray-600">No customers found</p>
          <p className="text-sm mt-1">Click &quot;+ Add&quot; to create your first customer.</p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="space-y-2 md:hidden">
            {customers.map((customer) => (
              <div key={customer._id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800">{customer.name}</p>
                      {STATUS_BADGE[customer.active]}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{customer.phone}</p>
                    {customer.address && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{customer.address}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span>₹{customer.milkRate}/L</span>
                      {customer.windowId?.name && <span>· {customer.windowId.name}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                    <button
                      onClick={() => { setEditCustomer(customer); setShowModal(true); }}
                      className="text-xs text-blue-600 font-medium px-2 py-1 rounded-lg hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(customer)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg ${
                        customer.active
                          ? 'text-red-500 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {customer.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Window</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Rate</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{customer.name}</p>
                        {customer.address && (
                          <p className="text-xs text-gray-400 truncate max-w-40">{customer.address}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{customer.phone}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {customer.windowId?.name || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-700">
                      ₹{customer.milkRate}/L
                    </td>
                    <td className="px-4 py-3 text-center">
                      {STATUS_BADGE[customer.active]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditCustomer(customer); setShowModal(true); }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(customer)}
                          className={`text-xs font-medium ${customer.active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                        >
                          {customer.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <CustomerModal
          customer={editCustomer}
          windows={windows}
          onClose={() => { setShowModal(false); setEditCustomer(null); }}
          onSaved={handleSaved}
          defaultRate={defaultRate}
        />
      )}
    </div>
  );
}
