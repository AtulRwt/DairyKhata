import { useEffect, useState, useRef } from 'react';
import useAuthStore from '../store/authStore';
import { billingAPI } from '../services/api';
import { MONTHS, getYears, formatCurrency, formatShortDate, getToday } from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';

const PayStatusBadge = ({ status }) => {
  if (status === 'PAID') return (
    <div className="text-center">
      <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 font-semibold px-5 py-2 rounded-full text-sm">
        ✅ PAID
      </div>
    </div>
  );
  if (status === 'PARTIALLY_PAID') return (
    <div className="text-center">
      <div className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 font-semibold px-5 py-2 rounded-full text-sm">
        ⏳ PARTIALLY PAID
      </div>
    </div>
  );
  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 font-semibold px-5 py-2 rounded-full text-sm">
        ❌ UNPAID
      </div>
    </div>
  );
};

export default function CustomerHisabPage() {
  const { user, logout } = useAuthStore();
  const today = getToday();
  const [month, setMonth] = useState(today.month);
  const [year, setYear] = useState(today.year);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const upiAnchorRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    loadBilling();
  }, [user, month, year]);

  const loadBilling = async () => {
    if (!user?._id) return;
    setLoading(true);
    setError('');
    try {
      const res = await billingAPI.getCustomerBilling(user._id, { month, year });
      setBilling(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load hisab. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    if (billing?.upiLink && upiAnchorRef.current) {
      // Must use a real anchor click — window.location.href is blocked
      // by browsers for custom protocols like upi://
      upiAnchorRef.current.click();
    }
  };

  const handleCopyUpi = () => {
    const upiId = billing?.upiLink?.match(/pa=([^&]+)/)?.[1];
    if (upiId) {
      navigator.clipboard.writeText(upiId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/customer-login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🥛</span>
            </div>
            <span className="font-bold text-gray-800">
              Dairy<span className="text-green-600">Khata</span>
            </span>
          </div>
          <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-700">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Your milk hisab</p>
        </div>

        {/* Month selector */}
        <div className="flex gap-2 mb-6">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="form-input flex-1 py-2"
          >
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="form-input w-28 py-2"
          >
            {getYears().map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={loadBilling} className="btn-secondary mt-4 text-sm">Retry</button>
          </div>
        ) : billing ? (
          <>
            {/* Summary card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                {MONTHS.find((m) => m.value === month)?.label} {year}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <p className="text-xs text-gray-500">Total Milk</p>
                  <p className="text-3xl font-bold text-gray-800 mt-0.5">
                    {billing.totalMilk}
                    <span className="text-base font-normal text-gray-500 ml-1">L</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rate</p>
                  <p className="text-xl font-bold text-gray-700 mt-0.5">
                    ₹{billing.currentRate}
                    <span className="text-sm font-normal text-gray-400">/L</span>
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(billing.totalAmount)}
                  </p>
                </div>
                {billing.payment?.amountPaid > 0 && billing.payment?.amountPaid < billing.totalAmount && (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">Paid</p>
                    <p className="text-sm font-medium text-green-600">
                      − {formatCurrency(billing.payment.amountPaid)}
                    </p>
                  </div>
                )}
              </div>

              {/* Payment status */}
              <PayStatusBadge status={billing.payment?.status || 'UNPAID'} />

              {/* Pay button + UPI anchor (hidden) */}
              {billing.payment?.status !== 'PAID' && billing.upiLink && billing.totalAmount > 0 && (
                <div className="mt-4 space-y-2">
                  {/* Hidden anchor — the only reliable way to trigger upi:// deep links */}
                  <a
                    ref={upiAnchorRef}
                    href={billing.upiLink}
                    className="hidden"
                    aria-hidden="true"
                  />

                  {/* Visible PAY button */}
                  <button
                    onClick={handlePay}
                    className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    💳 PAY {formatCurrency(billing.totalAmount - (billing.payment?.amountPaid || 0))}
                  </button>

                  {/* Desktop fallback: show UPI ID + copy */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="text-xs text-gray-400">UPI:</span>
                    <span className="text-xs font-mono text-gray-600">
                      {billing.upiLink.match(/pa=([^&]+)/)?.[1]}
                    </span>
                    <button
                      onClick={handleCopyUpi}
                      className="text-xs text-green-600 hover:text-green-800 font-medium"
                    >
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-center text-gray-400">
                    On mobile: tap PAY to open your UPI app · On desktop: copy UPI ID
                  </p>
                </div>
              )}

              {!billing.upiLink && billing.payment?.status !== 'PAID' && (
                <p className="text-xs text-center text-gray-400 mt-4">
                  Payment link not available. Please contact your milk seller.
                </p>
              )}
            </div>

            {/* Daily hisab */}
            {billing.dailyEntries?.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800">Daily Hisab</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{billing.dailyEntries.length} entries</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {billing.dailyEntries.map((entry) => (
                    <div
                      key={entry.day}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-xs font-bold text-green-700">
                          {String(entry.day).padStart(2, '0')}
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatShortDate(entry.day, month, year)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${entry.quantity === 0 ? 'text-gray-300' : 'text-gray-800'}`}>
                          {entry.quantity === 0 ? '— L' : `${entry.quantity} L`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-sm font-bold text-green-700">{billing.totalMilk} L</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">🥛</p>
                <p className="text-sm">No milk entries for this month.</p>
              </div>
            )}

            {/* Business name */}
            {billing.businessName && (
              <p className="text-center text-xs text-gray-400 mt-6">
                {billing.businessName}
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
