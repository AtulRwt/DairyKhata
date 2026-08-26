import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function CustomerLoginPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginCustomer } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginCustomer({ phone: phone.trim() });
      navigate('/hisab');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'This number is not registered. Please contact your milk seller.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">Customer Login</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter your registered phone number to view your milk hisab
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            className="form-input text-lg"
            placeholder="Enter your mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoFocus
            maxLength={15}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !phone}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          {loading ? 'Checking...' : 'View My Hisab →'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          🔒 Your data is private. Only you can see your hisab.
        </p>
      </div>

      <p className="text-center text-sm text-gray-500 mt-4">
        Are you the seller?{' '}
        <a href="/login" className="text-green-600 font-medium hover:underline">
          Owner/Employee Login
        </a>
      </p>
    </div>
  );
}
