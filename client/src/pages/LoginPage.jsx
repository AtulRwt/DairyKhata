import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [tab, setTab] = useState('owner');
  const [form, setForm] = useState({ email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginOwner, loginEmployee } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'owner') {
        const result = await loginOwner({ email: form.email, password: form.password });
        navigate('/dashboard');
      } else {
        const result = await loginEmployee({ phone: form.phone, password: form.password });
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">Sign In</h2>
      <p className="text-sm text-gray-500 mb-6">
        Are you a customer?{' '}
        <a href="/customer-login" className="text-green-600 font-medium hover:underline">
          Customer Login →
        </a>
      </p>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        <button
          type="button"
          onClick={() => setTab('owner')}
          className={`flex-1 justify-center py-1.5 text-sm font-medium rounded-md transition-all ${
            tab === 'owner'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Owner
        </button>
        <button
          type="button"
          onClick={() => setTab('employee')}
          className={`flex-1 justify-center py-1.5 text-sm font-medium rounded-md transition-all ${
            tab === 'employee'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Employee
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {tab === 'owner' ? (
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoFocus
            />
          </div>
        ) : (
          <div>
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              autoFocus
            />
          </div>
        )}

        <div>
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center py-2.5"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        New owner?{' '}
        <a href="/signup" className="text-green-600 font-medium hover:underline">
          Create an account
        </a>
      </p>
    </div>
  );
}
