import { useState, useCallback, useRef, useEffect } from 'react';
import { milkAPI, windowsAPI } from '../../services/api';
import EditableCell from './EditableCell';
import QuickEditModal from './QuickEditModal';
import CustomerAnalyticsModal from '../customers/CustomerAnalyticsModal';
import LoadingSpinner from '../../components/LoadingSpinner';

import {
  getDaysInMonth,
  getDayOfWeek,
  isToday,
  isWeekend,
  getMonthName,
  MONTHS,
  getYears,
  formatCurrency,
  formatQuantity,
  getToday,
} from '../../utils/dateUtils';

const ZOOM_LEVELS = [0.75, 0.9, 1.0, 1.1, 1.25];
const ZOOM_LABELS = ['75%', '90%', '100%', '110%', '125%'];

export default function MonthlyRegister() {
  const today = getToday();
  const [month, setMonth] = useState(today.month);
  const [year, setYear] = useState(today.year);
  const [search, setSearch] = useState('');
  const [windowFilter, setWindowFilter] = useState('');
  const [windows, setWindows] = useState([]);
  const [zoomIndex, setZoomIndex] = useState(2); // default 100%
  const zoom = ZOOM_LEVELS[zoomIndex];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data: array of { customer, entries: { [day]: entry }, totalMilk, totalAmount }
  const [registerData, setRegisterData] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState(31);

  // Selected / editing cell: { customerId, day }
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [analyticsCustomer, setAnalyticsCustomer] = useState(null);

  
  // Track window size for mobile quick edit modal vs desktop inline edit
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  const tableRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Build customer index for navigation
  const customerIds = registerData.map((r) => r.customer._id.toString());

  // Load windows
  useEffect(() => {
    windowsAPI.getAll()
      .then((res) => setWindows(res.data.data.windows || []))
      .catch(() => {});
  }, []);

  // Load monthly data
  useEffect(() => {
    loadData();
  }, [month, year, windowFilter]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { month, year };
      if (windowFilter) params.windowId = windowFilter;
      const res = await milkAPI.getMonthly(params);
      const { data, daysInMonth: days } = res.data.data;
      setRegisterData(data);
      setDaysInMonth(days);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load register data.');
    } finally {
      setLoading(false);
    }
  };

  // Optimistic update for a cell value
  const handleValueChange = useCallback((customerId, day, entry) => {
    setRegisterData((prev) =>
      prev.map((row) => {
        if (row.customer._id.toString() !== customerId.toString()) return row;

        const newEntries = { ...row.entries };
        if (entry === null) {
          delete newEntries[day];
        } else {
          newEntries[day] = entry;
        }

        // Recalculate totals
        let totalMilk = 0;
        let totalAmount = 0;
        for (const d in newEntries) {
          const e = newEntries[d];
          totalMilk += e.quantity || 0;
          totalAmount += (e.quantity || 0) * (e.rateAtTimeOfEntry || 0);
        }

        return {
          ...row,
          entries: newEntries,
          totalMilk: parseFloat(totalMilk.toFixed(2)),
          totalAmount: parseFloat(totalAmount.toFixed(2)),
        };
      })
    );
  }, []);

  // Cell navigation between cells
  const handleNavigate = useCallback((customerId, day, direction) => {
    const cidStr = customerId.toString();
    const cidIndex = customerIds.indexOf(cidStr);

    let newCidIndex = cidIndex;
    let newDay = day;

    switch (direction) {
      case 'down':
        newCidIndex = Math.min(cidIndex + 1, customerIds.length - 1);
        break;
      case 'up':
        newCidIndex = Math.max(cidIndex - 1, 0);
        break;
      case 'right':
        newDay = Math.min(day + 1, daysInMonth);
        break;
      case 'left':
        newDay = Math.max(day - 1, 1);
        break;
    }

    const newCid = customerIds[newCidIndex];
    setSelected({ customerId: newCid, day: newDay });
    setEditing({ customerId: newCid, day: newDay });
  }, [customerIds, daysInMonth]);

  // Filtered rows
  const filteredData = search
    ? registerData.filter(
        (row) =>
          row.customer.name.toLowerCase().includes(search.toLowerCase()) ||
          row.customer.phone?.includes(search)
      )
    : registerData;

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const years = getYears(2020, 2030);

  // Column totals (sum of each day across all customers)
  const dayTotals = {};
  for (const day of days) {
    dayTotals[day] = 0;
    for (const row of filteredData) {
      const entry = row.entries[day];
      if (entry) dayTotals[day] += entry.quantity || 0;
    }
  }

  // Active editing row for QuickEditModal
  const activeEditingRow = editing
    ? registerData.find((r) => r.customer._id.toString() === editing.customerId.toString())
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-base font-bold text-gray-800 mr-1 hidden sm:block">Monthly Register</h1>

          {/* Month selector */}
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="form-input py-1.5 pr-8 text-sm flex-1 sm:flex-none sm:w-auto"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="form-input py-1.5 w-20 sm:w-auto text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Window filter */}
          <select
            value={windowFilter}
            onChange={(e) => setWindowFilter(e.target.value)}
            className="form-input py-1.5 text-sm hidden xs:block sm:block flex-1 sm:flex-none sm:w-auto"
          >
            <option value="">All Windows</option>
            {windows.map((w) => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>

          {/* Search */}
          <div className="flex-1 min-w-0 sm:min-w-32 sm:max-w-56">
            <input
              type="text"
              className="form-input py-1.5 text-sm w-full"
              placeholder="🔍 Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 sm:flex-none" />

          {/* Zoom controls — hide on mobile */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setZoomIndex((z) => Math.max(z - 1, 0))}
              disabled={zoomIndex === 0}
              className="px-2 py-1 text-xs rounded hover:bg-white disabled:opacity-40 transition-colors"
              title="Zoom out"
            >
              −
            </button>
            <span className="text-xs font-medium px-2 min-w-10 text-center">
              {ZOOM_LABELS[zoomIndex]}
            </span>
            <button
              onClick={() => setZoomIndex((z) => Math.min(z + 1, ZOOM_LEVELS.length - 1))}
              disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              className="px-2 py-1 text-xs rounded hover:bg-white disabled:opacity-40 transition-colors"
              title="Zoom in"
            >
              +
            </button>
          </div>

          {/* Refresh */}
          <button onClick={loadData} className="btn-secondary py-1.5 text-xs" title="Refresh data">
            ↻ <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Register area */}
      <div className="flex-1 overflow-hidden p-4">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium text-gray-600">No customers found</p>
            <p className="text-sm mt-1">Add customers first, then they&apos;ll appear here.</p>
          </div>
        ) : (
          <div
            className="register-wrapper h-full"
            style={{
              '--register-font-size': `${Math.round(13 * zoom)}px`,
              '--register-cell-width': `${Math.round(48 * zoom)}px`,
              '--register-cell-height': `${Math.round(36 * zoom)}px`,
              '--register-name-width': `${Math.round(160 * zoom)}px`,
            }}
          >
            <table className="register-table" ref={tableRef}>
              <thead>
                {/* Month / Title row */}
                <tr className="row-header">
                  <th className="col-name" style={{ fontSize: `${Math.round(13 * zoom)}px` }}>
                    <span className="text-gray-600 font-semibold">
                      {getMonthName(month)} {year}
                    </span>
                  </th>
                  {days.map((day) => {
                    const isTodayDay = isToday(day, month, year);
                    const isWknd = isWeekend(day, month, year);
                    return (
                      <th
                        key={day}
                        className={`col-day ${isTodayDay ? 'today-col' : ''} ${isWknd ? 'weekend-col' : ''}`}
                        style={{ fontSize: `${Math.round(11 * zoom)}px` }}
                      >
                        <div className="flex flex-col items-center leading-tight py-0.5">
                          <span className="font-semibold">{String(day).padStart(2, '0')}</span>
                          <span className="text-gray-400" style={{ fontSize: `${Math.round(9 * zoom)}px` }}>
                            {getDayOfWeek(day, month, year)}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="col-total" style={{ fontSize: `${Math.round(11 * zoom)}px` }}>Total L</th>
                  <th className="col-amount" style={{ fontSize: `${Math.round(11 * zoom)}px` }}>Amount</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((row) => {
                  const cid = row.customer._id.toString();
                  return (
                    <tr key={cid}>
                      {/* Customer name column */}
                      <td
                        className="col-name hover:bg-green-50/80 cursor-pointer transition-colors"
                        style={{ fontSize: `${Math.round(13 * zoom)}px` }}
                        title={`Click for analytics · ${row.customer.name} (${row.customer.phone})`}
                        onClick={() => setAnalyticsCustomer(row.customer)}
                      >
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium text-gray-800 hover:text-green-600 truncate flex items-center gap-1" style={{ maxWidth: `${Math.round(145 * zoom)}px` }}>
                            {row.customer.name}
                            <span className="text-[10px] text-gray-400">📊</span>
                          </span>
                          {row.customer.windowId && (
                            <span className="text-gray-400" style={{ fontSize: `${Math.round(9 * zoom)}px` }}>
                              {row.customer.windowId.name}
                            </span>
                          )}
                        </div>
                      </td>


                      {/* Day cells */}
                      {days.map((day) => {
                        const isSelectedCell =
                          selected?.customerId === cid && selected?.day === day;
                        const isEditingCell =
                          !isMobile && editing?.customerId === cid && editing?.day === day;
                        return (
                          <EditableCell
                            key={day}
                            customerId={cid}
                            customerName={row.customer.name}
                            day={day}
                            month={month}
                            year={year}
                            entry={row.entries[day]}
                            isSelected={isSelectedCell}
                            isEditing={isEditingCell}
                            onSelect={(cId, d) => setSelected({ customerId: cId, day: d })}
                            onStartEdit={(cId, d) => {
                              setSelected({ customerId: cId, day: d });
                              setEditing({ customerId: cId, day: d });
                            }}
                            onStopEdit={() => setEditing(null)}
                            onValueChange={handleValueChange}
                            onNavigate={handleNavigate}
                            zoom={zoom}
                          />
                        );
                      })}

                      {/* Total milk */}
                      <td
                        className="col-total"
                        style={{ fontSize: `${Math.round(13 * zoom)}px`, color: row.totalMilk > 0 ? '#15803d' : '#9ca3af' }}
                      >
                        {row.totalMilk > 0 ? `${formatQuantity(row.totalMilk)} L` : '—'}
                      </td>

                      {/* Amount */}
                      <td
                        className="col-amount"
                        style={{ fontSize: `${Math.round(12 * zoom)}px`, color: row.totalAmount > 0 ? '#1d4ed8' : '#9ca3af' }}
                      >
                        {row.totalAmount > 0 ? formatCurrency(row.totalAmount) : '—'}
                      </td>
                    </tr>
                  );
                })}

                {/* Day totals row */}
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td
                    className="col-name font-semibold text-gray-700"
                    style={{ fontSize: `${Math.round(12 * zoom)}px` }}
                  >
                    Day Total
                  </td>
                  {days.map((day) => (
                    <td
                      key={day}
                      className={`col-day font-semibold ${isToday(day, month, year) ? 'today-col' : ''}`}
                      style={{ fontSize: `${Math.round(11 * zoom)}px`, color: dayTotals[day] > 0 ? '#374151' : '#d1d5db' }}
                    >
                      {dayTotals[day] > 0 ? formatQuantity(dayTotals[day]) : ''}
                    </td>
                  ))}
                  <td className="col-total font-bold text-green-700" style={{ fontSize: `${Math.round(13 * zoom)}px` }}>
                    {formatQuantity(filteredData.reduce((s, r) => s + r.totalMilk, 0))} L
                  </td>
                  <td className="col-amount font-bold text-blue-700" style={{ fontSize: `${Math.round(12 * zoom)}px` }}>
                    {formatCurrency(filteredData.reduce((s, r) => s + r.totalAmount, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Quick Edit Modal */}
      {isMobile && editing && activeEditingRow && (
        <QuickEditModal
          customerId={editing.customerId}
          customerName={activeEditingRow.customer.name}
          day={editing.day}
          month={month}
          year={year}
          entry={activeEditingRow.entries[editing.day]}
          onClose={() => setEditing(null)}
          onValueChange={handleValueChange}
          onNavigate={handleNavigate}
          totalCustomers={filteredData.length}
          customerIndex={customerIds.indexOf(editing.customerId.toString())}
        />
      )}

      {/* Customer Analytics & Detail Modal */}
      {analyticsCustomer && (
        <CustomerAnalyticsModal
          customer={analyticsCustomer}
          windows={windows}
          onClose={() => setAnalyticsCustomer(null)}
          onUpdated={loadData}
        />
      )}

      {/* Status bar */}

      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-3 sm:px-4 py-1.5 flex items-center gap-3 text-xs text-gray-500 overflow-x-auto">
        <span>{filteredData.length} customers</span>
        <span>·</span>
        <span className="hidden sm:inline">{getMonthName(month)} {year}</span>
        <span className="hidden sm:inline">·</span>
        <span>
          Total:{' '}
          <strong className="text-green-700">
            {formatQuantity(filteredData.reduce((s, r) => s + r.totalMilk, 0))} L
          </strong>
        </span>
        <span>·</span>
        <span>
          Revenue:{' '}
          <strong className="text-blue-700">
            {formatCurrency(filteredData.reduce((s, r) => s + r.totalAmount, 0))}
          </strong>
        </span>
        <span className="flex-1" />
        <span className="text-gray-400 hidden lg:inline">Click cell to edit · Enter/Tab to move · Arrow keys to navigate</span>
      </div>
    </div>
  );
}
