import { useState, useRef, useCallback, useEffect } from 'react';
import { milkAPI } from '../../services/api';
import { getDaysInMonth, isToday, isWeekend, getDayOfWeek, formatQuantity } from '../../utils/dateUtils';

/**
 * EditableCell — a single cell in the monthly register.
 * Handles click to edit, keyboard navigation, blur to save.
 */
export default function EditableCell({
  customerId,
  customerName,
  day,
  month,
  year,
  entry,
  isSelected,
  isEditing,
  onSelect,
  onStartEdit,
  onStopEdit,
  onValueChange,
  onNavigate,
  zoom,
}) {
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const currentValue = entry?.quantity;
  const displayValue = formatQuantity(currentValue);
  const isEmpty = currentValue === undefined || currentValue === null || currentValue === 0;
  const isWeekendDay = isWeekend(day, month, year);
  const isTodayDay = isToday(day, month, year);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.value = currentValue !== undefined && currentValue !== null
        ? formatQuantity(currentValue)
        : '';
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const saveValue = useCallback(async (raw) => {
    const val = raw === '' ? null : parseFloat(raw);

    if (raw !== '' && (isNaN(val) || val < 0)) {
      onStopEdit();
      return;
    }

    // No change — skip API call
    const noChange = (val === null && (currentValue === undefined || currentValue === null))
      || val === currentValue;
    if (noChange) {
      onStopEdit();
      return;
    }

    setSaving(true);
    try {
      if (val === null || val === 0) {
        // Clear: if entry exists, delete it (or set 0)
        if (entry?._id) {
          await milkAPI.delete(entry._id);
          onValueChange(customerId, day, null);
        }
      } else {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const res = await milkAPI.upsert({ customerId, date: dateStr, quantity: val });
        onValueChange(customerId, day, res.data.data.entry);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
      onStopEdit();
    }
  }, [customerId, day, month, year, currentValue, entry]);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        saveValue(inputRef.current?.value ?? '');
        onNavigate(customerId, day, 'down');
        break;
      case 'Tab':
        e.preventDefault();
        saveValue(inputRef.current?.value ?? '');
        onNavigate(customerId, day, e.shiftKey ? 'up' : 'down');
        break;
      case 'Escape':
        onStopEdit();
        break;
      case 'ArrowUp':
        if (!isEditing) { e.preventDefault(); onNavigate(customerId, day, 'up'); }
        break;
      case 'ArrowDown':
        if (!isEditing) { e.preventDefault(); onNavigate(customerId, day, 'down'); }
        break;
      case 'ArrowLeft':
        if (!isEditing) { e.preventDefault(); onNavigate(customerId, day, 'left'); }
        break;
      case 'ArrowRight':
        if (!isEditing) { e.preventDefault(); onNavigate(customerId, day, 'right'); }
        break;
      default:
        break;
    }
  };

  const handleCellClick = () => {
    onSelect(customerId, day);
    onStartEdit(customerId, day);
  };

  const handleBlur = () => {
    if (isEditing && inputRef.current) {
      saveValue(inputRef.current.value);
    }
  };

  const cellClasses = [
    'col-day',
    isTodayDay ? 'today-col' : '',
    isWeekendDay ? 'weekend-col' : '',
    isSelected ? 'selected-cell' : '',
    isEmpty ? 'empty-cell' : 'has-value',
  ].filter(Boolean).join(' ');

  return (
    <td
      className={cellClasses}
      onClick={handleCellClick}
      onKeyDown={!isEditing ? handleKeyDown : undefined}
      tabIndex={isSelected && !isEditing ? 0 : -1}
      title={`${customerName} - Day ${day}`}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          step="0.5"
          min="0"
          max="99"
          className="register-cell-input"
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          style={{ fontSize: `calc(var(--register-font-size) * ${zoom})` }}
        />
      ) : (
        <div className="register-cell-value">
          {saving ? (
            <span className="text-green-500 animate-pulse">•</span>
          ) : isEmpty ? (
            <span className="text-gray-200">—</span>
          ) : (
            <span>{displayValue}</span>
          )}
        </div>
      )}
    </td>
  );
}
