import { useEffect, useState } from 'react';
import { settingsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SettingsPage() {
  const [form, setForm] = useState({
    businessName: '',
    upiId: '',
    defaultMilkRate: 60,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    settingsAPI.get()
      .then((res) => {
        const s = res.data.data.settings;
        setForm({
          businessName: s.businessName || '',
          upiId: s.upiId || '',
          defaultMilkRate: s.defaultMilkRate || 60,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await settingsAPI.update(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const upiPreview = form.upiId
    ? `upi://pay?pa=${form.upiId}&pn=${encodeURIComponent(form.businessName)}&am=100&cu=INR`
    : '';

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your business information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">✅ Settings saved successfully!</div>}

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm border-b pb-2">Business Information</h2>
          <div>
            <label className="form-label">Business Name</label>
            <input
              className="form-input"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="Sharma Dairy"
            />
          </div>
          <div>
            <label className="form-label">Default Milk Rate (₹ per liter)</label>
            <input
              className="form-input"
              type="number"
              step="0.5"
              min="0"
              value={form.defaultMilkRate}
              onChange={(e) => setForm({ ...form, defaultMilkRate: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">
              This rate is used when adding new customers. Each customer can have their own rate.
            </p>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm border-b pb-2">Payment Settings (UPI)</h2>
          <div>
            <label className="form-label">UPI ID</label>
            <input
              className="form-input"
              value={form.upiId}
              onChange={(e) => setForm({ ...form, upiId: e.target.value })}
              placeholder="yourname@upi"
            />
            <p className="text-xs text-gray-400 mt-1">
              Customers will use this to pay you. Example: sharma@okicici
            </p>
          </div>

          {upiPreview && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-600 mb-1">UPI Link Preview:</p>
              <p className="text-xs text-gray-400 break-all font-mono">{upiPreview}</p>
            </div>
          )}
        </div>

        <div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
