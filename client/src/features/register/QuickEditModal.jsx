import { useState, useEffect } from 'react';
import { milkAPI } from '../../services/api';
import { getMonthName, getDayOfWeek, formatQuantity } from '../../utils/dateUtils';

const QUICK_PRESETS = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

export default function QuickEditModal({
  customerId,
  customerName,
  day,
  month,
  year,
  entry,
  onClose,
  onValueChange,
  onNavigate,
  totalCustomers,
  customerIndex,
}) {
  const currentValue = entry?.quantity ?? 0;
  const [val, setVal] = useState(currentValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setVal(entry?.quantity ?? 0);
  }, [entry, customerId, day]);

  const handleSave = async (targetValue) => {
    const finalVal = targetValue !== undefined ? targetValue : val;
    const numericVal = parseFloat(finalVal);

    if (isNaN(numericVal) || numericVal < 0) return;

    setSaving(true);
    try {
      if (numericVal === 0) {
        if (entry?._id) {
          await milkAPI.delete(entry._id);
          onValueChange(customerId, day, null);
        }
      } else {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const res = await milkAPI.upsert({ customerId, date: dateStr, quantity: numericVal });
        onValueChange(customerId, day, res.data.data.entry);
      }
    } catch (err) {
      console.error('Failed to save milk entry:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePresetClick = async (preset) => {
    setVal(preset);
    await handleSave(preset);
  };

  const handleStepper = async (delta) => {
    const newVal = Math.max(0, parseFloat(((val || 0) + delta).toFixed(2)));
    setVal(newVal);
    await handleSave(newVal);
  };

  const handleNextCustomer = async () => {
    await handleSave();
    onNavigate(customerId, day, 'down');
  };

  const handlePrevCustomer = async () => {
    await handleSave();
    onNavigate(customerId, day, 'up');
  };

  const handleNextDay = async () => {
    await handleSave();
    onNavigate(customerId, day, 'right');
  };

  const handlePrevDay = async () => {
    await handleSave();
    onNavigate(customerId, day, 'left');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-200 font-medium uppercase tracking-wider">
                {String(day).padStart(2, '0')} {getMonthName(month).slice(0, 3)} {year} ({getDayOfWeek(day, month, year)})
              </p>
              <h2 className="text-lg font-bold truncate max-w-[260px]">{customerName}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          
          {/* Main Quantity Stepper */}
          <div className="flex items-center justify-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <button
              onClick={() => handleStepper(-0.5)}
              disabled={val <= 0 || saving}
              className="w-12 h-12 rounded-xl bg-white border border-gray-200 text-gray-700 text-xl font-bold hover:bg-gray-100 disabled:opacity-30 active:scale-95 transition-all shadow-xs flex items-center justify-center"
            >
              −
            </button>

            <div className="text-center min-w-28">
              <input
                type="number"
                step="0.5"
                min="0"
                value={val === 0 ? '' : val}
                placeholder="0"
                onChange={(e) => setVal(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                onBlur={() => handleSave(val)}
                className="w-full text-center text-3xl font-bold text-gray-800 bg-transparent outline-none focus:text-green-600"
              />
              <span className="text-xs font-semibold text-gray-400 block mt-0.5">LITERS</span>
            </div>

            <button
              onClick={() => handleStepper(0.5)}
              disabled={saving}
              className="w-12 h-12 rounded-xl bg-green-600 text-white text-xl font-bold hover:bg-green-700 active:scale-95 transition-all shadow-sm flex items-center justify-center"
            >
              +
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Presets</p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_PRESETS.map((preset) => {
                const isActive = val === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => handlePresetClick(preset)}
                    disabled={saving}
                    className={`py-2.5 px-2 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                      isActive
                        ? 'bg-green-600 text-white shadow-md'
                        : preset === 0
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100'
                    }`}
                  >
                    {preset === 0 ? 'Clear (0)' : `${preset} L`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls (Prev / Next) */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                onClick={handlePrevCustomer}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                ▲ Prev
              </button>
              <button
                onClick={handleNextCustomer}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                ▼ Next
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-1">
              <button
                onClick={handlePrevDay}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                ◀ Day {day > 1 ? day - 1 : day}
              </button>
              <button
                onClick={handleNextDay}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                Day {day < 31 ? day + 1 : day} ▶
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
