import { useEffect, useState } from 'react';
import { paymentsAPI } from '../services/api';
import { MONTHS, getYears, formatCurrency, getToday } from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_OPTIONS = ['UNPAID', 'PARTIALLY_PAID', 'PAID'];

const StatusBadge = ({ status }) => {
  if (status === 'PAID') return <span className="badge-paid">Paid</span>;
  if (status === 'PARTIALLY_PAID') return <span className="badge-partial">Partial</span>;
  return <span className="badge-unpaid">Unpaid</span>;
};

export default function PaymentsPage() {
  const today = getToday();
  const [month, setMonth] = useState(today.month);
  const [year, setYear] = useState(today.year);
  const [statusFilter, setStatusFilter] = useState('');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await paymentsAPI.getAll({ month, year, status: statusFilter || undefined });
      setPayments(res.data.data.payments);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [month, year, statusFilter]);

  const handleStatusChange = async (payment, newStatus) => {
    setUpdatingId(payment._id);
    try {
      await paymentsAPI.updateStatus(payment._id, {
        status: newStatus,
        ...(newStatus === 'PAID' && { amountPaid: payment.totalAmount }),
      });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalAmount = payments.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalPaid   = payments.reduce((s, p) => s + (p.amountPaid || 0), 0);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">Payments</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monthly payment tracking</p>
      </div>

      {/* Filters — horizontally scrollable on mobile */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          className="form-input py-2 flex-shrink-0"
        >
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="form-input py-2 w-24 flex-shrink-0"
        >
          {getYears().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input py-2 flex-shrink-0"
        >
          <option value="">All</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIALLY_PAID">Partial</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-sm font-bold text-gray-800">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">Collected</p>
          <p className="text-sm font-bold text-green-700">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-sm font-bold text-red-600">{formatCurrency(totalAmount - totalPaid)}</p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : payments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💰</p>
          <p className="font-medium text-gray-600">No payment records</p>
          <p className="text-sm mt-1">No payments found for this period.</p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="space-y-2 md:hidden">
            {payments.map((payment) => (
              <div key={payment._id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{payment.customerId?.name}</p>
                    <p className="text-xs text-gray-400">{payment.customerId?.phone}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="text-gray-600">{payment.totalMilk} L</span>
                      <span className="font-medium text-gray-800">{formatCurrency(payment.totalAmount)}</span>
                      {payment.amountPaid > 0 && (
                        <span className="text-green-600 text-xs">Paid: {formatCurrency(payment.amountPaid)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={payment.status} />
                    <select
                      value={payment.status}
                      disabled={updatingId === payment._id}
                      onChange={(e) => handleStatusChange(payment, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Milk (L)</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Paid</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{payment.customerId?.name}</p>
                        <p className="text-xs text-gray-400">{payment.customerId?.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{payment.totalMilk} L</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{formatCurrency(payment.totalAmount)}</td>
                    <td className="px-4 py-3 text-right text-green-700">{payment.amountPaid > 0 ? formatCurrency(payment.amountPaid) : '—'}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={payment.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={payment.status}
                          disabled={updatingId === payment._id}
                          onChange={(e) => handleStatusChange(payment, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
