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
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-bold text-gray-800">{employee ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div>
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus placeholder="Employee name" />
          </div>
          <div>
            <label className="form-label">Phone Number *</label>
            <input className="form-input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="9876543210" />
          </div>
          <div>
            <label className="form-label">{employee ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!employee} placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="form-label mb-2">Permissions</label>
            <div className="space-y-3">
              {[
                ['canEditMilk', 'Can edit milk entries'],
                ['canDeleteMilk', 'Can delete milk entries'],
                ['canViewAllCustomers', 'Can view all customers'],
                ['canChangeRate', 'Can change milk rate'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer min-h-0">
                  <input type="checkbox" checked={!!form.permissions[key]} onChange={() => togglePerm(key)} className="rounded w-4 h-4 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
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
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">{employees.length} employees</p>
        </div>
        <button onClick={() => { setEditEmployee(null); setShowModal(true); }} className="btn-primary text-sm">
          + Add
        </button>
      </div>

      {loading ? <LoadingSpinner /> : employees.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🧑‍💼</p>
          <p className="font-medium text-gray-600">No employees yet</p>
          <p className="text-sm mt-1">Add employees to help manage your dairy.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {employees.map((emp) => (
              <div key={emp._id} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{emp.name}</p>
                      <p className="text-sm text-gray-500">{emp.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {emp.active
                      ? <span className="badge-paid">Active</span>
                      : <span className="badge-unpaid">Inactive</span>}
                    <button onClick={() => { setEditEmployee(emp); setShowModal(true); }} className="text-xs text-blue-600 font-medium px-2 py-1 rounded-lg hover:bg-blue-50">Edit</button>
                    <button onClick={() => handleDelete(emp)} className="text-xs text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50">Remove</button>
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </>
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
