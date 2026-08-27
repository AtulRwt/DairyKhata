import { useEffect, useState } from 'react';
import { windowsAPI, employeesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function WindowModal({ window: win, employees, onClose, onSaved }) {
  const [form, setForm] = useState(
    win
      ? { name: win.name, employeeId: win.employeeId?._id || win.employeeId || '', description: win.description || '' }
      : { name: '', employeeId: '', description: '' }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (win) {
        await windowsAPI.update(win._id, form);
      } else {
        await windowsAPI.create(form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save window.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10 flex-shrink-0">
          <h2 className="font-bold text-gray-800">{win ? 'Edit Window' : 'Add Window'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 pb-8 sm:pb-5">

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div>
            <label className="form-label">Window Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus placeholder="e.g. Morning Route" />
          </div>
          <div>
            <label className="form-label">Assigned Employee</label>
            <select className="form-input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">None</option>
              {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Description</label>
            <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : win ? 'Save Changes' : 'Create Window'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WindowsPage() {
  const [windows, setWindows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editWindow, setEditWindow] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [winRes, empRes] = await Promise.all([windowsAPI.getAll(), employeesAPI.getAll()]);
      setWindows(winRes.data.data.windows);
      setEmployees(empRes.data.data.employees);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (win) => {
    if (!confirm(`Delete window "${win.name}"? Customers will be moved to unassigned.`)) return;
    try {
      await windowsAPI.delete(win._id);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete window.'); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Windows / Routes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage delivery windows and route assignments</p>
        </div>
        <button onClick={() => { setEditWindow(null); setShowModal(true); }} className="btn-primary">
          + Add Window
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {windows.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🪟</p>
              <p className="font-medium">No windows yet</p>
              <p className="text-sm mt-1">Create windows to organize your delivery routes</p>
            </div>
          ) : (
            windows.map((win) => (
              <div key={win._id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{win.name}</h3>
                    {win.description && <p className="text-xs text-gray-500 mt-0.5">{win.description}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${win.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {win.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <span>🧑‍💼</span>
                  <span>{win.employeeId?.name || <span className="text-gray-400">Unassigned</span>}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <span>👥</span>
                  <span>{win.customerCount || 0} customers</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditWindow(win); setShowModal(true); }} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                  <button onClick={() => handleDelete(win)} className="text-xs text-red-500 hover:text-red-700 font-medium px-2">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <WindowModal
          window={editWindow}
          employees={employees}
          onClose={() => { setShowModal(false); setEditWindow(null); }}
          onSaved={() => { setShowModal(false); setEditWindow(null); load(); }}
        />
      )}
    </div>
  );
}
