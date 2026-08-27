import { useEffect, useState } from 'react';
import { employeesAPI, windowsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function EmployeeModal({ employee, windows, onClose, onSaved }) {
  const [form, setForm] = useState(
    employee
      ? { name: employee.name, phone: employee.phone, password: '', permissions: employee.permissions || {} }
      : { name: '', phone: '', password: '', permissions: { canEditMilk: true, canDeleteMilk: false, canViewAllCustomers: false, canChangeRate: false } }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (employee) {
        await employeesAPI.update(employee._id, data);
      } else {
        await employeesAPI.create(data);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee.');
    } finally {
      setLoading(false);
    }
  };

  const togglePerm = (key) => {
    setForm((f) => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800">{employee ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div>
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          </div>
          <div>
            <label className="form-label">Phone Number *</label>
            <input className="form-input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">{employee ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!employee} placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="form-label mb-2">Permissions</label>
            <div className="space-y-2">
              {[
                ['canEditMilk', 'Can edit milk entries'],
                ['canDeleteMilk', 'Can delete milk entries'],
                ['canViewAllCustomers', 'Can view all customers'],
                ['canChangeRate', 'Can change milk rate'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!form.permissions[key]} onChange={() => togglePerm(key)} className="rounded" />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : employee ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [empRes, winRes] = await Promise.all([employeesAPI.getAll(), windowsAPI.getAll()]);
      setEmployees(empRes.data.data.employees);
      setWindows(winRes.data.data.windows);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (emp) => {
    if (!confirm(`Remove employee ${emp.name}? This cannot be undone.`)) return;
    try {
      await employeesAPI.delete(emp._id);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Failed to remove employee.'); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">{employees.length} employees</p>
        </div>
        <button onClick={() => { setEditEmployee(null); setShowModal(true); }} className="btn-primary">
          + Add Employee
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400">No employees yet. Add one to get started.</td></tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{emp.name}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.phone}</td>
                    <td className="px-4 py-3">
                      {emp.active ? <span className="badge-paid">Active</span> : <span className="badge-unpaid">Inactive</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => { setEditEmployee(emp); setShowModal(true); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                        <button onClick={() => handleDelete(emp)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
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
        <EmployeeModal
          employee={editEmployee}
          windows={windows}
          onClose={() => { setShowModal(false); setEditEmployee(null); }}
          onSaved={() => { setShowModal(false); setEditEmployee(null); load(); }}
        />
      )}
    </div>
  );
}
