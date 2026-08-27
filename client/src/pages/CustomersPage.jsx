import { useEffect, useState } from 'react';
import { customersAPI, windowsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/dateUtils';

const STATUS_BADGE = {
  true: <span className="badge-paid">Active</span>,
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
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
            <div className="col-span-2">
              <label className="form-label">Address</label>
              <input
                className="form-input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Optional"
              />
            </div>
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
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} customers</p>
        </div>
        <button
          onClick={() => { setEditCustomer(null); setShowModal(true); }}
          className="btn-primary"
        >
          + Add Customer
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          className="form-input w-64"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-secondary py-1.5">Search</button>
        <div className="flex items-center gap-2 ml-2">
          <input
            type="checkbox"
            id="showActive"
            checked={showActive}
            onChange={(e) => setShowActive(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="showActive" className="text-sm text-gray-600">Active only</label>
        </div>
      </form>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card p-0 overflow-hidden">
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
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No customers found. Click "Add Customer" to create one.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
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
