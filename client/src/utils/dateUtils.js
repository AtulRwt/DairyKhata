/**
 * Get days in a month (handles leap years correctly)
 */
export const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

/**
 * Get day of week abbreviation for a given date
 */
export const getDayOfWeek = (day, month, year) => {
  const date = new Date(year, month - 1, day);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
};

/**
 * Check if a day is a weekend
 */
export const isWeekend = (day, month, year) => {
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

/**
 * Check if a day is today
 */
export const isToday = (day, month, year) => {
  const today = new Date();
  return (
    today.getDate() === day &&
    today.getMonth() + 1 === month &&
    today.getFullYear() === year
  );
};

/**
 * Format a date as "01 Aug 2026"
 */
export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format a date as "01 Aug"
 */
export const formatShortDate = (day, month, year) => {
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

/**
 * Get month name from number (1-12)
 */
export const getMonthName = (month) => {
  return new Date(2000, month - 1, 1).toLocaleString('en-IN', { month: 'long' });
};

/**
 * Get array of all months
 */
export const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleString('en-IN', { month: 'long' }),
}));

/**
 * Generate year range
 */
export const getYears = (start = 2020, end = 2030) => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

/**
 * Format currency in INR
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

/**
 * Format number with up to 2 decimal places, removing trailing zeros
 */
export const formatQuantity = (qty) => {
  if (qty === 0 || qty === null || qty === undefined) return '';
  return parseFloat(qty.toFixed(2)).toString();
};

/**
 * Generate UPI deep link
 */
export const generateUPILink = (upiId, businessName, amount) => {
  const encodedName = encodeURIComponent(businessName || 'DairyKhata');
  return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount.toFixed(2)}&cu=INR`;
};

/**
 * Today's date components
 */
export const getToday = () => {
  const now = new Date();
  return {
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};
