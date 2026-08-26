const Customer = require('../models/Customer');
const MilkEntry = require('../models/MilkEntry');
const MonthlyPayment = require('../models/MonthlyPayment');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

// GET /api/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const sellerId = req.sellerId;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const monthStart = new Date(currentYear, currentMonth - 1, 1);
  const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  const [
    totalCustomers,
    activeCustomers,
    totalEmployees,
    todayEntries,
    monthEntries,
    monthPayments,
    recentAudit,
  ] = await Promise.all([
    Customer.countDocuments({ sellerId }),
    Customer.countDocuments({ sellerId, active: true }),
    User.countDocuments({ sellerId, role: 'employee', active: true }),
    MilkEntry.countDocuments({ sellerId, date: { $gte: todayStart, $lte: todayEnd } }),
    MilkEntry.find({ sellerId, date: { $gte: monthStart, $lte: monthEnd } }).lean(),
    MonthlyPayment.find({ sellerId, month: currentMonth, year: currentYear }).lean(),
    AuditLog.find({ sellerId }).sort({ createdAt: -1 }).limit(10)
      .populate('customerId', 'name')
      .populate('performedBy', 'name role')
      .lean(),
  ]);

  let monthMilk = 0;
  let monthRevenue = 0;
  for (const e of monthEntries) {
    monthMilk += e.quantity;
    monthRevenue += e.quantity * e.rateAtTimeOfEntry;
  }

  let totalPending = 0;
  let totalCollected = 0;
  let unpaidCount = 0;
  let paidCount = 0;
  for (const p of monthPayments) {
    totalPending += p.totalAmount - p.amountPaid;
    totalCollected += p.amountPaid;
    if (p.status === 'UNPAID') unpaidCount++;
    else if (p.status === 'PAID') paidCount++;
  }

  return success(res, {
    totalCustomers,
    activeCustomers,
    totalEmployees,
    todayEntries,
    month: currentMonth,
    year: currentYear,
    monthMilk: parseFloat(monthMilk.toFixed(2)),
    monthRevenue: parseFloat(monthRevenue.toFixed(2)),
    totalPending: parseFloat(totalPending.toFixed(2)),
    totalCollected: parseFloat(totalCollected.toFixed(2)),
    unpaidCount,
    paidCount,
    recentActivity: recentAudit,
  });
});

// GET /api/audit?customerId&month&year&limit
const getAuditLog = asyncHandler(async (req, res) => {
  const { customerId, month, year, limit = 50, page = 1 } = req.query;
  const sellerId = req.sellerId;

  const query = { sellerId };
  if (customerId) query.customerId = customerId;
  if (month && year) {
    const m = parseInt(month);
    const y = parseInt(year);
    query.createdAt = {
      $gte: new Date(y, m - 1, 1),
      $lte: new Date(y, m, 0, 23, 59, 59),
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('customerId', 'name phone')
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return success(res, { logs, total, page: parseInt(page), limit: parseInt(limit) });
});

module.exports = { getDashboard, getAuditLog };
