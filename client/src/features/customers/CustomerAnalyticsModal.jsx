import { useEffect, useState } from 'react';
import { customersAPI, billingAPI, milkAPI, paymentsAPI } from '../../services/api';
import { MONTHS, getYears, formatCurrency, formatQuantity, getToday, getMonthName } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CustomerAnalyticsModal({
  customer: initialCustomer,
  customerId,
  windows = [],
  onClose,
  onUpdated,
}) {
  const today = getToday();
  const [month, setMonth] = useState(today.month);
  const [year, setYear] = useState(today.year);

  const [customer, setCustomer] = useState(initialCustomer || null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);

  // Edit profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    milkRate: 60,
    windowId: '',
    notes: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [copied, setCopied] = useState(false);

  // Editing a specific day entry
  const [editingDay, setEditingDay] = useState(null);
  const [dayQty, setDayQty] = useState('');
  const [savingDay, setSavingDay] = useState(false);

  // Quick Payment Mark feature
  const [payStatus, setPayStatus] = useState('PAID');
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Quick Note feature
  const [quickNote, setQuickNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSavedMsg, setNoteSavedMsg] = useState(false);

  // Fetch full details & billing analytics
  useEffect(() => {
    loadData();
  }, [customerId, initialCustomer?._id, month, year]);

  const loadData = async () => {
    const targetId = customerId || initialCustomer?._id;
    if (!targetId) return;

    setLoading(true);
    try {
      const [custRes, billRes] = await Promise.all([
        customersAPI.getById(targetId),
        billingAPI.getCustomerBilling(targetId, { month, year }),
      ]);

      const fetchedCustomer = custRes.data.data.customer;
      const bData = billRes.data.data;
      setCustomer(fetchedCustomer);
      setBilling(bData);
      setQuickNote(fetchedCustomer.notes || '');

      setPayStatus(bData.payment?.status || 'PAID');
      setAmountPaidInput(bData.payment?.amountPaid ?? bData.totalAmount ?? 0);

      setProfileForm({
        name: fetchedCustomer.name || '',
        phone: fetchedCustomer.phone || '',
        address: fetchedCustomer.address || '',
        milkRate: fetchedCustomer.milkRate || 60,
        windowId: fetchedCustomer.windowId?._id || fetchedCustomer.windowId || '',
        notes: fetchedCustomer.notes || '',
      });
    } catch (err) {
      console.error('Failed to load customer analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save Payment status & Amount paid
  const handleSavePayment = async () => {
    if (!billing) return;
    setSavingPayment(true);
    try {
      let paymentRecord = billing.payment;
      if (!paymentRecord?._id) {
        // Create payment record first
        const createRes = await paymentsAPI.create({
          customerId: customer._id,
          month,
          year,
        });
        paymentRecord = createRes.data.data.payment;
      }

      const amt = payStatus === 'PAID'
        ? (billing.totalAmount || 0)
        : parseFloat(amountPaidInput || 0);

      await paymentsAPI.updateStatus(paymentRecord._id, {
        status: payStatus,
        amountPaid: amt,
      });

      if (onUpdated) onUpdated();
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update payment record.');
    } finally {
      setSavingPayment(false);
    }
  };

  // Save Quick Note
  const handleSaveQuickNote = async (e) => {
    e?.preventDefault();
    if (!customer) return;
    setSavingNote(true);
    try {
      const res = await customersAPI.update(customer._id, { notes: quickNote });
      setCustomer(res.data.data.customer);
      setNoteSavedMsg(true);
      setTimeout(() => setNoteSavedMsg(false), 2000);
      if (onUpdated) onUpdated();
    } catch (err) {
      alert('Failed to save note.');
    } finally {
      setSavingNote(false);
    }
  };

  // Save Profile edits
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    try {
      const targetId = customer._id;
      const res = await customersAPI.update(targetId, profileForm);
      setCustomer(res.data.data.customer);
      setEditingProfile(false);
      if (onUpdated) onUpdated();
      loadData();
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update customer profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Save day milk entry
  const handleSaveDayEntry = async (dayNum) => {
    if (!dayQty && dayQty !== '0' && dayQty !== 0) return;

    setSavingDay(true);
    try {
      const targetId = customer._id;
      const val = parseFloat(dayQty);
      if (isNaN(val) || val <= 0) {
        const existing = billing.dailyEntries.find((d) => d.day === dayNum);
        if (existing?.quantity > 0) {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          await milkAPI.upsert({ customerId: targetId, date: dateStr, quantity: 0 });
        }
      } else {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        await milkAPI.upsert({ customerId: targetId, date: dateStr, quantity: val });
      }
      setEditingDay(null);
      if (onUpdated) onUpdated();
      loadData();
    } catch (err) {
      console.error('Failed to save day entry:', err);
    } finally {
      setSavingDay(false);
    }
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    if (!customer || !billing) return;
    const mName = getMonthName(month);
    const text = `🥛 *DairyKhata Milk Bill*\n` +
      `Customer: *${customer.name}*\n` +
      `Month: *${mName} ${year}*\n\n` +
      `Total Milk: *${billing.totalMilk} L*\n` +
      `Rate: *₹${billing.currentRate}/L*\n` +
      `Total Amount: *${formatCurrency(billing.totalAmount)}*\n` +
      `Status: *${billing.payment?.status || 'UNPAID'}*\n\n` +
      (billing.upiLink ? `Pay via UPI: ${billing.upiLink}\n\n` : '') +
      `Thank you!`;

    const encoded = encodeURIComponent(text);
    const phone = customer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/91${phone}?text=${encoded}`, '_blank');
  };

  const handleCopySummary = () => {
    if (!customer || !billing) return;
    const mName = getMonthName(month);
    const text = `DairyKhata Bill - ${customer.name} (${mName} ${year}): Total ${billing.totalMilk}L @ ₹${billing.currentRate}/L = ${formatCurrency(billing.totalAmount)}. Status: ${billing.payment?.status || 'UNPAID'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!customer) return null;

  const activeDays = billing?.dailyEntries?.filter((d) => d.quantity > 0).length || 0;
  const avgDailyMilk = activeDays > 0 ? (billing.totalMilk / activeDays).toFixed(1) : 0;
  const windowObj = windows.find((w) => w._id === (customer.windowId?._id || customer.windowId));

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-700 p-5 text-white flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white font-bold text-xl shadow-inner border border-white/20">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">{customer.name}</h2>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${customer.active ? 'bg-green-400/30 text-green-100 border border-green-300/30' : 'bg-red-400/30 text-red-100'}`}>
                    {customer.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-green-100 mt-1">
                  <span>📞 {customer.phone}</span>
                  <span>· ₹{customer.milkRate}/L</span>
                  {windowObj && <span>· 🪟 {windowObj.name}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingProfile((v) => !v)}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold backdrop-blur-xs transition-all border border-white/20"
              >
                {editingProfile ? 'View Analytics' : '✏️ Edit Profile'}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Action buttons bar */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15 text-xs overflow-x-auto">
            <a
              href={`tel:${customer.phone}`}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5 transition-colors"
            >
              📞 Call
            </a>
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              💬 WhatsApp Bill
            </button>
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? '✓ Copied' : '📋 Copy Bill'}
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 pb-8 sm:pb-5">
          
          {editingProfile ? (
            /* ── EDIT PROFILE FORM ── */
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Edit Customer Details</h3>
              
              {profileError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200">
                  {profileError}
                </div>
              )}

              <div>
                <label className="form-label">Full Name *</label>
                <input
                  className="form-input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Phone Number *</label>
                  <input
                    className="form-input"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Milk Rate (₹/L) *</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.5"
                    min="0"
                    value={profileForm.milkRate}
                    onChange={(e) => setProfileForm({ ...profileForm, milkRate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Address</label>
                <input
                  className="form-input"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Delivery Window / Route</label>
                  <select
                    className="form-input"
                    value={profileForm.windowId}
                    onChange={(e) => setProfileForm({ ...profileForm, windowId: e.target.value })}
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
                    value={profileForm.notes}
                    onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary flex-1 justify-center"
                >
                  {savingProfile ? 'Saving...' : '💾 Save Profile'}
                </button>
              </div>
            </form>
          ) : (
            /* ── ANALYTICS & QUICK ACTIONS VIEW ── */
            <>
              {/* Period selector */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Analytics Period</span>
                <div className="flex gap-2">
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="form-input py-1 px-3 text-xs w-auto bg-white"
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="form-input py-1 px-3 text-xs w-auto bg-white"
                  >
                    {getYears().map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <LoadingSpinner />
              ) : billing ? (
                <>
                  {/* KPI Analytics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-green-50/60 border border-green-100 rounded-xl p-3">
                      <p className="text-[11px] font-semibold text-green-700 uppercase">Total Milk</p>
                      <p className="text-2xl font-bold text-green-800 mt-0.5">{billing.totalMilk} <span className="text-sm font-normal text-green-600">L</span></p>
                      <p className="text-[10px] text-green-600 mt-0.5">{activeDays} active days</p>
                    </div>

                    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3">
                      <p className="text-[11px] font-semibold text-blue-700 uppercase">Total Bill</p>
                      <p className="text-2xl font-bold text-blue-800 mt-0.5">{formatCurrency(billing.totalAmount)}</p>
                      <p className="text-[10px] text-blue-600 mt-0.5">Rate: ₹{billing.currentRate}/L</p>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
                      <p className="text-[11px] font-semibold text-amber-700 uppercase">Daily Avg</p>
                      <p className="text-2xl font-bold text-amber-800 mt-0.5">{avgDailyMilk} <span className="text-sm font-normal text-amber-600">L</span></p>
                      <p className="text-[10px] text-amber-600 mt-0.5">per active day</p>
                    </div>

                    <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3">
                      <p className="text-[11px] font-semibold text-purple-700 uppercase">Status</p>
                      <p className="text-sm font-bold text-purple-900 mt-1">{billing.payment?.status || 'UNPAID'}</p>
                      <p className="text-[10px] text-purple-600 mt-0.5">Paid: {formatCurrency(billing.payment?.amountPaid || 0)}</p>
                    </div>
                  </div>

                  {/* ── MARK PAYMENT / RECORD AMOUNT PAID FEATURE ── */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50/60 p-4 rounded-2xl border border-purple-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                        💳 Mark Payment & Received Amount
                      </h3>
                      {billing.payment?.status === 'PAID' && (
                        <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                          ✅ FULLY PAID
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                      <div>
                        <label className="text-[11px] font-medium text-gray-600 block mb-1">Status</label>
                        <select
                          value={payStatus}
                          onChange={(e) => {
                            const newSt = e.target.value;
                            setPayStatus(newSt);
                            if (newSt === 'PAID') {
                              setAmountPaidInput(billing.totalAmount || 0);
                            }
                          }}
                          className="form-input py-1.5 text-xs bg-white"
                        >
                          <option value="UNPAID">❌ Unpaid</option>
                          <option value="PARTIALLY_PAID">⏳ Partially Paid</option>
                          <option value="PAID">✅ Paid in Full</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-gray-600 block mb-1">Amount Received (₹)</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={amountPaidInput}
                            disabled={payStatus === 'PAID'}
                            onChange={(e) => setAmountPaidInput(e.target.value)}
                            placeholder="0"
                            className="form-input py-1.5 text-xs bg-white pr-14"
                          />
                          {payStatus !== 'PAID' && (
                            <button
                              type="button"
                              onClick={() => setAmountPaidInput(billing.totalAmount || 0)}
                              className="absolute right-1 top-1 bottom-1 text-[10px] bg-purple-100 text-purple-700 px-2 rounded font-semibold hover:bg-purple-200"
                            >
                              Full
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={handleSavePayment}
                          disabled={savingPayment}
                          className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-xs"
                        >
                          {savingPayment ? 'Saving...' : '💾 Save Payment'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── QUICK NOTE FEATURE ── */}
                  <form onSubmit={handleSaveQuickNote} className="bg-yellow-50/70 p-3.5 rounded-2xl border border-yellow-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-yellow-900 flex items-center gap-1.5">
                        📌 Quick Note for Customer
                      </label>
                      {noteSavedMsg && (
                        <span className="text-[10px] text-green-700 font-bold animate-fade-in">
                          ✓ Note Saved!
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={quickNote}
                        onChange={(e) => setQuickNote(e.target.value)}
                        placeholder="e.g. Always leaves cash under bottle, takes 2L on Sundays..."
                        className="form-input py-1.5 text-xs bg-white flex-1"
                      />
                      <button
                        type="submit"
                        disabled={savingNote}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-xs"
                      >
                        {savingNote ? '...' : 'Save'}
                      </button>
                    </div>
                  </form>

                  {/* Daily Entries Grid & Quick Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Daily Consumption ({getMonthName(month)} {year})
                      </h3>
                      <span className="text-[10px] text-gray-400">Click any day to edit</span>
                    </div>

                    <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      {billing.dailyEntries?.map((entry) => {
                        const isSelected = editingDay === entry.day;
                        const hasVal = entry.quantity > 0;
                        return (
                          <div
                            key={entry.day}
                            onClick={() => {
                              setEditingDay(entry.day);
                              setDayQty(entry.quantity > 0 ? entry.quantity : '');
                            }}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-green-600 text-white border-green-700 shadow-md scale-105 z-10'
                                : hasVal
                                ? 'bg-white text-gray-800 border-green-200 hover:border-green-400 hover:shadow-xs'
                                : 'bg-white/40 text-gray-300 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="text-[10px] opacity-70 font-semibold">{String(entry.day).padStart(2, '0')}</span>
                            <span className="text-xs font-bold mt-0.5">
                              {hasVal ? `${entry.quantity}` : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inline Day Quantity Editor when a day box is tapped */}
                  {editingDay && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-green-900">
                          Edit Entry for Day {editingDay} ({getMonthName(month)} {editingDay}, {year})
                        </span>
                        <button
                          onClick={() => setEditingDay(null)}
                          className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={dayQty}
                          onChange={(e) => setDayQty(e.target.value)}
                          placeholder="Quantity in Liters (e.g. 1.5)"
                          autoFocus
                          className="form-input flex-1 py-2 text-sm bg-white"
                        />
                        <button
                          onClick={() => handleSaveDayEntry(editingDay)}
                          disabled={savingDay}
                          className="btn-primary py-2 px-4 text-xs font-bold shadow-xs"
                        >
                          {savingDay ? 'Saving...' : 'Save Entry'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
